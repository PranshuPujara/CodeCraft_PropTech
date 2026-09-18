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

    const compatibilityResult = await completeStructuredJSON<RoommateCompatibilityResponse>({
      systemPrompt: ROOMMATE_COMPATIBILITY_SYSTEM_PROMPT,
      userMessage,
    });

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
