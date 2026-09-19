/**
 * Recommendation Prompt — Rental Intelligence Platform
 * PRODUCT.md §6.4 | ARCHITECTURE.md §7
 * Teammate 2 Track
 */


import { RecommendationResponse, RecommendedPropertyItem } from '../types';

export const RECOMMENDATION_SYSTEM_PROMPT = `
You are an expert AI Rental Recommendation Engine for first-time renters.
Your goal is to rank candidate properties against the user's explicit preferences and provide an explainable reason for each recommendation.

CRITICAL REQUIREMENTS:
1. Return output matching the exact JSON structure:
{
  "recommendations": [
    {
      "propertyId": "string (exact property ID)",
      "rank": number (1-based ranking),
      "matchScore": number (0-100),
      "reason": "Specific plain-language explanation referencing exact matched attributes (e.g. budget fit, location, amenities)"
    }
  ],
  "summaryExplanation": "Overall synthesized summary of why top properties were recommended"
}

2. EXPLAINABILITY & GROUNDING RULES:
   - The reason field for EVERY item MUST reference specific matched attributes (e.g., "Matches your ₹35,000 budget (₹32,000/mo) and includes requested Gym & Power Backup").
   - NEVER return generic labels like "Great match!", "Recommended option", or "Good choice".
   - Ground recommendations ONLY in the explicit user preferences provided. DO NOT guess or infer unstated user preferences.
   - If a preference attribute was not provided by the user, do not evaluate or claim a match on it.
`;

export interface UserPreferencesInput {
  budget?: number;
  location?: string;
  bedrooms?: number;
  furnishing?: string;
  amenities?: string[];
  commutePoint?: string;
  otherPreferences?: string;
}

export interface CandidatePropertyInput {
  id: string;
  title: string;
  location: string;
  rent: number;
  deposit: number;
  bedrooms: number;
  furnishing: string;
  amenities: string[] | string;
  estimatedMonthlyCost?: number;
  description?: string;
}

/**
 * Builds user prompt for LLM ranking and reasoning based on explicit preferences only.
 */
export function buildRecommendationUserMessage(
  preferences: UserPreferencesInput,
  properties: CandidatePropertyInput[]
): string {
  const prefLines: string[] = [];
  if (preferences.budget !== undefined && preferences.budget > 0) {
    prefLines.push(`- Monthly Budget: ₹${preferences.budget.toLocaleString('en-IN')}`);
  }
  if (preferences.location) {
    prefLines.push(`- Preferred Location: ${preferences.location}`);
  }
  if (preferences.bedrooms !== undefined) {
    prefLines.push(`- Preferred Bedrooms: ${preferences.bedrooms} BHK`);
  }
  if (preferences.furnishing) {
    prefLines.push(`- Preferred Furnishing: ${preferences.furnishing}`);
  }
  if (preferences.amenities && preferences.amenities.length > 0) {
    prefLines.push(`- Desired Amenities: ${preferences.amenities.join(', ')}`);
  }
  if (preferences.commutePoint) {
    prefLines.push(`- Commute Destination: ${preferences.commutePoint}`);
  }
  if (preferences.otherPreferences) {
    prefLines.push(`- Other Stated Preferences: ${preferences.otherPreferences}`);
  }

  const prefsText = prefLines.length > 0
    ? prefLines.join('\n')
    : 'No explicit preferences provided (rank by overall balance and explain key attributes).';

  const propsText = properties.map((p, index) => {
    const amenitiesList = Array.isArray(p.amenities)
      ? p.amenities.join(', ')
      : typeof p.amenities === 'string'
      ? p.amenities
      : 'None';

    return `PROPERTY ${index + 1}:
- ID: ${p.id}
- Title: ${p.title}
- Location: ${p.location}
- Rent: ₹${p.rent.toLocaleString('en-IN')}/mo
- Deposit: ₹${p.deposit.toLocaleString('en-IN')}
${p.estimatedMonthlyCost !== undefined ? `- Estimated Monthly Cost: ₹${p.estimatedMonthlyCost.toLocaleString('en-IN')}` : ''}
- Bedrooms: ${p.bedrooms} BHK
- Furnishing: ${p.furnishing}
- Amenities: ${amenitiesList}
${p.description ? `- Description: ${p.description}` : ''}`.trim();
  }).join('\n\n');

  return `EXPLICIT USER PREFERENCES:
${prefsText}

CANDIDATE PROPERTIES:
${propsText}

Please rank these properties according to how well they satisfy the explicit preferences above. Provide a specific, fact-based 'reason' for each property explaining which explicit criteria were satisfied.`;
}

/**
 * Deterministic recommendation generator matching explicit preferences.
 * Produces structured reasons referencing exact matched attributes.
 */
