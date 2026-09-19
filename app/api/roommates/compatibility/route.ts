import { NextResponse } from 'next/server';
import { completeStructuredJSON } from '../../../../lib/ai/client';
import { ROOMMATE_COMPATIBILITY_SYSTEM_PROMPT, buildCompatibilityUserPrompt } from '../../../../lib/ai/prompts/compatibility';
import { RoommateCompatibilityResponse } from '../../../../lib/ai/types';
import { validateRoommatePair } from '../../../../lib/validations/roommate';

export const dynamic = 'force-dynamic';

function normalize(str: string | undefined): string {
  if (!str) return '';
  return str.toLowerCase().trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { profileA, profileB } = body;

    // Validate both profiles with alias support and required key checks
    const validation = validateRoommatePair(profileA, profileB);
    if (!validation.isValid) {
      if (validation.missingKeysA.length > 0 || validation.missingKeysB.length > 0) {
        return NextResponse.json(
          { 
            error: 'Profiles are incomplete. They must contain all required preferences.',
            missingKeysA: validation.missingKeysA,
            missingKeysB: validation.missingKeysB
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: validation.error || 'Invalid profile preferences.' },
        { status: 400 }
      );
    }

    const normA = validation.profileA!;
    const normB = validation.profileB!;
    const budgetA = normA.budget;
    const budgetB = normB.budget;

    // ==========================================
    // DETERMINISTIC EVALUATION ENGINE
    // ==========================================
    let score = 0;
    const alignments: string[] = [];
    const conflicts: string[] = [];

    // 1. Budget (15%)
    const diff = Math.abs(budgetA - budgetB);
    if (diff <= 5000) {
      score += 15;
      alignments.push(`Highly aligned budget expectations (₹${budgetA.toLocaleString('en-IN')} and ₹${budgetB.toLocaleString('en-IN')})`);
    } else if (diff <= 15000) {
      score += 10;
      alignments.push(`Manageable budget difference of ₹${diff.toLocaleString('en-IN')}`);
    } else if (diff <= 30000) {
      score += 5;
      conflicts.push(`Significant budget gap of ₹${diff.toLocaleString('en-IN')}`);
    } else {
      conflicts.push(`Major budget mismatch (₹${diff.toLocaleString('en-IN')} difference)`);
    }

    // 2. Sleep Schedule (15%)
    const sleepA = normalize(normA.sleepSchedule);
    const sleepB = normalize(normB.sleepSchedule);
    if (sleepA === sleepB) {
      score += 15;
      if (sleepA.includes('early')) alignments.push('Both prefer early sleep schedules');
      else if (sleepA.includes('night')) alignments.push('Both are night owls');
      else alignments.push('Shared flexible sleep schedules');
    } else if (sleepA.includes('flexible') || sleepB.includes('flexible')) {
      score += 15;
      alignments.push('Compatible sleep schedules due to flexibility');
    } else {
      conflicts.push(`Conflicting sleep schedules (${normA.sleepSchedule} vs ${normB.sleepSchedule})`);
    }

    // 3. Cleanliness (15%)
    const cleanA = normalize(normA.cleanliness);
    const cleanB = normalize(normB.cleanliness);
    if (cleanA === cleanB) {
      score += 15;
      if (cleanA.includes('neat')) alignments.push('Shared preference for a very neat space');
      else if (cleanA.includes('average')) alignments.push('Shared average cleanliness standards');
      else alignments.push('Shared relaxed approach to tidiness');
    } else if ((cleanA.includes('neat') && cleanB.includes('relaxed')) || (cleanA.includes('relaxed') && cleanB.includes('neat'))) {
      conflicts.push(`Major cleanliness mismatch (${normA.cleanliness} vs ${normB.cleanliness})`);
    } else {
      score += 10; // one step difference
      conflicts.push(`Slight difference in cleanliness standards (${normA.cleanliness} vs ${normB.cleanliness})`);
    }

    // 4. Smoking (15%)
    const smokeA = normalize(normA.smoking);
    const smokeB = normalize(normB.smoking);
    if (smokeA === smokeB) {
      score += 15;
      if (smokeA.includes('non-smoker')) alignments.push('Mutual non-smoking household');
      else if (smokeA.includes('outside')) alignments.push('Shared boundary: smoking outside only');
      else alignments.push('Mutual acceptance of smoking');
    } else if ((smokeA === 'non-smoker' && smokeB === 'smoker') || (smokeA === 'smoker' && smokeB === 'non-smoker')) {
      conflicts.push(`Major lifestyle conflict: ${normA.smoking} vs ${normB.smoking}`);
    } else {
      score += 5; // e.g., non-smoker vs outside only
      conflicts.push(`Friction on smoking habits: ${normA.smoking} vs ${normB.smoking}`);
    }

    // 5. Guests (10%)
    const guestsA = normalize(normA.guests);
    const guestsB = normalize(normB.guests);
    if (guestsA === guestsB) {
      score += 10;
      if (guestsA.includes('no guests')) alignments.push('Shared preference for no guests');
      else if (guestsA.includes('occasional')) alignments.push('Shared expectation of occasional guests');
      else alignments.push('Shared highly welcoming guest policy');
    } else if ((guestsA.includes('no guests') && guestsB.includes('frequent')) || (guestsA.includes('frequent') && guestsB.includes('no guests'))) {
      conflicts.push(`Major conflict on guests: ${normA.guests} vs ${normB.guests}`);
    } else {
      score += 5;
      conflicts.push(`Different guest expectations: ${normA.guests} vs ${normB.guests}`);
    }

    // 6. Noise Tolerance (10%)
    const noiseA = normalize(normA.noiseTolerance);
    const noiseB = normalize(normB.noiseTolerance);
    if (noiseA === noiseB) {
      score += 10;
      alignments.push(`Matched noise tolerance (${normA.noiseTolerance})`);
    } else if ((noiseA.includes('low') && noiseB.includes('high')) || (noiseA.includes('high') && noiseB.includes('low'))) {
      conflicts.push(`Major noise tolerance mismatch: ${normA.noiseTolerance} vs ${normB.noiseTolerance}`);
    } else {
      score += 5;
    }

    // 7. Pets (5%)
    const petsA = normalize(normA.pets);
    const petsB = normalize(normB.pets);
    if (petsA === petsB) {
      score += 5;
      if (petsA.includes('no pets')) alignments.push('Shared pet-free preference');
      else if (petsA.includes('has')) alignments.push('Both have pets');
      else alignments.push('Both are pet-friendly');
    } else if ((petsA.includes('has') && petsB.includes('no pets')) || (petsB.includes('has') && petsA.includes('no pets'))) {
      conflicts.push(`Pet conflict: ${normA.pets} vs ${normB.pets}`);
    } else {
      score += 5;
      alignments.push('Compatible pet environment');
    }

    // 8. Social Preferences (5%)
    const socialA = normalize(normA.socialPreferences);
    const socialB = normalize(normB.socialPreferences);
    if (socialA === socialB) {
      score += 5;
      alignments.push(`Aligned social energy levels (${normA.socialPreferences})`);
    } else if ((socialA.includes('very social') && socialB.includes('mostly keep')) || (socialA.includes('mostly keep') && socialB.includes('very social'))) {
      conflicts.push(`Social mismatch: ${normA.socialPreferences} vs ${normB.socialPreferences}`);
    } else {
      score += 3;
    }

    // 9. Work/Study Schedule (5%)
    const workA = normalize(normA.workSchedule);
    const workB = normalize(normB.workSchedule);
    if (workA === workB) {
      score += 5;
      alignments.push('Similar daily routines');
    } else if ((workA.includes('shift') && workB.includes('9 to 5')) || (workA.includes('9 to 5') && workB.includes('shift'))) {
      conflicts.push(`Conflicting daily work schedules (${normA.workSchedule} vs ${normB.workSchedule})`);
    } else {
      score += 3;
    }

    // 10. Food Preferences (5%)
    const foodA = normalize(normA.foodPreferences);
    const foodB = normalize(normB.foodPreferences);
    if (foodA === foodB) {
      score += 5;
      alignments.push(`Shared dietary preference (${normA.foodPreferences})`);
    } else if (foodA.includes('no preference') || foodB.includes('no preference')) {
      score += 5;
      alignments.push('Compatible dietary preferences');
    } else if ((foodA.includes('vegan') && foodB.includes('non-veg')) || (foodB.includes('vegan') && foodA.includes('non-veg'))) {
      conflicts.push(`Different dietary/kitchen habits (${normA.foodPreferences} vs ${normB.foodPreferences})`);
    } else if ((foodA.includes('veg') && foodB.includes('non-veg')) || (foodB.includes('veg') && foodA.includes('non-veg'))) {
      score += 2;
      conflicts.push(`Different dietary/kitchen habits (${normA.foodPreferences} vs ${normB.foodPreferences})`);
    } else {
      score += 4;
    }

    const finalScore = Math.max(0, Math.min(100, score));

    // Construct deterministic breakdown to pass to LLM
    const structuredBreakdown = {
      score: finalScore,
      alignments,
      conflicts,
    };

    const userMessage = buildCompatibilityUserPrompt(normA, normB, structuredBreakdown);

    let compatibilityResult: RoommateCompatibilityResponse;
    try {
      // The LLM now ONLY generates the explanation string based on the provided breakdown.
      // It must return the exact score, alignments, and conflicts we calculated.
      compatibilityResult = await completeStructuredJSON<RoommateCompatibilityResponse>({
        systemPrompt: ROOMMATE_COMPATIBILITY_SYSTEM_PROMPT,
        userMessage,
      });

      // Enforce the deterministic score/arrays in case the LLM tries to change them
      compatibilityResult.score = finalScore;
      compatibilityResult.commonPreferences = alignments;
      compatibilityResult.potentialConflicts = conflicts;

    } catch (aiError) {
      console.warn('AI narrative generation failed, using deterministic fallback explanation:', aiError);
      
      const fallbackExplanation = `Compatibility evaluated at ${finalScore}%. Profiles align on ${alignments.length} lifestyle dimensions including ${alignments.slice(0, 2).join(' and ')}.` + 
        (conflicts.length > 0 ? ` Key differences to discuss include ${conflicts.slice(0, 2).join(' and ')}.` : ' No major conflicts detected.');

      compatibilityResult = {
        score: finalScore,
        explanation: fallbackExplanation,
        commonPreferences: alignments,
        potentialConflicts: conflicts,
      };
    }

    // Validate that the score has an explanation
    if (compatibilityResult.score !== undefined && !compatibilityResult.explanation) {
      return NextResponse.json(
        { error: 'AI generated a score without an explanation. This violates product principles.' },
        { status: 500 }
      );
    }

    return NextResponse.json(compatibilityResult, { status: 200 });

  } catch (error: unknown) {
    console.error('Error in roommate compatibility API:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: 'Failed to evaluate compatibility.', details: message },
      { status: 500 }
    );
  }
}
