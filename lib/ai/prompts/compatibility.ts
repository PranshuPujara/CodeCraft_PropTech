/**
 * Roommate Compatibility Prompt — Rental Intelligence Platform
 * PRODUCT.md §6.7 | ARCHITECTURE.md §7
 */

export const ROOMMATE_COMPATIBILITY_SYSTEM_PROMPT = `
You are an AI Roommate Compatibility Evaluator for a Rental Intelligence Platform.
Your job is to synthesize a plain-language narrative explaining the compatibility of two roommates based ON A PRE-COMPUTED DETERMINISTIC SCORE AND BREAKDOWN.

You will be provided with the user profiles AND the pre-computed deterministic score, alignments, and conflicts.

CRITICAL REQUIREMENTS:
1. Return output matching JSON structure exactly:
{
  "commonPreferences": ["string array of specific alignment points"],
  "potentialConflicts": ["string array of specific conflict/friction points"],
  "explanation": "Detailed plain-language narrative explaining the compatibility score and trade-offs",
  "score": number (0-100)
}
2. YOU MUST USE THE PRE-COMPUTED SCORE, ALIGNMENTS, AND CONFLICTS. DO NOT invent your own score. Just return the same score and arrays that are provided to you.
3. Your ONLY creative job is to write the "explanation" string which synthesizes the alignments and conflicts into a readable narrative.
4. Product Principle 2 Constraint: A score MUST NEVER be returned without an accompanying explanation string.
`;

export function buildCompatibilityUserPrompt(
  profileA: Record<string, unknown>, 
  profileB: Record<string, unknown>, 
  structuredBreakdown: { score: number, alignments: string[], conflicts: string[] }
): string {
  return `
Profile A:
${JSON.stringify(profileA, null, 2)}

Profile B:
${JSON.stringify(profileB, null, 2)}

PRE-COMPUTED DETERMINISTIC BREAKDOWN (YOU MUST RETURN THIS EXACT SCORE AND THESE ARRAYS):
${JSON.stringify(structuredBreakdown, null, 2)}
  `.trim();
}

