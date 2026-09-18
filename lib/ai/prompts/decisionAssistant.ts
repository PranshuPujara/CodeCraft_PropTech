/**
 * Multi-Property Decision Assistant Prompt & Context Builder
 * Rental Intelligence Platform — PRODUCT.md §6.8 | ARCHITECTURE.md §7
 * 
 * Generates an explainable decision-support narrative weighing shortlisted
 * properties against actual user preferences, true recurring costs, and trade-offs.
 */

import type { DecisionAssistantResponse, DecisionAssistantPropertyAnalysis } from '../types';

export interface DecisionUserPreferences {
  budget: number;
  location?: string;
  bedrooms?: number;
  furnishing?: string;
  amenities?: string[];
  commutePoint?: string;
  maxCommuteMinutes?: number;
  priority?: string;
}

export interface ShortlistedPropertyContext {
  id: string;
  title: string;
  location: string;
  rent: number;
  deposit: number;
  brokerage: number;
  furnishing: string;
  bedrooms: number;
  amenities: string[];
  description?: string;
  commute?: string;
  cost: {
    estimatedMonthlyCost: number;
    initialMoveInCost: number;
    maintenance: number;
    electricity: number;
    water: number;
    internet: number;
    transport: number;
    otherRecurring: number;
    affordabilitySignal?: string;
    affordabilityStatus?: string;
  };
}

export const DECISION_ASSISTANT_SYSTEM_PROMPT = `
You are an AI Multi-Property Decision Assistant for a Rental Intelligence Platform.
Your purpose is DECISION SUPPORT — you help renters objectively understand the trade-offs between shortlisted properties.

CRITICAL DECISION PRINCIPLES & CONSTRAINTS:
1. DECISION SUPPORT ONLY: You MUST NOT choose the property for the user or declare a "Winner", "Best Property", or "Recommended Pick". Use objective framing such as "Based on your stated preferences...", "A key trade-off to consider...", "An advantage of...", "A consideration...".
2. GROUNDING: Use ONLY the supplied user preferences and property data. NEVER invent facts, costs, commute times, or amenities.
3. NO INVENTED PREFERENCES: If the user did not state a preference (e.g., commute or specific amenities), state that it was not provided rather than guessing.
4. TRUE COST FOCUS: Reason about the total estimated monthly cost (rent + utilities + maintenance + transport) alongside base rent.
5. NO LEGAL ADVICE: Do not evaluate legal enforceability or draw legal conclusions.
6. RETURN STRICT JSON conforming to this schema:
{
  "summary": "Synthesized narrative comparing the shortlisted properties against user preferences and explaining core trade-offs.",
  "keyTradeoffs": [
    "Specific trade-off sentence comparing property differences (e.g. cost savings vs commute time)."
  ],
  "properties": [
    {
      "propertyId": "string",
      "propertyName": "string",
      "pros": ["Specific factual advantages of this property based on preferences/cost"],
      "cons": ["Specific factual drawbacks or trade-offs for this property"],
      "preferenceAlignment": ["Explicit statement of how this property aligns or differs from preferences"],
      "tradeoffs": ["What you gain vs what you sacrifice by choosing this option"]
    }
  ]
}
`.trim();

/**
 * Builds structured prompt context for the Decision Assistant.
 */
export function buildDecisionAssistantUserPrompt(
  preferences: DecisionUserPreferences,
  shortlistedProperties: ShortlistedPropertyContext[],
  comparisonTradeoffs?: Array<{ dimension: string; statement: string }>
): string {
  const prefsSummary = {
    monthlyBudget: `₹${new Intl.NumberFormat('en-IN').format(preferences.budget)}/month`,
    preferredLocation: preferences.location || 'Not specified',
    requiredBedrooms: preferences.bedrooms ? `${preferences.bedrooms} BHK` : 'Not specified',
    furnishingPreference: preferences.furnishing || 'Not specified',
    desiredAmenities: preferences.amenities?.length ? preferences.amenities : 'Not specified',
    commuteDestination: preferences.commutePoint || 'Not specified',
    maxCommuteTime: preferences.maxCommuteMinutes ? `${preferences.maxCommuteMinutes} min` : 'Not specified',
    priority: preferences.priority || 'Balanced',
  };

  const propertiesSummary = shortlistedProperties.map((p) => ({
    id: p.id,
    title: p.title,
    location: p.location,
    listedRent: `₹${p.rent}/mo`,
    estimatedTotalMonthlyCost: `₹${p.cost.estimatedMonthlyCost}/mo (includes maintenance: ₹${p.cost.maintenance}, utilities: ₹${p.cost.electricity + p.cost.water + p.cost.internet}, commute: ₹${p.cost.transport})`,
    initialMoveInCost: `₹${p.cost.initialMoveInCost} (Deposit: ₹${p.deposit}, Brokerage: ₹${p.brokerage}, 1st month rent: ₹${p.rent})`,
    bedrooms: `${p.bedrooms} BHK`,
    furnishing: p.furnishing,
    amenities: p.amenities,
    commute: p.commute || 'Not listed',
    affordabilitySignal: p.cost.affordabilitySignal || 'Uncalculated',
  }));

  return `
USER STATED PREFERENCES:
${JSON.stringify(prefsSummary, null, 2)}

SHORTLISTED PROPERTIES TO EVALUATE (${shortlistedProperties.length} total):
${JSON.stringify(propertiesSummary, null, 2)}

${comparisonTradeoffs?.length ? `PRE-COMPUTED TRADE-OFFS:\n${JSON.stringify(comparisonTradeoffs, null, 2)}` : ''}

Please evaluate these shortlisted properties against the user's explicit preferences.
`.trim();
}

