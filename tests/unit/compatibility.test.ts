import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../app/api/roommates/compatibility/route';
import * as aiClient from '../../lib/ai/client';

vi.mock('../../lib/ai/client', async () => {
  const actual = await vi.importActual('../../lib/ai/client');
  return {
    ...(actual as any),
    completeStructuredJSON: vi.fn(),
  };
});

describe('POST /api/roommates/compatibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseProfile = {
    budget: 1000,
    sleepSchedule: 'Early bird',
    workSchedule: '9 to 5',
    cleanliness: 'Very clean',
    noiseTolerance: 'Low',
    guests: 'Rarely',
    smoking: 'No',
    foodPreferences: 'Vegetarian',
    pets: 'No pets',
    socialPreferences: 'Quiet',
  };

  it('fails visibly with incomplete profiles', async () => {
    const incompleteProfile = { ...baseProfile };
    delete (incompleteProfile as any).budget;

    const req = new Request('http://localhost/api/roommates/compatibility', {
      method: 'POST',
      body: JSON.stringify({
        profileA: baseProfile,
        profileB: incompleteProfile,
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data.error).toContain('Profiles are incomplete');
    expect(data.missingKeysB).toContain('budget');
  });

  it('returns structured compatibility for aligned profiles', async () => {
    const mockResult = {
      commonPreferences: ['Early bird schedule', 'Very clean', 'No smoking'],
      potentialConflicts: [],
      explanation: 'You both have highly aligned lifestyles, particularly regarding cleanliness and schedule.',
      score: 95
    };

    vi.mocked(aiClient.completeStructuredJSON).mockResolvedValueOnce(mockResult);

    const req = new Request('http://localhost/api/roommates/compatibility', {
      method: 'POST',
      body: JSON.stringify({
        profileA: baseProfile,
        profileB: { ...baseProfile, socialPreferences: 'Somewhat social' },
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.score).toBe(95);
    expect(data.explanation).toBe(mockResult.explanation);
    expect(data.commonPreferences.length).toBeGreaterThan(0);
    expect(data.potentialConflicts).toEqual([]);
  });

  it('returns structured compatibility for conflicting profiles', async () => {
    const conflictingProfile = {
      budget: 2000,
      sleepSchedule: 'Night owl',
      workSchedule: 'Freelance variable',
      cleanliness: 'Messy',
      noiseTolerance: 'High',
      guests: 'Often',
      smoking: 'Yes',
      foodPreferences: 'Anything',
      pets: '2 dogs',
      socialPreferences: 'Party everyday',
    };

    const mockResult = {
      commonPreferences: [],
      potentialConflicts: ['Different sleep schedules', 'Opposite cleanliness standards', 'Smoking preference clash'],
      explanation: 'Your lifestyles are fundamentally opposed in almost every category.',
      score: 10
    };

    vi.mocked(aiClient.completeStructuredJSON).mockResolvedValueOnce(mockResult);

    const req = new Request('http://localhost/api/roommates/compatibility', {
      method: 'POST',
      body: JSON.stringify({
        profileA: baseProfile,
        profileB: conflictingProfile,
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.score).toBe(10);
    expect(data.explanation).toBe(mockResult.explanation);
    expect(data.potentialConflicts.length).toBe(3);
  });

  it('fails if AI does not return an explanation with a score', async () => {
    const mockResult = {
      commonPreferences: ['Early bird schedule'],
      potentialConflicts: [],
      explanation: '', // Missing explanation
      score: 80
    };

    vi.mocked(aiClient.completeStructuredJSON).mockResolvedValueOnce(mockResult);

    const req = new Request('http://localhost/api/roommates/compatibility', {
      method: 'POST',
      body: JSON.stringify({
        profileA: baseProfile,
        profileB: baseProfile,
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toContain('without an explanation');
  });
});
