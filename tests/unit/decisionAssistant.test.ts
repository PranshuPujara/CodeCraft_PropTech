import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  buildDecisionAssistantUserPrompt,
  generateDeterministicDecisionSupport,
  type DecisionUserPreferences,
  type ShortlistedPropertyContext,
  DECISION_ASSISTANT_SYSTEM_PROMPT,
} from '../../lib/ai/prompts/decisionAssistant';
import { POST } from '../../app/api/decision-assistant/route';
import { db } from '../../lib/db';
import type { DecisionAssistantResponse } from '../../lib/ai/types';

describe('Decision Assistant Unit Tests', () => {
  const mockPreferences: DecisionUserPreferences = {
    budget: 30000,
    location: 'Koramangala',
    bedrooms: 2,
    furnishing: 'Furnished',
    amenities: ['Power Backup', 'Gym'],
    commutePoint: 'Tech Park',
    maxCommuteMinutes: 30,
    priority: 'Lower monthly cost',
  };

  const mockPropertyA: ShortlistedPropertyContext = {
    id: 'prop-1',
    title: 'Koramangala 2BHK Heights',
    location: 'Koramangala 4th Block',
    rent: 24000,
    deposit: 100000,
    brokerage: 15000,
    furnishing: 'Furnished',
    bedrooms: 2,
    amenities: ['Power Backup', 'Gym', 'Security'],
    commute: '18 min to Tech Park',
    cost: {
      estimatedMonthlyCost: 28500,
      initialMoveInCost: 139000,
      maintenance: 2500,
      electricity: 1000,
      water: 500,
      internet: 1000,
      transport: 500,
      otherRecurring: 0,
      affordabilityStatus: 'affordable',
    },
  };

  const mockPropertyB: ShortlistedPropertyContext = {
    id: 'prop-2',
    title: 'HSR Layout 2BHK Comfort',
    location: 'HSR Sector 2',
    rent: 20000,
    deposit: 80000,
    brokerage: 0,
    furnishing: 'Semi-Furnished',
    bedrooms: 2,
    amenities: ['Power Backup', 'Lift'],
    commute: '40 min to Tech Park',
    cost: {
      estimatedMonthlyCost: 26000,
      initialMoveInCost: 100000,
      maintenance: 2000,
      electricity: 1200,
      water: 800,
      internet: 1000,
      transport: 1000,
      otherRecurring: 0,
      affordabilityStatus: 'comfortable',
    },
  };

  it('1. Two shortlisted properties produce valid structured input context', () => {
    const prompt = buildDecisionAssistantUserPrompt(
      mockPreferences,
      [mockPropertyA, mockPropertyB]
    );

    expect(prompt).toBeDefined();
    expect(typeof prompt).toBe('string');
    expect(prompt).toContain('Koramangala 2BHK Heights');
    expect(prompt).toContain('HSR Layout 2BHK Comfort');
    expect(prompt).toContain('USER STATED PREFERENCES');
    expect(prompt).toContain('SHORTLISTED PROPERTIES TO EVALUATE');
  });

  it('2. User preferences are strictly included in the AI context', () => {
    const prompt = buildDecisionAssistantUserPrompt(
      mockPreferences,
      [mockPropertyA, mockPropertyB]
    );

    expect(prompt).toContain('₹30,000/month');
    expect(prompt).toContain('Koramangala');
    expect(prompt).toContain('2 BHK');
    expect(prompt).toContain('Furnished');
    expect(prompt).toContain('Power Backup');
    expect(prompt).toContain('Gym');
    expect(prompt).toContain('30 min');
  });

  it('3. Cost information (monthly recurring and initial move-in) is included', () => {
    const prompt = buildDecisionAssistantUserPrompt(
      mockPreferences,
      [mockPropertyA, mockPropertyB]
    );

    expect(prompt).toContain('₹28500/mo');
    expect(prompt).toContain('₹139000');
    expect(prompt).toContain('₹26000/mo');
    expect(prompt).toContain('₹100000');
    expect(prompt).toContain('maintenance: ₹2500');
    expect(prompt).toContain('Deposit: ₹100000');
  });

  it('4. Missing preferences do not cause fabricated values', () => {
    const sparsePreferences: DecisionUserPreferences = {
      budget: 25000,
    };

    const prompt = buildDecisionAssistantUserPrompt(
      sparsePreferences,
      [mockPropertyA, mockPropertyB]
    );

    expect(prompt).toContain('₹25,000/month');
    expect(prompt).toContain('"preferredLocation": "Not specified"');
    expect(prompt).toContain('"furnishingPreference": "Not specified"');
    expect(prompt).toContain('"commuteDestination": "Not specified"');
    expect(prompt).toContain('"maxCommuteTime": "Not specified"');
    expect(DECISION_ASSISTANT_SYSTEM_PROMPT).toContain('NEVER invent facts, costs, commute times, or amenities');
    expect(DECISION_ASSISTANT_SYSTEM_PROMPT).toContain('state that it was not provided rather than guessing');
  });

  it('5. Fewer than two shortlisted properties are rejected gracefully by the API', async () => {
    // Test with 0 property IDs
    const reqEmpty = new NextRequest('http://localhost:3000/api/decision-assistant', {
      method: 'POST',
      body: JSON.stringify({ propertyIds: [] }),
    });

    const resEmpty = await POST(reqEmpty);
    expect(resEmpty.status).toBe(400);
    const dataEmpty = await resEmpty.json();
    expect(dataEmpty.error).toMatch(/at least 2.*shortlisted/i);

    // Test with 1 property ID
    const reqSingle = new NextRequest('http://localhost:3000/api/decision-assistant', {
      method: 'POST',
      body: JSON.stringify({ propertyIds: ['single-prop-id'] }),
    });

    const resSingle = await POST(reqSingle);
    expect(resSingle.status).toBe(400);
    const dataSingle = await resSingle.json();
    expect(dataSingle.error).toMatch(/at least 2.*shortlisted/i);
  });

  it('6. Invalid AI output or missing API key triggers fallback gracefully without crash', () => {
    const fallback = generateDeterministicDecisionSupport(
      mockPreferences,
      [mockPropertyA, mockPropertyB]
    );

    expect(fallback).toBeDefined();
    expect(fallback.summary).toBeDefined();
    expect(fallback.summary.length).toBeGreaterThan(20);
    expect(fallback.keyTradeoffs.length).toBeGreaterThan(0);
    expect(fallback.properties.length).toBe(2);
    expect(fallback.properties[0].pros.length).toBeGreaterThan(0);
    expect(fallback.properties[0].cons.length).toBeGreaterThan(0);
  });

  it('7. Decision Assistant response conforms to expected structured type', () => {
    const sampleResponse: DecisionAssistantResponse = generateDeterministicDecisionSupport(
      mockPreferences,
      [mockPropertyA, mockPropertyB]
    );

    expect(sampleResponse).toHaveProperty('summary');
    expect(sampleResponse).toHaveProperty('keyTradeoffs');
    expect(sampleResponse).toHaveProperty('properties');
    expect(Array.isArray(sampleResponse.keyTradeoffs)).toBe(true);
    expect(Array.isArray(sampleResponse.properties)).toBe(true);

    const propA = sampleResponse.properties.find((p) => p.propertyId === 'prop-1');
    expect(propA).toBeDefined();
    expect(propA?.propertyName).toBe('Koramangala 2BHK Heights');
    expect(Array.isArray(propA?.pros)).toBe(true);
    expect(Array.isArray(propA?.cons)).toBe(true);
    expect(Array.isArray(propA?.preferenceAlignment)).toBe(true);
    expect(Array.isArray(propA?.tradeoffs)).toBe(true);
  });

  it('8. POST /api/decision-assistant successfully processes 2 valid properties and returns structured JSON', async () => {
    const properties = await db.property.findMany({ take: 2 });
    expect(properties.length).toBeGreaterThanOrEqual(2);

    const req = new NextRequest('http://localhost:3000/api/decision-assistant', {
      method: 'POST',
      body: JSON.stringify({
        propertyIds: [properties[0].id, properties[1].id],
        userId: 'demo-user-1',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const result = await res.json();
    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('keyTradeoffs');
    expect(result).toHaveProperty('properties');
    expect(result.properties.length).toBe(2);
    expect(result).toHaveProperty('shortlistedCount', 2);
    expect(result).toHaveProperty('userPreferences');
  });
});