/**
 * Deterministic fallback generator for when Anthropic API is unavailable or rate-limited.
 * Grounded in exact property and preference data with zero hallucination.
 */
export function generateDeterministicDecisionSupport(
  preferences: DecisionUserPreferences,
  properties: ShortlistedPropertyContext[]
): DecisionAssistantResponse {
  const money = (v: number) => `₹${new Intl.NumberFormat('en-IN').format(v)}`;
  const budget = preferences.budget;

  const propertyAnalyses: DecisionAssistantPropertyAnalysis[] = properties.map((p) => {
    const pros: string[] = [];
    const cons: string[] = [];
    const alignments: string[] = [];
    const tradeoffs: string[] = [];

    // Monthly Cost Check
    const monthlyCost = p.cost.estimatedMonthlyCost;
    if (monthlyCost <= budget) {
      pros.push(`Estimated true monthly cost (${money(monthlyCost)}) stays within your ${money(budget)} budget target.`);
      alignments.push(`Under monthly budget by ${money(budget - monthlyCost)}.`);
    } else {
      cons.push(`Estimated monthly cost (${money(monthlyCost)}) exceeds stated ${money(budget)} budget by ${money(monthlyCost - budget)}.`);
      alignments.push(`Exceeds monthly budget by ~${Math.round(((monthlyCost - budget) / budget) * 100)}%.`);
    }

    // Bedroom check
    if (preferences.bedrooms) {
      if (p.bedrooms === preferences.bedrooms) {
        pros.push(`Matches exact bedroom preference (${p.bedrooms} BHK).`);
        alignments.push(`Exact ${p.bedrooms} BHK configuration match.`);
      } else {
        cons.push(`Offers ${p.bedrooms} BHK instead of your stated ${preferences.bedrooms} BHK preference.`);
        alignments.push(`Bedrooms differ from ${preferences.bedrooms} BHK preference.`);
      }
    }

    // Furnishing check
    if (preferences.furnishing && preferences.furnishing !== 'Any') {
      if (p.furnishing.toLowerCase().includes(preferences.furnishing.toLowerCase())) {
        pros.push(`Furnishing matches preference: ${p.furnishing}.`);
        alignments.push(`Matches ${preferences.furnishing} requirement.`);
      } else {
        cons.push(`Is ${p.furnishing}, differing from preferred ${preferences.furnishing}.`);
      }
    }

    // Move-in cash
    if (p.cost.initialMoveInCost > p.rent * 4) {
      cons.push(`Requires substantial upfront capital of ${money(p.cost.initialMoveInCost)} (deposit + brokerage + rent).`);
    } else {
      pros.push(`Initial move-in cash is ${money(p.cost.initialMoveInCost)}.`);
    }

    // Commute
    if (p.commute) {
      pros.push(`Commute time: ${p.commute}.`);
    }

    // Trade-off formulation
    tradeoffs.push(
      `${p.title} offers ${p.furnishing} living in ${p.location} at ${money(monthlyCost)}/mo, balancing upfront move-in cash against recurring overhead.`
    );

    return {
      propertyId: p.id,
      propertyName: p.title,
      pros: pros.length ? pros : [`Base rent is ${money(p.rent)}/month.`],
      cons: cons.length ? cons : ['Requires factoring in recurring society utilities.'],
      preferenceAlignment: alignments.length ? alignments : ['Available preference dimensions evaluated.'],
      tradeoffs,
    };
  });

  const sortedByCost = [...properties].sort(
    (a, b) => a.cost.estimatedMonthlyCost - b.cost.estimatedMonthlyCost
  );
  const lowestCost = sortedByCost[0];
  const highestCost = sortedByCost[sortedByCost.length - 1];
  const costDelta = highestCost.cost.estimatedMonthlyCost - lowestCost.cost.estimatedMonthlyCost;

  const keyTradeoffs = [
    `Monthly cost variance: ${lowestCost.title} saves ${money(costDelta)}/month (${money(costDelta * 12)} annually) compared to ${highestCost.title}.`,
    `Upfront cash difference: Move-in requirements range from ${money(lowestCost.cost.initialMoveInCost)} to ${money(highestCost.cost.initialMoveInCost)}.`,
    `Location & setup: Consider whether furnished convenience outweighs the recurring cost differential between options.`,
  ];

  const summary = `Based on your stated budget of ${money(budget)}/month, evaluating your ${properties.length} shortlisted properties reveals a key trade-off between monthly cost discipline and ready-to-move convenience. ${lowestCost.title} offers the lowest total monthly commitment at ${money(lowestCost.cost.estimatedMonthlyCost)}, saving approximately ${money(costDelta)} each month. Meanwhile, alternative options may offer ready furnishings or closer commute proximity at a higher budget commitment.`;

  return {
    summary,
    narrative: summary,
    properties: propertyAnalyses,
    propertyProsCons: propertyAnalyses.map((p) => ({
      propertyId: p.propertyId,
      propertyName: p.propertyName,
      pros: p.pros,
      cons: p.cons,
      preferenceAlignment: p.preferenceAlignment,
      tradeoffs: p.tradeoffs,
    })),
    keyTradeoffs,
  };
}