export function generateDeterministicRecommendations(
  preferences: UserPreferencesInput,
  properties: CandidatePropertyInput[]
): RecommendationResponse {
  const scoredItems: Array<{
    propertyId: string;
    score: number;
    matchedReasons: string[];
    unmatchedReasons: string[];
  }> = [];

  for (const property of properties) {
    let score = 100; // start at 100% and deduct for mismatches
    const matched: string[] = [];
    const unmatched: string[] = [];

    // Parse property amenities
    const propAmenities: string[] = Array.isArray(property.amenities)
      ? property.amenities
      : typeof property.amenities === 'string'
      ? (JSON.parse(property.amenities || '[]') as string[])
      : [];

    const monthlyCost = property.estimatedMonthlyCost || property.rent;

    // 1. Budget comparison
    if (preferences.budget && preferences.budget > 0) {
      if (monthlyCost <= preferences.budget) {
        const savings = preferences.budget - monthlyCost;
        if (savings > 0) {
          matched.push(`within your ₹${preferences.budget.toLocaleString('en-IN')} budget (₹${monthlyCost.toLocaleString('en-IN')}/mo, saving ₹${savings.toLocaleString('en-IN')}/mo)`);
        } else {
          matched.push(`exact match to your ₹${preferences.budget.toLocaleString('en-IN')} budget (₹${monthlyCost.toLocaleString('en-IN')}/mo)`);
        }
      } else {
        const over = monthlyCost - preferences.budget;
        score -= 25; // Penalty for over budget
        unmatched.push(`₹${over.toLocaleString('en-IN')}/mo over stated budget`);
      }
    }

    // 2. Location match
    if (preferences.location && preferences.location.trim().length > 0) {
      const prefLoc = preferences.location.toLowerCase();
      const propLoc = property.location.toLowerCase();
      if (propLoc.includes(prefLoc) || prefLoc.includes(propLoc)) {
        matched.push(`located in requested area (${property.location})`);
      } else {
        score -= 10;
        unmatched.push(`located in ${property.location} instead of ${preferences.location}`);
      }
    }

    // 3. Bedrooms match
    if (preferences.bedrooms !== undefined) {
      if (property.bedrooms === preferences.bedrooms) {
        matched.push(`exact ${property.bedrooms} BHK match`);
      } else {
        score -= 25; // Large penalty for incorrect BHK
        unmatched.push(`${property.bedrooms} BHK instead of ${preferences.bedrooms} BHK`);
      }
    }

    // 4. Furnishing match
    if (preferences.furnishing && preferences.furnishing.trim().length > 0) {
      if (property.furnishing.toLowerCase() === preferences.furnishing.toLowerCase()) {
        matched.push(`${property.furnishing} as requested`);
      } else {
        score -= 15;
        unmatched.push(`is ${property.furnishing} instead of ${preferences.furnishing}`);
      }
    }

    // 5. Amenities overlap
    if (preferences.amenities && preferences.amenities.length > 0) {
      const matchingAmenities = preferences.amenities.filter((a) =>
        propAmenities.some((pa) => pa.toLowerCase().includes(a.toLowerCase()))
      );

      if (matchingAmenities.length > 0) {
        matched.push(`includes desired amenities: ${matchingAmenities.join(', ')}`);
      }

      const missingAmenities = preferences.amenities.filter(
        (a) => !propAmenities.some((pa) => pa.toLowerCase().includes(a.toLowerCase()))
      );
      
      if (missingAmenities.length > 0) {
        score -= missingAmenities.length * 5; // -5 per missing amenity
        unmatched.push(`missing requested ${missingAmenities.join(', ')}`);
      }
    }

    // Cap score 0-100
    const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));

    scoredItems.push({
      propertyId: property.id,
      score: normalizedScore,
      matchedReasons: matched,
      unmatchedReasons: unmatched,
    });
  }

  // Sort descending by score
  scoredItems.sort((a, b) => b.score - a.score);

  const recommendations: RecommendedPropertyItem[] = scoredItems.map((item, index) => {
    let reasonText = '';
    if (item.matchedReasons.length > 0) {
      reasonText = `Matches your explicit preferences: ${item.matchedReasons.join('; ')}.`;
      if (item.unmatchedReasons.length > 0) {
        reasonText += ` Note: ${item.unmatchedReasons.join('; ')}.`;
      }
    } else if (item.unmatchedReasons.length > 0) {
      reasonText = `Does not meet primary explicit criteria: ${item.unmatchedReasons.join('; ')}.`;
    } else {
      reasonText = `Ranked based on base listing features and cost balance.`;
    }

    return {
      propertyId: item.propertyId,
      rank: index + 1,
      matchScore: item.score,
      reason: reasonText,
    };
  });

  const summary = recommendations.length > 0
    ? `Ranked ${recommendations.length} properties against stated preferences. Top match scored ${recommendations[0].matchScore}/100.`
    : 'No candidate properties available to rank.';

  return {
    recommendations,
    summaryExplanation: summary,
  };
}

export async function generatePropertyRecommendations(
  preferences: UserPreferencesInput,
  properties: CandidatePropertyInput[]
): Promise<RecommendationResponse> {
  if (!properties || properties.length === 0) {
    return {
      recommendations: [],
      summaryExplanation: 'No candidate properties provided for recommendation.',
    };
  }

  // Always use deterministic engine to ensure mathematically accurate rankings and explanations,
  // bypassing LLM hallucination of scores and reasons for mismatched properties.
  return generateDeterministicRecommendations(preferences, properties);
}
