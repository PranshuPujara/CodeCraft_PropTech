/**
 * AI Rental Copilot Prompt — Rental Intelligence Platform
 * PRODUCT.md §6.9 | ARCHITECTURE.md §7
 */

import { UserCopilotContext } from '../copilotContext';
import { LEGAL_GUARDRAIL_DISCLAIMER } from '../types';

export const COPILOT_SYSTEM_PROMPT = `
You are the AI Rental Copilot.
Your job is to answer user questions strictly grounded in the user's actual data (saved/shortlisted properties, cost breakdowns, agreement extractions, roommate profiles).

SUPPORTED CORE QUESTIONS:
1. "Can I afford this apartment?"
2. "Explain this agreement clause."
3. "Compare these properties."
4. "What is my actual monthly cost?"
5. "Why was this property recommended?"
6. "What should I pay attention to?"

CRITICAL REQUIREMENTS:
1. Return output matching JSON structure:
{
  "answer": "Grounded plain-language answer",
  "contextRefs": [
    {
      "type": "property" | "agreement" | "cost" | "roommate",
      "id": "string",
      "name": "string"
    }
  ],
  "missingDataNotice": "Optional notice if requested data is not found in user's profile"
}
2. Grounding Constraint: Use ONLY information provided in the context. If required information is missing from the user's data, state so clearly in missingDataNotice rather than inventing details.
3. Preserve the legal advice guardrail for agreement-related questions: Informational assistance only. ${LEGAL_GUARDRAIL_DISCLAIMER}
`;

export function buildCopilotUserPrompt(query: string, context: UserCopilotContext): string {
  const money = (v: number) => `₹${new Intl.NumberFormat('en-IN').format(v)}`;

  let prompt = `USER INQUIRY: "${query}"\n\n`;
  prompt += `=== USER PROFILE ===\n`;
  prompt += `Name: ${context.user.name}\n`;
  prompt += `Stated Monthly Budget: ${money(context.user.budget)}\n`;
  prompt += `Preferences: ${JSON.stringify(context.user.preferences)}\n\n`;

  prompt += `=== SAVED / SHORTLISTED PROPERTIES (${context.savedProperties.length}) ===\n`;
  if (context.savedProperties.length === 0) {
    prompt += `(None saved yet)\n\n`;
  } else {
    context.savedProperties.forEach((p, idx) => {
      prompt += `${idx + 1}. [ID: ${p.id}] ${p.title} (${p.bedrooms} BHK, ${p.furnishing}) in ${p.location}\n`;
      prompt += `   • Base Listed Rent: ${money(p.rent)}/mo | Deposit: ${money(p.deposit)} | Brokerage: ${money(p.brokerage)}\n`;
      if (p.costBreakdown) {
        prompt += `   • Estimated True Monthly Cost: ${money(p.costBreakdown.estimatedMonthlyCost)}/mo\n`;
        prompt += `   • Initial Move-in Cash Required: ${money(p.costBreakdown.initialMoveInCost)}\n`;
        prompt += `   • Monthly Breakdown: Maintenance ${money(p.costBreakdown.maintenance)}, Electricity ${money(p.costBreakdown.electricity)}, Water ${money(p.costBreakdown.water)}, Internet ${money(p.costBreakdown.internet)}, Transport ${money(p.costBreakdown.transport)}, Other ${money(p.costBreakdown.otherRecurring)}\n`;
      }
      prompt += `   • Amenities: ${p.amenities.join(', ')}\n\n`;
    });
  }

  prompt += `=== UPLOADED LEASE AGREEMENTS (${context.agreements.length}) ===\n`;
  if (context.agreements.length === 0) {
    prompt += `(None uploaded yet)\n\n`;
  } else {
    context.agreements.forEach((a, idx) => {
      prompt += `${idx + 1}. [ID: ${a.id}] File: ${a.fileName} (Uploaded: ${a.uploadedAt})\n`;
      prompt += `   • Summary: ${a.summary}\n`;
      prompt += `   • Extracted Fields: ${JSON.stringify(a.extractedFields)}\n`;
      prompt += `   • Flagged Clauses: ${JSON.stringify(a.flaggedClauses)}\n\n`;
    });
  }

  prompt += `=== ROOMMATE DATA (${context.roommates.length}) ===\n`;
  if (context.roommates.length > 0) {
    prompt += `${JSON.stringify(context.roommates)}\n\n`;
  } else {
    prompt += `(No roommate profiles)\n\n`;
  }

  prompt += `INSTRUCTIONS:\n`;
  prompt += `1. Answer the user inquiry directly using only the data above.\n`;
  prompt += `2. If the user asks about an apartment, clause, or comparison, reference the real properties/agreements by their exact ID and name in contextRefs.\n`;
  prompt += `3. If the user asks about data not present in the records above, explicitly set missingDataNotice and explain what is missing.\n`;
  prompt += `4. Respond in valid JSON with "answer", "contextRefs", and optional "missingDataNotice".\n`;

  return prompt;
}
