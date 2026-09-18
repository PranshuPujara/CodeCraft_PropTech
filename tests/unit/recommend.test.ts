import { describe, it, expect } from 'vitest';
import {
  RECOMMENDATION_SYSTEM_PROMPT,
  buildRecommendationUserMessage,
  generateDeterministicRecommendations,
  generatePropertyRecommendations,
  CandidatePropertyInput,
  UserPreferencesInput,
} from '../../lib/ai/prompts/recommend';

describe('Property Recommendation Prompt (lib/ai/prompts/recommend.ts)', () => {
  const sampleCandidates: CandidatePropertyInput[] = [
    {
      id: 'prop-1',
      title: 'Modern 2BHK in Indiranagar',
      location: 'Indiranagar, Bangalore',
      rent: 32000,
      deposit: 150000,
      bedrooms: 2,
      furnishing: 'Semi-Furnished',
      amenities: ['Power Backup', 'Security', 'Parking', 'Gym'],
      estimatedMonthlyCost: 40500,
    },
    {
      id: 'prop-2',
      title: 'Luxury 3BHK in Koramangala',
      location: 'Koramangala, Bangalore',
      rent: 48000,
      deposit: 250000,
      bedrooms: 3,
      furnishing: 'Furnished',
      amenities: ['Gym', 'Swimming Pool', 'Security'],
      estimatedMonthlyCost: 60000,
    },
    {
      id: 'prop-3',
      title: 'Cozy 1BHK in HSR Layout',
      location: 'HSR Layout, Bangalore',
      rent: 22000,
      deposit: 80000,
      bedrooms: 1,
      furnishing: 'Furnished',
      amenities: ['Wifi', 'Security'],
      estimatedMonthlyCost: 27000,
    },
  ];

  const explicitPreferences: UserPreferencesInput = {
    budget: 35000,
    location: 'Indiranagar',
    bedrooms: 2,
    furnishing: 'Semi-Furnished',
    amenities: ['Gym', 'Power Backup'],
  };

  it('contains required system prompt constraints and explainability rules', () => {
    expect(RECOMMENDATION_SYSTEM_PROMPT).toContain('MUST reference specific matched attributes');
    expect(RECOMMENDATION_SYSTEM_PROMPT).toContain('NEVER return generic labels like "Great match!"');
    expect(RECOMMENDATION_SYSTEM_PROMPT).toContain('Ground recommendations ONLY in the explicit user preferences');
  });

  it('formats user message with explicit preferences and candidate listings', () => {
    const message = buildRecommendationUserMessage(explicitPreferences, sampleCandidates);
    expect(message).toContain('EXPLICIT USER PREFERENCES');
    expect(message).toContain('₹35,000');
    expect(message).toContain('Indiranagar');
    expect(message).toContain('2 BHK');
    expect(message).toContain('Gym, Power Backup');
    expect(message).toContain('Modern 2BHK in Indiranagar');
  });

  it('ranks properties accurately and gives specific reasons referencing matched attributes', () => {
    const result = generateDeterministicRecommendations(explicitPreferences, sampleCandidates);

    expect(result.recommendations.length).toBe(3);
    expect(result.recommendations[0].propertyId).toBe('prop-1');
    expect(result.recommendations[0].rank).toBe(1);
    expect(result.recommendations[0].matchScore).toBeGreaterThan(result.recommendations[1].matchScore);

    // Ensure the reason is specific and mentions matched attributes
    const topReason = result.recommendations[0].reason;
    expect(topReason).not.toContain('Great match!');
    expect(topReason).toContain('Indiranagar');
    expect(topReason).toContain('2 BHK');
    expect(topReason).toContain('budget');
  });

  it('handles empty preferences without crashing or inventing preferences', () => {
    const result = generateDeterministicRecommendations({}, sampleCandidates);
    expect(result.recommendations.length).toBe(3);
    for (const item of result.recommendations) {
      expect(item.reason).toBeDefined();
      expect(item.reason.length).toBeGreaterThan(0);
      expect(item.matchScore).toBeGreaterThanOrEqual(0);
      expect(item.matchScore).toBeLessThanOrEqual(100);
    }
  });

  it('returns structured RecommendationResponse matching shared types', async () => {
    const result = await generatePropertyRecommendations(explicitPreferences, sampleCandidates);
    expect(result).toHaveProperty('recommendations');
    expect(result).toHaveProperty('summaryExplanation');
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result.recommendations[0]).toHaveProperty('propertyId');
    expect(result.recommendations[0]).toHaveProperty('rank');
    expect(result.recommendations[0]).toHaveProperty('matchScore');
    expect(result.recommendations[0]).toHaveProperty('reason');
  });
});
