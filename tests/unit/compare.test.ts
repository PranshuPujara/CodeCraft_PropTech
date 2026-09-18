import { describe, it, expect } from 'vitest';
import {
  COMPARISON_SYSTEM_PROMPT,
  buildComparisonUserMessage,
  generateDeterministicTradeoffs,
  generateComparisonTradeoffs,
  PropertyComparisonInput,
} from '../../lib/ai/prompts/compare';

describe('Property Comparison Prompt (lib/ai/prompts/compare.ts)', () => {
  const sampleProperties: PropertyComparisonInput[] = [
    {
      id: 'prop-1',
      title: 'Modern 2BHK in Indiranagar',
      location: 'Indiranagar, Bangalore',
      rent: 32000,
      deposit: 150000,
      bedrooms: 2,
      furnishing: 'Semi-Furnished',
      amenities: ['Power Backup', 'Security', 'Parking', 'Balcony'],
      estimatedMonthlyCost: 40500,
      initialMoveInCost: 198000,
    },
    {
      id: 'prop-2',
      title: 'Luxury 3BHK in Koramangala',
      location: 'Koramangala, Bangalore',
      rent: 48000,
      deposit: 250000,
      bedrooms: 3,
      furnishing: 'Furnished',
      amenities: ['Gym', 'Swimming Pool', 'Power Backup', 'Security', 'Clubhouse'],
      estimatedMonthlyCost: 60000,
      initialMoveInCost: 322000,
    },
  ];

  it('contains required system prompt instructions and constraints', () => {
    expect(COMPARISON_SYSTEM_PROMPT).toContain('CRITICAL REQUIREMENTS');
    expect(COMPARISON_SYSTEM_PROMPT).toContain('tradeoffs');
    expect(COMPARISON_SYSTEM_PROMPT).toContain('dimension');
    expect(COMPARISON_SYSTEM_PROMPT).toContain('both properties');
  });

  it('formats user comparison message with complete property details', () => {
    const message = buildComparisonUserMessage(sampleProperties);
    expect(message).toContain('Modern 2BHK in Indiranagar');
    expect(message).toContain('Luxury 3BHK in Koramangala');
    expect(message).toContain('₹32,000/month');
    expect(message).toContain('₹48,000/month');
    expect(message).toContain('Semi-Furnished');
    expect(message).toContain('Furnished');
    expect(message).toContain('Power Backup');
    expect(message).toContain('Swimming Pool');
  });

  it('generates specific pairwise trade-offs naming dimensions and both properties', () => {
    const result = generateDeterministicTradeoffs(sampleProperties);

    expect(result.tradeoffs.length).toBeGreaterThan(0);
    expect(result.summary).toBeDefined();

    // Check dimensions present
    const dimensions = result.tradeoffs.map((t) => t.dimension);
    expect(dimensions).toContain('Rent');
    expect(dimensions).toContain('Security Deposit');
    expect(dimensions).toContain('Estimated Monthly Cost');
    expect(dimensions).toContain('Furnishing');
    expect(dimensions).toContain('Bedrooms');

    // Check that both properties are referenced in the tradeoff sentence
    for (const tradeoff of result.tradeoffs) {
      expect(tradeoff.propertyAId).toBe('prop-1');
      expect(tradeoff.propertyBId).toBe('prop-2');
      expect(tradeoff.tradeoff).toMatch(/Modern 2BHK in Indiranagar|Luxury 3BHK in Koramangala/);
    }
  });

  it('requires at least 2 properties for comparison', async () => {
    await expect(generateComparisonTradeoffs([])).rejects.toThrow(
      'At least 2 properties are required'
    );
    await expect(generateComparisonTradeoffs([sampleProperties[0]])).rejects.toThrow(
      'At least 2 properties are required'
    );
  });

  it('successfully generates structured comparison response matching types', async () => {
    const result = await generateComparisonTradeoffs(sampleProperties);
    expect(result).toHaveProperty('tradeoffs');
    expect(result).toHaveProperty('summary');
    expect(Array.isArray(result.tradeoffs)).toBe(true);
    expect(result.tradeoffs[0]).toHaveProperty('dimension');
    expect(result.tradeoffs[0]).toHaveProperty('tradeoff');
  });
});
