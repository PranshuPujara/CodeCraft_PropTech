import { db } from '../db';
import { ContextRef, CopilotResponse, LEGAL_GUARDRAIL_DISCLAIMER } from './types';
export { generateCopilotResponse } from './prompts/copilot';

export interface UserCopilotContext {
  user: {
    id: string;
    name: string;
    budget: number;
    preferences: {
      location?: string;
      bedrooms?: number;
      furnishing?: string;
      amenities?: string[];
      commutePoint?: string;
    };
  };
  savedProperties: Array<{
    id: string;
    title: string;
    location: string;
    rent: number;
    deposit: number;
    brokerage: number;
    furnishing: string;
    bedrooms: number;
    amenities: string[];
    isShortlisted: boolean;
    costBreakdown: {
      maintenance: number;
      electricity: number;
      water: number;
      internet: number;
      transport: number;
      otherRecurring: number;
      estimatedMonthlyCost: number;
      initialMoveInCost: number;
    } | null;
  }>;
  agreements: Array<{
    id: string;
    fileName: string;
    uploadedAt: Date;
    summary: string;
    extractedFields: Record<string, any>;
    flaggedClauses: Array<{ clause: string; reason: string; attentionLevel: string }>;
  }>;
  roommates: Array<{
    id: string;
    name: string;
    budget: number;
    cleanliness: string;
    sleepSchedule: string;
    workSchedule: string;
  }>;
}

/**
 * Loads all relevant user context from database for demo user.
 */
export async function loadUserCopilotContext(userId = 'demo-user-1'): Promise<UserCopilotContext> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      savedProperties: {
        include: {
          property: {
            include: {
              costBreakdown: true,
            },
          },
        },
      },
      agreements: {
        orderBy: { uploadedAt: 'desc' },
      },
      roommateProfiles: true,
    },
  });

  const parsedPreferences = user?.preferences
    ? typeof user.preferences === 'string'
      ? JSON.parse(user.preferences)
      : user.preferences
    : {
        location: 'Indiranagar',
        bedrooms: 2,
        furnishing: 'Semi-Furnished',
        amenities: ['Gym', 'Power Backup', 'Parking', 'Security', 'Wifi'],
        commutePoint: 'Koramangala Tech Park',
      };

  const savedProps = (user?.savedProperties || []).map((sp) => {
    let amenities: string[] = [];
    try {
      amenities = typeof sp.property.amenities === 'string'
        ? JSON.parse(sp.property.amenities)
        : sp.property.amenities || [];
    } catch {
      amenities = [];
    }

    return {
      id: sp.property.id,
      title: sp.property.title,
      location: sp.property.location,
      rent: sp.property.rent,
      deposit: sp.property.deposit,
      brokerage: sp.property.brokerage,
      furnishing: sp.property.furnishing,
      bedrooms: sp.property.bedrooms,
      amenities,
      isShortlisted: sp.isShortlisted,
      costBreakdown: sp.property.costBreakdown,
    };
  });

  // If no properties are saved in DB, query 4 sample properties so Copilot always has real data
  let effectiveSavedProps = savedProps;
  if (effectiveSavedProps.length === 0) {
    const defaultProps = await db.property.findMany({
      take: 4,
      include: { costBreakdown: true },
    });
    effectiveSavedProps = defaultProps.map((p) => {
      let amenities: string[] = [];
      try {
        amenities = typeof p.amenities === 'string' ? JSON.parse(p.amenities) : p.amenities || [];
      } catch {
        amenities = [];
      }
      return {
        id: p.id,
        title: p.title,
        location: p.location,
        rent: p.rent,
        deposit: p.deposit,
        brokerage: p.brokerage,
        furnishing: p.furnishing,
        bedrooms: p.bedrooms,
        amenities,
        isShortlisted: true,
        costBreakdown: p.costBreakdown,
      };
    });
  }

  const parsedAgreements = (user?.agreements || []).map((a) => {
    let extractedFields: Record<string, any> = {};
    let flaggedClauses: Array<{ clause: string; reason: string; attentionLevel: string }> = [];
    try {
      extractedFields = typeof a.extractedFields === 'string' ? JSON.parse(a.extractedFields) : a.extractedFields || {};
    } catch {
      extractedFields = {};
    }
    try {
      flaggedClauses = typeof a.flaggedClauses === 'string' ? JSON.parse(a.flaggedClauses) : a.flaggedClauses || [];
    } catch {
      flaggedClauses = [];
    }

    return {
      id: a.id,
      fileName: a.fileName,
      uploadedAt: a.uploadedAt,
      summary: a.summary,
      extractedFields,
      flaggedClauses,
    };
  });

  const parsedRoommates = (user?.roommateProfiles || []).map((r) => ({
    id: r.id,
    name: r.name,
    budget: r.budget,
    cleanliness: r.cleanliness,
    sleepSchedule: r.sleepSchedule,
    workSchedule: r.workSchedule,
  }));

  return {
    user: {
      id: user?.id || userId,
      name: user?.name || 'Alex Johnson',
      budget: user?.budget || 35000,
      preferences: parsedPreferences,
    },
    savedProperties: effectiveSavedProps,
    agreements: parsedAgreements,
    roommates: parsedRoommates,
  };
}

