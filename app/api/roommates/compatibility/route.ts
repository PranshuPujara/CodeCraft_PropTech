import { NextResponse } from 'next/server';
import { completeStructuredJSON } from '../../../../lib/ai/client';

export const dynamic = 'force-dynamic';
import { ROOMMATE_COMPATIBILITY_SYSTEM_PROMPT, buildCompatibilityUserPrompt } from '../../../../lib/ai/prompts/compatibility';
import { RoommateCompatibilityResponse } from '../../../../lib/ai/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { profileA, profileB } = body;

    // Basic validation
    if (!profileA || !profileB) {
      return NextResponse.json(
        { error: 'Both profileA and profileB are required.' },
        { status: 400 }
      );
    }

    const requiredKeys = [
      'budget', 'sleepSchedule', 'workSchedule', 'cleanliness', 
      'noiseTolerance', 'guests', 'smoking', 'foodPreferences', 
      'pets', 'socialPreferences'
    ];

    const missingKeysA = requiredKeys.filter(key => profileA[key] === undefined);
    const missingKeysB = requiredKeys.filter(key => profileB[key] === undefined);

    if (missingKeysA.length > 0 || missingKeysB.length > 0) {
      return NextResponse.json(
        { 
          error: 'Profiles are incomplete. They must contain all required preferences.',
          missingKeysA,
          missingKeysB
        },
        { status: 400 }
      );
    }

    const userMessage = buildCompatibilityUserPrompt(profileA, profileB);

    let compatibilityResult: RoommateCompatibilityResponse;
    try {
      compatibilityResult = await completeStructuredJSON<RoommateCompatibilityResponse>({
        systemPrompt: ROOMMATE_COMPATIBILITY_SYSTEM_PROMPT,
        userMessage,
      });
    } catch (aiError) {
      console.warn('AI compatibility call failed, using deterministic evaluation fallback:', aiError);
      const common: string[] = [];
      const conflicts: string[] = [];
      let score = 70;

      const bA = Number(profileA.budget);
      const bB = Number(profileB.budget);
      if (!isNaN(bA) && !isNaN(bB)) {
        const diff = Math.abs(bA - bB);
        if (diff <= 3000) {
          common.push(`Aligned budget expectations (difference under ₹${diff || 0})`);
          score += 10;
        } else {
          conflicts.push(`Budget gap: ₹${bA} vs ₹${bB}`);
          score -= 10;
        }
      }

      const keysToCheck = ['cleanliness', 'smoking', 'pets', 'sleepSchedule', 'guests', 'workSchedule', 'foodPreferences'];
      for (const k of keysToCheck) {
        if (profileA[k] && profileB[k]) {
          if (String(profileA[k]).toLowerCase() === String(profileB[k]).toLowerCase()) {
            common.push(`Shared ${k}: ${profileA[k]}`);
            score += 4;
          } else {
            conflicts.push(`Different ${k}: ${profileA[k]} vs ${profileB[k]}`);
            score -= 4;
          }
        }
      }

      score = Math.max(30, Math.min(95, score));
      const explanation = `Compatibility evaluated at ${score}%. Profiles align on ${common.length} lifestyle dimensions including ${common.slice(0, 2).join(', ')}. Key differences to discuss include ${conflicts.slice(0, 2).join(' and ')}.`;

      compatibilityResult = {
        score,
        explanation,
        commonPreferences: common,
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
