import { NextResponse } from 'next/server';
import { completeStructuredJSON } from '../../../../lib/ai/client';
import { ROOMMATE_COMPATIBILITY_SYSTEM_PROMPT, buildCompatibilityUserPrompt } from '../../../../lib/ai/prompts/compatibility';
import { FrictionPoint, RoommateCompatibilityResponse } from '../../../../lib/ai/types';
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
    const frictionPoints: FrictionPoint[] = [];

    // 1. Budget (15%)
    let budgetScore = 0;
    const diff = Math.abs(budgetA - budgetB);
    if (diff <= 5000) {
      budgetScore = 15;
      score += 15;
      alignments.push(`Highly aligned budget expectations (₹${budgetA.toLocaleString('en-IN')} and ₹${budgetB.toLocaleString('en-IN')})`);
    } else if (diff <= 15000) {
      budgetScore = 10;
      score += 10;
      alignments.push(`Manageable budget difference of ₹${diff.toLocaleString('en-IN')}`);
    } else if (diff <= 30000) {
      budgetScore = 5;
      score += 5;
      conflicts.push(`Significant budget gap of ₹${diff.toLocaleString('en-IN')}`);
      frictionPoints.push({
        category: 'Budget',
        personA: `₹${budgetA.toLocaleString('en-IN')}`,
        personB: `₹${budgetB.toLocaleString('en-IN')}`,
        severity: 'MEDIUM',
      });
    } else {
      budgetScore = 0;
      conflicts.push(`Major budget mismatch (₹${diff.toLocaleString('en-IN')} difference)`);
      frictionPoints.push({
        category: 'Budget',
        personA: `₹${budgetA.toLocaleString('en-IN')}`,
        personB: `₹${budgetB.toLocaleString('en-IN')}`,
        severity: 'HIGH',
      });
    }

    // 2. Sleep Schedule (15%)
    let sleepScore = 0;
    const sleepA = normalize(normA.sleepSchedule);
    const sleepB = normalize(normB.sleepSchedule);
    if (sleepA === sleepB) {
      sleepScore = 15;
      score += 15;
      if (sleepA.includes('early')) alignments.push('Both prefer early sleep schedules');
      else if (sleepA.includes('night')) alignments.push('Both are night owls');
      else alignments.push('Shared flexible sleep schedules');
    } else if (sleepA.includes('flexible') || sleepB.includes('flexible')) {
      sleepScore = 15;
      score += 15;
      alignments.push('Compatible sleep schedules due to flexibility');
    } else {
      sleepScore = 0;
      conflicts.push(`Conflicting sleep schedules (${normA.sleepSchedule} vs ${normB.sleepSchedule})`);
      frictionPoints.push({
        category: 'Sleep schedule',
        personA: normA.sleepSchedule,
        personB: normB.sleepSchedule,
        severity: 'HIGH',
      });
    }

    // 3. Cleanliness (15%)
    let cleanScore = 0;
    const cleanA = normalize(normA.cleanliness);
    const cleanB = normalize(normB.cleanliness);
    if (cleanA === cleanB) {
      cleanScore = 15;
      score += 15;
      if (cleanA.includes('neat')) alignments.push('Shared preference for a very neat space');
      else if (cleanA.includes('average')) alignments.push('Shared average cleanliness standards');
      else alignments.push('Shared relaxed approach to tidiness');
    } else if ((cleanA.includes('neat') && cleanB.includes('relaxed')) || (cleanA.includes('relaxed') && cleanB.includes('neat'))) {
      cleanScore = 0;
      conflicts.push(`Major cleanliness mismatch (${normA.cleanliness} vs ${normB.cleanliness})`);
      frictionPoints.push({
        category: 'Cleanliness',
        personA: normA.cleanliness,
        personB: normB.cleanliness,
        severity: 'HIGH',
      });
    } else {
      cleanScore = 10;
      score += 10; // one step difference
      conflicts.push(`Slight difference in cleanliness standards (${normA.cleanliness} vs ${normB.cleanliness})`);
      frictionPoints.push({
        category: 'Cleanliness',
        personA: normA.cleanliness,
        personB: normB.cleanliness,
        severity: 'MEDIUM',
      });
    }

    // 4. Smoking (15%)
    let smokeScore = 0;
    const smokeA = normalize(normA.smoking);
    const smokeB = normalize(normB.smoking);
    if (smokeA === smokeB) {
      smokeScore = 15;
      score += 15;
      if (smokeA.includes('non-smoker')) alignments.push('Mutual non-smoking household');
      else if (smokeA.includes('outside')) alignments.push('Shared boundary: smoking outside only');
      else alignments.push('Mutual acceptance of smoking');
    } else if ((smokeA === 'non-smoker' && smokeB === 'smoker') || (smokeA === 'smoker' && smokeB === 'non-smoker')) {
      smokeScore = 0;
      conflicts.push(`Major lifestyle conflict: ${normA.smoking} vs ${normB.smoking}`);
      frictionPoints.push({
        category: 'Smoking',
        personA: normA.smoking,
        personB: normB.smoking,
        severity: 'HIGH',
      });
    } else {
      smokeScore = 5;
      score += 5; // e.g., non-smoker vs outside only
      conflicts.push(`Friction on smoking habits: ${normA.smoking} vs ${normB.smoking}`);
      frictionPoints.push({
        category: 'Smoking',
        personA: normA.smoking,
        personB: normB.smoking,
        severity: 'MEDIUM',
      });
    }

    // 5. Guests (10%)
    let guestsScore = 0;
    const guestsA = normalize(normA.guests);
    const guestsB = normalize(normB.guests);
    if (guestsA === guestsB) {
      guestsScore = 10;
      score += 10;
      if (guestsA.includes('no guests')) alignments.push('Shared preference for no guests');
      else if (guestsA.includes('occasional')) alignments.push('Shared expectation of occasional guests');
      else alignments.push('Shared highly welcoming guest policy');
    } else if ((guestsA.includes('no guests') && guestsB.includes('frequent')) || (guestsA.includes('frequent') && guestsB.includes('no guests'))) {
      guestsScore = 0;
      conflicts.push(`Major conflict on guests: ${normA.guests} vs ${normB.guests}`);
      frictionPoints.push({
        category: 'Guest preferences',
        personA: normA.guests,
        personB: normB.guests,
        severity: 'HIGH',
      });
    } else {
      guestsScore = 5;
      score += 5;
      conflicts.push(`Different guest expectations: ${normA.guests} vs ${normB.guests}`);
      frictionPoints.push({
        category: 'Guest preferences',
        personA: normA.guests,
        personB: normB.guests,
        severity: 'MEDIUM',
      });
    }

    // 6. Noise Tolerance (10%)
    let noiseScore = 0;
    const noiseA = normalize(normA.noiseTolerance);
    const noiseB = normalize(normB.noiseTolerance);
    if (noiseA === noiseB) {
      noiseScore = 10;
      score += 10;
      alignments.push(`Matched noise tolerance (${normA.noiseTolerance})`);
    } else if ((noiseA.includes('low') && noiseB.includes('high')) || (noiseA.includes('high') && noiseB.includes('low'))) {
      noiseScore = 0;
      conflicts.push(`Major noise tolerance mismatch: ${normA.noiseTolerance} vs ${normB.noiseTolerance}`);
      frictionPoints.push({
        category: 'Noise tolerance',
        personA: normA.noiseTolerance,
        personB: normB.noiseTolerance,
        severity: 'HIGH',
      });
    } else {
      noiseScore = 5;
      score += 5;
      frictionPoints.push({
        category: 'Noise tolerance',
        personA: normA.noiseTolerance,
        personB: normB.noiseTolerance,
        severity: 'MEDIUM',
      });
    }

    // 7. Pets (5%)
    let petsScore = 0;
    const petsA = normalize(normA.pets);
    const petsB = normalize(normB.pets);
    if (petsA === petsB) {
      petsScore = 5;
      score += 5;
      if (petsA.includes('no pets')) alignments.push('Shared pet-free preference');
      else if (petsA.includes('has')) alignments.push('Both have pets');
      else alignments.push('Both are pet-friendly');
    } else if ((petsA.includes('has') && petsB.includes('no pets')) || (petsB.includes('has') && petsA.includes('no pets'))) {
      petsScore = 0;
      conflicts.push(`Pet conflict: ${normA.pets} vs ${normB.pets}`);
      frictionPoints.push({
        category: 'Pets',
        personA: normA.pets,
        personB: normB.pets,
        severity: 'HIGH',
      });
    } else {
      petsScore = 5;
      score += 5;
      alignments.push('Compatible pet environment');
    }

    // 8. Social Preferences (5%)
    let socialScore = 0;
    const socialA = normalize(normA.socialPreferences);
    const socialB = normalize(normB.socialPreferences);
    if (socialA === socialB) {
      socialScore = 5;
      score += 5;
      alignments.push(`Aligned social energy levels (${normA.socialPreferences})`);
    } else if ((socialA.includes('very social') && socialB.includes('mostly keep')) || (socialA.includes('mostly keep') && socialB.includes('very social'))) {
      socialScore = 0;
      conflicts.push(`Social mismatch: ${normA.socialPreferences} vs ${normB.socialPreferences}`);
      frictionPoints.push({
        category: 'Social preferences',
        personA: normA.socialPreferences,
        personB: normB.socialPreferences,
        severity: 'HIGH',
      });
    } else {
      socialScore = 3;
      score += 3;
      frictionPoints.push({
        category: 'Social preferences',
        personA: normA.socialPreferences,
        personB: normB.socialPreferences,
        severity: 'LOW',
      });
    }

    // 9. Work/Study Schedule (5%)
    let workScore = 0;
    const workA = normalize(normA.workSchedule);
    const workB = normalize(normB.workSchedule);
    if (workA === workB) {
      workScore = 5;
      score += 5;
      alignments.push('Similar daily routines');
    } else if ((workA.includes('shift') && workB.includes('9 to 5')) || (workA.includes('9 to 5') && workB.includes('shift'))) {
      workScore = 0;
      conflicts.push(`Conflicting daily work schedules (${normA.workSchedule} vs ${normB.workSchedule})`);
      frictionPoints.push({
        category: 'Work/study schedule',
        personA: normA.workSchedule,
        personB: normB.workSchedule,
        severity: 'MEDIUM',
      });
    } else {
      workScore = 3;
      score += 3;
    }

    // 10. Food Preferences (5%)
    let foodScore = 0;
    const foodA = normalize(normA.foodPreferences);
    const foodB = normalize(normB.foodPreferences);
    if (foodA === foodB) {
      foodScore = 5;
      score += 5;
      alignments.push(`Shared dietary preference (${normA.foodPreferences})`);
    } else if (foodA.includes('no preference') || foodB.includes('no preference')) {
      foodScore = 5;
      score += 5;
      alignments.push('Compatible dietary preferences');
    } else if ((foodA.includes('vegan') && foodB.includes('non-veg')) || (foodB.includes('vegan') && foodA.includes('non-veg'))) {
      foodScore = 0;
      conflicts.push(`Different dietary/kitchen habits (${normA.foodPreferences} vs ${normB.foodPreferences})`);
      frictionPoints.push({
        category: 'Food preferences',
        personA: normA.foodPreferences,
        personB: normB.foodPreferences,
        severity: 'HIGH',
      });
    } else if ((foodA.includes('veg') && foodB.includes('non-veg')) || (foodB.includes('veg') && foodA.includes('non-veg'))) {
      foodScore = 2;
      score += 2;
      conflicts.push(`Different dietary/kitchen habits (${normA.foodPreferences} vs ${normB.foodPreferences})`);
      frictionPoints.push({
        category: 'Food preferences',
        personA: normA.foodPreferences,
        personB: normB.foodPreferences,
        severity: 'MEDIUM',
      });
    } else {
      foodScore = 4;
      score += 4;
    }

    const finalScore = Math.max(0, Math.min(100, score));

    // Construct deterministic breakdown to pass to LLM
    const breakdown = {
      budget: Math.round((budgetScore / 15) * 100),
      sleepSchedule: Math.round((sleepScore / 15) * 100),
      cleanliness: Math.round((cleanScore / 15) * 100),
      smoking: Math.round((smokeScore / 15) * 100),
      guestPreferences: Math.round((guestsScore / 10) * 100),
      noiseTolerance: Math.round((noiseScore / 10) * 100),
      pets: Math.round((petsScore / 5) * 100),
      socialPreferences: Math.round((socialScore / 5) * 100),
      workStudySchedule: Math.round((workScore / 5) * 100),
      foodPreferences: Math.round((foodScore / 5) * 100),
    };

    // Construct deterministic breakdown to pass to LLM
    const structuredBreakdown = {
      score: finalScore,
      alignments,
      conflicts,
    };

    const userMessage = buildCompatibilityUserPrompt(normA, normB, structuredBreakdown);

    let compatibilityResult: RoommateCompatibilityResponse;
    try {
      // The LLM generates the explanation string based on the provided breakdown.
      compatibilityResult = await completeStructuredJSON<RoommateCompatibilityResponse>({
        systemPrompt: ROOMMATE_COMPATIBILITY_SYSTEM_PROMPT,
        userMessage,
      });

      // Enforce the deterministic score/arrays in case the LLM tries to change them
      compatibilityResult.score = finalScore;
      compatibilityResult.commonPreferences = alignments;
      compatibilityResult.potentialConflicts = conflicts;
      compatibilityResult.frictionPoints = frictionPoints;
      compatibilityResult.breakdown = breakdown;

    } catch (aiError) {
      console.warn('AI narrative generation failed, using deterministic fallback explanation:', aiError);
      
      const fallbackExplanation = `Compatibility evaluated at ${finalScore}%. Profiles align on ${alignments.length} lifestyle dimensions including ${alignments.slice(0, 2).join(' and ')}.` + 
        (conflicts.length > 0 ? ` Key differences to discuss include ${conflicts.slice(0, 2).join(' and ')}.` : ' No major conflicts detected.');

      compatibilityResult = {
        score: finalScore,
        explanation: fallbackExplanation,
        commonPreferences: alignments,
        potentialConflicts: conflicts,
        frictionPoints,
        breakdown,
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