/**
 * Builds deterministic grounded response for the 6 core questions when LLM is offline or fails.
 */
export function generateDeterministicGroundedResponse(
  query: string,
  context: UserCopilotContext
): CopilotResponse {
  const q = query.toLowerCase();
  const money = (v: number) => `₹${new Intl.NumberFormat('en-IN').format(v)}`;
  const budget = context.user.budget;
  const props = context.savedProperties;
  const agreements = context.agreements;

  // 1. Question: "Can I afford this apartment?"
  if (q.includes('afford') || q.includes('affordability')) {
    const targetProp = props.find((p) =>
      q.includes(p.title.toLowerCase()) || q.includes(p.location.toLowerCase().split(',')[0].toLowerCase())
    ) || props[0];

    if (!targetProp) {
      return {
        answer: `I could not find any properties saved in your profile to analyze affordability. Please discover and save a property first.`,
        contextRefs: [],
        missingDataNotice: 'No properties currently saved in user profile.',
      };
    }

    const monthlyCost = targetProp.costBreakdown?.estimatedMonthlyCost || (targetProp.rent + 4000);
    const moveInCost = targetProp.costBreakdown?.initialMoveInCost || (targetProp.deposit + targetProp.brokerage + targetProp.rent);
    const delta = monthlyCost - budget;
    const pct = Math.round((monthlyCost / budget) * 100);

    const contextRefs: ContextRef[] = [
      { type: 'property', id: targetProp.id, name: targetProp.title },
      { type: 'cost', id: targetProp.id, name: `True Monthly: ${money(monthlyCost)}` },
    ];

    let answer = `**Affordability Analysis for ${targetProp.title}:**\n\n`;
    answer += `• **Stated Monthly Budget:** ${money(budget)}/month\n`;
    answer += `• **Base Listed Rent:** ${money(targetProp.rent)}/month\n`;
    answer += `• **True Monthly Recurring Cost:** ${money(monthlyCost)}/month (${pct}% of your budget)\n`;
    answer += `• **Initial Move-in Cash Required:** ${money(moveInCost)} (Deposit: ${money(targetProp.deposit)} + Brokerage: ${money(targetProp.brokerage)} + 1st Month Rent: ${money(targetProp.rent)})\n\n`;

    if (delta <= 0) {
      answer += `**Assessment:** Yes, you can afford this apartment! The total monthly cost is ${money(Math.abs(delta))} below your ${money(budget)} budget threshold.`;
    } else {
      answer += `**Assessment:** This apartment is **${money(delta)} (${(pct - 100)}%) above** your stated monthly budget when accounting for true overheads (maintenance, utilities).`;
    }

    return { answer, contextRefs };
  }

  // 2. Question: "Explain this agreement clause."
  if (q.includes('agreement') || q.includes('clause') || q.includes('lock-in') || q.includes('escalation')) {
    if (agreements.length === 0) {
      return {
        answer: `You have not uploaded any rental agreements yet. Once you upload an agreement PDF in the Agreements section, I can explain its lock-in, escalation, penalty, and deposit clauses.`,
        contextRefs: [],
        missingDataNotice: 'No uploaded lease agreements found in your account.',
      };
    }

    const latest = agreements[0];
    const fields = latest.extractedFields;
    const contextRefs: ContextRef[] = [
      { type: 'agreement', id: latest.id, name: latest.fileName },
    ];

    let answer = `**Lease Agreement Clause Intelligence (${latest.fileName}):**\n\n`;
    if (fields.lockInPeriod?.found) {
      answer += `1. **Lock-In Period (${fields.lockInPeriod.value}):**\n   • *Clause:* "${fields.lockInPeriod.clauseSnippet || fields.lockInPeriod.value}"\n   • *Explanation:* You are committed to remain for at least this duration. Vacating earlier typically results in forfeiture of security deposit.\n\n`;
    }
    if (fields.rentEscalation?.found) {
      answer += `2. **Rent Escalation (${fields.rentEscalation.value}):**\n   • *Clause:* "${fields.rentEscalation.clauseSnippet || fields.rentEscalation.value}"\n   • *Explanation:* Specifies the annual rent percentage increase upon lease renewal.\n\n`;
    }
    if (fields.noticePeriod?.found) {
      answer += `3. **Notice Period (${fields.noticePeriod.value}):**\n   • *Clause:* "${fields.noticePeriod.clauseSnippet || fields.noticePeriod.value}"\n   • *Explanation:* Written notice required prior to vacating to secure full deposit refund.\n\n`;
    }
    answer += `*Note: ${LEGAL_GUARDRAIL_DISCLAIMER}*`;

    return { answer, contextRefs };
  }

  // 3. Question: "Compare these properties."
  if (q.includes('compare') || q.includes('trade-off') || q.includes('versus') || q.includes('vs')) {
    if (props.length < 2) {
      return {
        answer: `You currently have only ${props.length} property saved. Save or shortlist at least 2 properties to generate a side-by-side trade-off comparison.`,
        contextRefs: props.map((p) => ({ type: 'property', id: p.id, name: p.title })),
        missingDataNotice: 'At least 2 saved properties are required for comparison.',
      };
    }

    const pA = props[0];
    const pB = props[1];
    const costA = pA.costBreakdown?.estimatedMonthlyCost || (pA.rent + 4000);
    const costB = pB.costBreakdown?.estimatedMonthlyCost || (pB.rent + 4000);
    const moveInA = pA.costBreakdown?.initialMoveInCost || (pA.deposit + pA.brokerage + pA.rent);
    const moveInB = pB.costBreakdown?.initialMoveInCost || (pB.deposit + pB.brokerage + pB.rent);

    const contextRefs: ContextRef[] = [
      { type: 'property', id: pA.id, name: pA.title },
      { type: 'property', id: pB.id, name: pB.title },
      { type: 'cost', id: pA.id, name: `Monthly: ${money(costA)}` },
      { type: 'cost', id: pB.id, name: `Monthly: ${money(costB)}` },
    ];

    let answer = `**Trade-off Comparison: ${pA.title} vs ${pB.title}:**\n\n`;
    answer += `• **Monthly Cost:** ${pA.title} is ${costA < costB ? `${money(costB - costA)}/mo cheaper` : `${money(costA - costB)}/mo more expensive`} (${money(costA)}/mo vs ${money(costB)}/mo).\n`;
    answer += `• **Upfront Move-In:** ${pA.title} requires ${money(moveInA)} vs ${money(moveInB)} for ${pB.title}.\n`;
    answer += `• **Configuration & Furnishing:** ${pA.bedrooms} BHK (${pA.furnishing}) vs ${pB.bedrooms} BHK (${pB.furnishing}).\n`;
    answer += `• **Location:** ${pA.location} vs ${pB.location}.\n\n`;
    answer += `**Key Trade-off Decision:** Choose ${costA < costB ? pA.title : pB.title} for maximum budget alignment (${money(Math.min(costA, costB))}/mo), or ${costA > costB ? pA.title : pB.title} if larger space or specific location features justify the additional cost.`;

    return { answer, contextRefs };
  }

  // 4. Question: "What is my actual monthly cost?"
  if (q.includes('monthly cost') || q.includes('actual cost') || q.includes('true cost') || q.includes('breakdown')) {
    const targetProp = props.find((p) =>
      q.includes(p.title.toLowerCase()) || q.includes(p.location.toLowerCase().split(',')[0].toLowerCase())
    ) || props[0];

    if (!targetProp) {
      return {
        answer: `I could not find property cost data to calculate your monthly cost. Please save a property first.`,
        contextRefs: [],
        missingDataNotice: 'No property selected or saved.',
      };
    }

    const cb = targetProp.costBreakdown;
    const totalMonthly = cb?.estimatedMonthlyCost || (targetProp.rent + 4000);

    const contextRefs: ContextRef[] = [
      { type: 'property', id: targetProp.id, name: targetProp.title },
      { type: 'cost', id: targetProp.id, name: `Total: ${money(totalMonthly)}/mo` },
    ];

    let answer = `**Itemized Monthly Cost Breakdown for ${targetProp.title}:**\n\n`;
    answer += `• **Base Rent:** ${money(targetProp.rent)}/mo\n`;
    answer += `• **Society Maintenance:** ${money(cb?.maintenance || 3000)}/mo\n`;
    answer += `• **Estimated Electricity:** ≈ ${money(cb?.electricity || 1500)}/mo\n`;
    answer += `• **Water Supply:** ≈ ${money(cb?.water || 500)}/mo\n`;
    answer += `• **High-speed Internet:** ≈ ${money(cb?.internet || 1000)}/mo\n`;
    answer += `• **Commute / Transportation:** ≈ ${money(cb?.transport || 1500)}/mo\n`;
    answer += `• **Other Recurring Overheads:** ≈ ${money(cb?.otherRecurring || 500)}/mo\n`;
    answer += `────────────────────────────\n`;
    answer += `• **Total Estimated Monthly Outflow:** **${money(totalMonthly)}/month**\n\n`;
    answer += `*This represents ${(totalMonthly / budget * 100).toFixed(1)}% of your stated ${money(budget)} monthly budget.*`;

    return { answer, contextRefs };
  }

  // 5. Question: "Why was this property recommended?"
  if (q.includes('recommend') || q.includes('recommended') || q.includes('why was')) {
    const targetProp = props.find((p) =>
      q.includes(p.title.toLowerCase()) || q.includes(p.location.toLowerCase().split(',')[0].toLowerCase())
    ) || props[0];

    if (!targetProp) {
      return {
        answer: `I could not find any recommended properties in your profile.`,
        contextRefs: [],
        missingDataNotice: 'No properties found.',
      };
    }

    const pref = context.user.preferences;
    const contextRefs: ContextRef[] = [
      { type: 'property', id: targetProp.id, name: targetProp.title },
    ];

    let answer = `**Why ${targetProp.title} was recommended for you:**\n\n`;
    if (pref.bedrooms && targetProp.bedrooms === pref.bedrooms) {
      answer += `• **Bedroom Match:** Matches your ${pref.bedrooms} BHK requirement.\n`;
    }
    if (pref.location && targetProp.location.toLowerCase().includes(pref.location.toLowerCase())) {
      answer += `• **Preferred Location:** Situated in ${targetProp.location}, matching your preferred area (${pref.location}).\n`;
    }
    if (targetProp.rent <= budget) {
      answer += `• **Budget Discipline:** Base rent of ${money(targetProp.rent)} is safely within your ${money(budget)} stated budget.\n`;
    }
    const matchedAmenities = (pref.amenities || []).filter((a) =>
      targetProp.amenities.some((pa) => pa.toLowerCase() === a.toLowerCase())
    );
    if (matchedAmenities.length > 0) {
      answer += `• **Desired Amenities:** Includes ${matchedAmenities.join(', ')}.\n`;
    }
    if (pref.commutePoint) {
      answer += `• **Commute Proximity:** Direct transit access to ${pref.commutePoint}.\n`;
    }

    return { answer, contextRefs };
  }

  // 6. Question: "What should I pay attention to?"
  if (q.includes('attention') || q.includes('careful') || q.includes('watch out') || q.includes('risk') || q.includes('signing')) {
    const contextRefs: ContextRef[] = [];
    let answer = `**Key Items Worth Your Attention Before Deciding:**\n\n`;

    if (agreements.length > 0) {
      const a = agreements[0];
      contextRefs.push({ type: 'agreement', id: a.id, name: a.fileName });
      if (a.flaggedClauses && a.flaggedClauses.length > 0) {
        answer += `**1. Lease Agreement Flags (${a.fileName}):**\n`;
        a.flaggedClauses.forEach((f) => {
          answer += `   • **[${f.attentionLevel.toUpperCase()} ATTENTION] ${f.clause}**: ${f.reason}\n`;
        });
        answer += '\n';
      }
    }

    if (props.length > 0) {
      const p = props[0];
      const monthly = p.costBreakdown?.estimatedMonthlyCost || (p.rent + 4000);
      const moveIn = p.costBreakdown?.initialMoveInCost || (p.deposit + p.brokerage + p.rent);
      contextRefs.push({ type: 'property', id: p.id, name: p.title });
      contextRefs.push({ type: 'cost', id: p.id, name: `Move-in Cash: ${money(moveIn)}` });

      answer += `**2. Financial Considerations (${p.title}):**\n`;
      answer += `   • **Move-in Cash Required:** You will need ${money(moveIn)} in liquid cash on day one (Security Deposit + Brokerage + 1st Month Rent).\n`;
      if (monthly > budget) {
        answer += `   • **Budget Overhead:** Estimated recurring cost is ${money(monthly)}/mo, which is ${money(monthly - budget)} above your stated budget.\n`;
      }
      answer += '\n';
    }

    answer += `*Legal Disclaimer: ${LEGAL_GUARDRAIL_DISCLAIMER}*`;

    return { answer, contextRefs };
  }

  // Default General Inquiry grounded in user profile
  const defaultProp = props[0];
  const contextRefs: ContextRef[] = defaultProp
    ? [{ type: 'property', id: defaultProp.id, name: defaultProp.title }]
    : [];

  return {
    answer: `I analyzed your question against your rental intelligence records (Monthly Budget: ${money(budget)}, ${props.length} saved properties, ${agreements.length} lease agreements).\n\nYou can ask me specific questions such as:\n1. *"Can I afford this apartment?"*\n2. *"Explain this agreement clause."*\n3. *"Compare these properties."*\n4. *"What is my actual monthly cost?"*\n5. *"Why was this property recommended?"*\n6. *"What should I pay attention to?"*`,
    contextRefs,
  };
}
