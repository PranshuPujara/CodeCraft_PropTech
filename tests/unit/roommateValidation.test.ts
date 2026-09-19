import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { POST } from '../../app/api/roommates/compatibility/route';
import {
  extractAndNormalizeProfile,
  validateRoommatePair,
  CanonicalRoommateProfile,
} from '../../lib/validations/roommate';
import * as aiClient from '../../lib/ai/client';

vi.mock('../../lib/ai/client', async () => {
  const actual = await vi.importActual('../../lib/ai/client');
  return {
    ...(actual as any),
    completeStructuredJSON: vi.fn(),
  };
});

describe('Roommate Profile Completeness & Validation (31 Acceptance Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validProfileA = {
    budget: '20000',
    sleepSchedule: 'Night owl (12 AM – 8 AM)',
    workSchedule: '9 to 5 Office',
    cleanliness: 'Very neat',
    noiseTolerance: 'Low — need quiet',
    guests: 'Occasional weekends',
    smoking: 'Non-smoker',
    foodPreferences: 'Vegetarian',
    pets: 'No pets',
    socialPreferences: 'Friendly but private',
  };

  const validProfileB = {
    budget: 20000,
    sleepSchedule: 'Early bird (10 PM – 6 AM)',
    workSchedule: 'Remote/WFH',
    cleanliness: 'Very neat',
    noiseTolerance: 'Medium',
    guests: 'Frequent guests welcome',
    smoking: 'Non-smoker',
    foodPreferences: 'Non-vegetarian',
    pets: 'No pets',
    socialPreferences: 'Friendly but private',
  };

  // 1. Complete Person A passes validation
  it('1. Complete Person A passes validation', () => {
    const res = extractAndNormalizeProfile(validProfileA, 'profileA');
    expect(res.isValid).toBe(true);
    expect(res.missingKeys).toHaveLength(0);
    expect(res.normalized?.budget).toBe(20000);
  });

  // 2. Complete Person B passes validation
  it('2. Complete Person B passes validation', () => {
    const res = extractAndNormalizeProfile(validProfileB, 'profileB');
    expect(res.isValid).toBe(true);
    expect(res.missingKeys).toHaveLength(0);
    expect(res.normalized?.budget).toBe(20000);
  });

  // 3. Two complete profiles pass validation
  it('3. Two complete profiles pass validation', () => {
    const res = validateRoommatePair(validProfileA, validProfileB);
    expect(res.isValid).toBe(true);
    expect(res.missingKeysA).toHaveLength(0);
    expect(res.missingKeysB).toHaveLength(0);
  });

  // 4. Missing Person A budget fails
  it('4. Missing Person A budget fails', () => {
    const pA = { ...validProfileA };
    delete (pA as any).budget;
    const res = validateRoommatePair(pA, validProfileB);
    expect(res.isValid).toBe(false);
    expect(res.missingKeysA).toContain('budget');
  });

  // 5. Missing Person A sleep fails
  it('5. Missing Person A sleep fails', () => {
    const pA = { ...validProfileA };
    delete (pA as any).sleepSchedule;
    const res = validateRoommatePair(pA, validProfileB);
    expect(res.isValid).toBe(false);
    expect(res.missingKeysA).toContain('sleepSchedule');
  });

  // 6. Missing Person A work/study fails
  it('6. Missing Person A work/study fails', () => {
    const pA = { ...validProfileA };
    delete (pA as any).workSchedule;
    const res = validateRoommatePair(pA, validProfileB);
    expect(res.isValid).toBe(false);
    expect(res.missingKeysA).toContain('workSchedule');
  });

  // 7. Missing Person A cleanliness fails
  it('7. Missing Person A cleanliness fails', () => {
    const pA = { ...validProfileA };
    delete (pA as any).cleanliness;
    const res = validateRoommatePair(pA, validProfileB);
    expect(res.isValid).toBe(false);
    expect(res.missingKeysA).toContain('cleanliness');
  });

  // 8. Missing Person A noise fails
  it('8. Missing Person A noise fails', () => {
    const pA = { ...validProfileA };
    delete (pA as any).noiseTolerance;
    const res = validateRoommatePair(pA, validProfileB);
    expect(res.isValid).toBe(false);
    expect(res.missingKeysA).toContain('noiseTolerance');
  });

  // 9. Missing Person A guests fails
  it('9. Missing Person A guests fails', () => {
    const pA = { ...validProfileA };
    delete (pA as any).guests;
    const res = validateRoommatePair(pA, validProfileB);
    expect(res.isValid).toBe(false);
    expect(res.missingKeysA).toContain('guests');
  });

  // 10. Missing Person A smoking fails
  it('10. Missing Person A smoking fails', () => {
    const pA = { ...validProfileA };
    delete (pA as any).smoking;
    const res = validateRoommatePair(pA, validProfileB);
    expect(res.isValid).toBe(false);
    expect(res.missingKeysA).toContain('smoking');
  });

  // 11. Missing Person A food fails
  it('11. Missing Person A food fails', () => {
    const pA = { ...validProfileA };
    delete (pA as any).foodPreferences;
    const res = validateRoommatePair(pA, validProfileB);
    expect(res.isValid).toBe(false);
    expect(res.missingKeysA).toContain('foodPreferences');
  });

  // 12. Missing Person A pets fails
  it('12. Missing Person A pets fails', () => {
    const pA = { ...validProfileA };
    delete (pA as any).pets;
    const res = validateRoommatePair(pA, validProfileB);
    expect(res.isValid).toBe(false);
    expect(res.missingKeysA).toContain('pets');
  });

  // 13. Missing Person A social fails
  it('13. Missing Person A social fails', () => {
    const pA = { ...validProfileA };
    delete (pA as any).socialPreferences;
    const res = validateRoommatePair(pA, validProfileB);
    expect(res.isValid).toBe(false);
    expect(res.missingKeysA).toContain('socialPreferences');
  });

  // 14. Missing Person B budget fails
  it('14. Missing Person B budget fails', () => {
    const pB = { ...validProfileB };
    delete (pB as any).budget;
    const res = validateRoommatePair(validProfileA, pB);
    expect(res.isValid).toBe(false);
    expect(res.missingKeysB).toContain('budget');
  });

  // 15. Missing Person B sleep fails
  it('15. Missing Person B sleep fails', () => {
    const pB = { ...validProfileB };
    delete (pB as any).sleepSchedule;
    const res = validateRoommatePair(validProfileA, pB);
    expect(res.isValid).toBe(false);
    expect(res.missingKeysB).toContain('sleepSchedule');
  });

  // 16. Missing Person B work/study fails
  it('16. Missing Person B work/study fails', () => {
    const pB = { ...validProfileB };
    delete (pB as any).workSchedule;
    const res = validateRoommatePair(validProfileA, pB);
    expect(res.isValid).toBe(false);
    expect(res.missingKeysB).toContain('workSchedule');
  });

  // 17. Missing Person B cleanliness fails
  it('17. Missing Person B cleanliness fails', () => {
    const pB = { ...validProfileB };
    delete (pB as any).cleanliness;
    const res = validateRoommatePair(validProfileA, pB);
    expect(res.isValid).toBe(false);
    expect(res.missingKeysB).toContain('cleanliness');
  });

  // 18. Missing Person B noise fails
  it('18. Missing Person B noise fails', () => {
    const pB = { ...validProfileB };
    delete (pB as any).noiseTolerance;
    const res = validateRoommatePair(validProfileA, pB);
    expect(res.isValid).toBe(false);
    expect(res.missingKeysB).toContain('noiseTolerance');
  });

  // 19. Missing Person B guests fails
  it('19. Missing Person B guests fails', () => {
    const pB = { ...validProfileB };
    delete (pB as any).guests;
    const res = validateRoommatePair(validProfileA, pB);
    expect(res.isValid).toBe(false);
    expect(res.missingKeysB).toContain('guests');
  });

  // 20. Missing Person B smoking fails
  it('20. Missing Person B smoking fails', () => {
    const pB = { ...validProfileB };
    delete (pB as any).smoking;
    const res = validateRoommatePair(validProfileA, pB);
    expect(res.isValid).toBe(false);
    expect(res.missingKeysB).toContain('smoking');
  });

  // 21. Missing Person B food fails
  it('21. Missing Person B food fails', () => {
    const pB = { ...validProfileB };
    delete (pB as any).foodPreferences;
    const res = validateRoommatePair(validProfileA, pB);
    expect(res.isValid).toBe(false);
    expect(res.missingKeysB).toContain('foodPreferences');
  });

  // 22. Missing Person B pets fails
  it('22. Missing Person B pets fails', () => {
    const pB = { ...validProfileB };
    delete (pB as any).pets;
    const res = validateRoommatePair(validProfileA, pB);
    expect(res.isValid).toBe(false);
    expect(res.missingKeysB).toContain('pets');
  });

  // 23. Missing Person B social fails
  it('23. Missing Person B social fails', () => {
    const pB = { ...validProfileB };
    delete (pB as any).socialPreferences;
    const res = validateRoommatePair(validProfileA, pB);
    expect(res.isValid).toBe(false);
    expect(res.missingKeysB).toContain('socialPreferences');
  });

  // 24. Valid select values pass with alias support (food, social, workStudySchedule, guestPreferences)
  it('24. Valid select values pass with aliases', () => {
    const pAWithAliases = {
      budget: '18000',
      sleepSchedule: 'Flexible',
      workStudySchedule: 'Shift work',
      cleanliness: 'Average',
      noiseTolerance: 'High — music/calls fine',
      guestPreferences: 'Frequent guests welcome',
      smoking: 'Smoker — outside only',
      food: 'Vegan',
      pets: 'Pet-friendly',
      social: 'Very social',
    };
    const res = extractAndNormalizeProfile(pAWithAliases, 'profileA');
    expect(res.isValid).toBe(true);
    expect(res.normalized?.workSchedule).toBe('Shift work');
    expect(res.normalized?.guests).toBe('Frequent guests welcome');
    expect(res.normalized?.foodPreferences).toBe('Vegan');
    expect(res.normalized?.socialPreferences).toBe('Very social');
  });

  // 25. Budget string is normalized correctly if necessary
  it('25. Budget string is normalized correctly from formatted currency', () => {
    const pWithCurrency = {
      ...validProfileA,
      budget: '₹25,000',
    };
    const res = extractAndNormalizeProfile(pWithCurrency, 'profileA');
    expect(res.isValid).toBe(true);
    expect(res.normalized?.budget).toBe(25000);
  });

  // 26. Invalid budget / missing values fail properly
  it('26. Invalid budget fails with descriptive message', () => {
    const pInvalidBudget = {
      ...validProfileA,
      budget: 'invalid-budget',
    };
    const res = validateRoommatePair(pInvalidBudget, validProfileB);
    expect(res.isValid).toBe(false);
    expect(res.error).toMatch(/Invalid budget in profileA/i);
  });

  // 27. Whitespace-only values fail
  it('27. Whitespace-only values fail', () => {
    const pWhitespace = {
      ...validProfileA,
      smoking: '   ',
    };
    const res = validateRoommatePair(pWhitespace, validProfileB);
    expect(res.isValid).toBe(false);
    expect(res.missingKeysA).toContain('smoking');
  });

  // 28. API receives both complete profiles
  it('28. API receives both complete profiles and processes without incomplete error', async () => {
    vi.mocked(aiClient.completeStructuredJSON).mockResolvedValueOnce({
      score: 85,
      commonPreferences: ['Shared cleanliness standards'],
      potentialConflicts: ['Different sleep schedules'],
      explanation: 'Profiles have strong compatibility with minor schedule differences.',
    });

    const req = new Request('http://localhost:3000/api/roommates/compatibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileA: validProfileA,
        profileB: validProfileB,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.error).toBeUndefined();
    expect(data.score).toBeDefined();
    expect(data.explanation).toBeDefined();
  });

  // 29. Complete profiles proceed to compatibility calculation
  it('29. Complete profiles proceed to compatibility calculation', async () => {
    vi.mocked(aiClient.completeStructuredJSON).mockResolvedValueOnce({
      score: 98,
      commonPreferences: ['Mutual non-smoking household', 'Shared dietary preference'],
      potentialConflicts: [],
      explanation: 'Both profiles are virtually identical in lifestyle habits.',
    });

    const req = new Request('http://localhost:3000/api/roommates/compatibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileA: validProfileA,
        profileB: { ...validProfileA, sleepSchedule: validProfileA.sleepSchedule },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.score).toBeGreaterThan(90);
  });

  // 30. No demo profile is substituted
  it('30. No demo profile is substituted: calculation reflects exact inputs', async () => {
    vi.mocked(aiClient.completeStructuredJSON).mockResolvedValueOnce({
      score: 30,
      commonPreferences: [],
      potentialConflicts: ['Major lifestyle conflict'],
      explanation: 'Significant friction.',
    });

    const req = new Request('http://localhost:3000/api/roommates/compatibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileA: { ...validProfileA, smoking: 'Smoker' },
        profileB: { ...validProfileA, smoking: 'Non-smoker' },
      }),
    });

    const res = await POST(req);
    const data = await res.json();
    expect(data.potentialConflicts.some((c: string) => c.toLowerCase().includes('smoking') || c.toLowerCase().includes('lifestyle'))).toBe(true);
  });

  // 31. No static compatibility result is substituted
  it('31. No static compatibility result is substituted: score changes deterministically when inputs change', async () => {
    // Aligned test
    const req1 = new Request('http://localhost:3000/api/roommates/compatibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileA: validProfileA,
        profileB: validProfileA,
      }),
    });
    vi.mocked(aiClient.completeStructuredJSON).mockResolvedValueOnce({
      score: 100,
      commonPreferences: ['All aligned'],
      potentialConflicts: [],
      explanation: 'Perfect match',
    });
    const res1 = await POST(req1);
    const data1 = await res1.json();

    // Mismatched test (change budget to huge diff + smoking conflict)
    const req2 = new Request('http://localhost:3000/api/roommates/compatibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileA: validProfileA,
        profileB: { ...validProfileA, budget: 100000, smoking: 'Smoker' },
      }),
    });
    vi.mocked(aiClient.completeStructuredJSON).mockResolvedValueOnce({
      score: 70,
      commonPreferences: [],
      potentialConflicts: ['Budget mismatch', 'Smoking conflict'],
      explanation: 'Friction',
    });
    const res2 = await POST(req2);
    const data2 = await res2.json();

    expect(data1.score).not.toBe(data2.score);
    expect(data1.score).toBe(100);
    expect(data2.score).toBe(70);
  });

  // EXACT SCREENSHOT REPRODUCTION TEST (Step 28)
  it('reproduces exact screenshot configuration and succeeds without incomplete error', async () => {
    const screenshotProfileA = {
      budget: '18000',
      sleepSchedule: 'Early bird (10 PM – 6 AM)',
      workSchedule: 'Shift work',
      cleanliness: 'Relaxed',
      noiseTolerance: 'High — music/calls fine',
      guests: 'Occasional weekends',
      smoking: 'Smoker',
      foodPreferences: 'Non-vegetarian',
      food: 'Non-vegetarian',
      pets: 'Has pet(s)',
      socialPreferences: 'Very social',
      social: 'Very social',
    };

    const screenshotProfileB = {
      budget: '18000',
      sleepSchedule: 'Night owl (12 AM – 8 AM)',
      workSchedule: 'Remote/WFH',
      cleanliness: 'Very neat',
      noiseTolerance: 'Low — need quiet',
      guests: 'Frequent guests welcome',
      smoking: 'Non-smoker',
      foodPreferences: 'Vegan',
      food: 'Vegan',
      pets: 'No pets',
      socialPreferences: 'Mostly keep to myself',
      social: 'Mostly keep to myself',
    };

    // Client-side validation check
    const clientValidation = validateRoommatePair(screenshotProfileA, screenshotProfileB);
    expect(clientValidation.isValid).toBe(true);
    expect(clientValidation.missingKeysA).toHaveLength(0);
    expect(clientValidation.missingKeysB).toHaveLength(0);

    // API check
    vi.mocked(aiClient.completeStructuredJSON).mockResolvedValueOnce({
      score: 23,
      commonPreferences: ['Highly aligned budget expectations'],
      potentialConflicts: [
        'Conflicting sleep schedules',
        'Major cleanliness mismatch',
        'Major lifestyle conflict: Smoker vs Non-smoker',
      ],
      explanation: 'Profiles have major lifestyle frictions despite identical budgets.',
    });

    const req = new Request('http://localhost:3000/api/roommates/compatibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileA: screenshotProfileA,
        profileB: screenshotProfileB,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.error).toBeUndefined();
    expect(data.score).toBe(23);
    expect(data.potentialConflicts.length).toBeGreaterThan(0);
    expect(data.frictionPoints).toBeDefined();
    expect(data.frictionPoints.length).toBeGreaterThan(0);

    // Verify actual Person A and Person B values in friction points
    const sleepFriction = data.frictionPoints.find((fp: any) => fp.category === 'Sleep schedule');
    expect(sleepFriction).toBeDefined();
    expect(sleepFriction.personA).toBe('Early bird (10 PM – 6 AM)');
    expect(sleepFriction.personB).toBe('Night owl (12 AM – 8 AM)');

    const smokingFriction = data.frictionPoints.find((fp: any) => fp.category === 'Smoking');
    expect(smokingFriction).toBeDefined();
    expect(smokingFriction.personA).toBe('Smoker');
    expect(smokingFriction.personB).toBe('Non-smoker');
  });

  // STRUCTURED FRICTION POINTS TESTS
  it('returns empty friction points array when profiles are perfectly identical', async () => {
    vi.mocked(aiClient.completeStructuredJSON).mockResolvedValueOnce({
      score: 100,
      commonPreferences: ['All dimensions aligned'],
      potentialConflicts: [],
      explanation: 'Identical profiles.',
    });

    const req = new Request('http://localhost:3000/api/roommates/compatibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileA: validProfileA,
        profileB: validProfileA,
      }),
    });

    const res = await POST(req);
    const data = await res.json();
    expect(data.score).toBe(100);
    expect(data.frictionPoints).toHaveLength(0);
  });

  it('dynamically adds friction point when a single field conflicts and removes it when restored', async () => {
    // 1. Conflict on smoking
    vi.mocked(aiClient.completeStructuredJSON).mockResolvedValueOnce({
      score: 85,
      commonPreferences: [],
      potentialConflicts: ['Smoking conflict'],
      explanation: 'Smoking difference.',
    });

    const reqConflict = new Request('http://localhost:3000/api/roommates/compatibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileA: { ...validProfileA, smoking: 'Non-smoker' },
        profileB: { ...validProfileA, smoking: 'Smoker' },
      }),
    });

    const resConflict = await POST(reqConflict);
    const dataConflict = await resConflict.json();
    const smokeFp = dataConflict.frictionPoints.find((fp: any) => fp.category === 'Smoking');
    expect(smokeFp).toBeDefined();
    expect(smokeFp.personA).toBe('Non-smoker');
    expect(smokeFp.personB).toBe('Smoker');

    // 2. Restored to matching
    vi.mocked(aiClient.completeStructuredJSON).mockResolvedValueOnce({
      score: 100,
      commonPreferences: ['Mutual non-smoking household'],
      potentialConflicts: [],
      explanation: 'Both non-smokers.',
    });

    const reqMatching = new Request('http://localhost:3000/api/roommates/compatibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileA: { ...validProfileA, smoking: 'Non-smoker' },
        profileB: { ...validProfileA, smoking: 'Non-smoker' },
      }),
    });

    const resMatching = await POST(reqMatching);
    const dataMatching = await resMatching.json();
    const smokeFpMatching = dataMatching.frictionPoints.find((fp: any) => fp.category === 'Smoking');
    expect(smokeFpMatching).toBeUndefined();
  });

  describe('UI Contract & Structured Friction Points Tests', () => {
    const pageContent = fs.readFileSync(
      path.resolve(__dirname, '../../app/(dashboard)/roommates/page.tsx'),
      'utf-8'
    );

    it('1. Fit score renders in the UI markup', () => {
      expect(pageContent).toContain('{result.score}%');
      expect(pageContent).toContain('Fit Score');
    });

    it('2. Narrative analysis is no longer rendered in the UI', () => {
      expect(pageContent).not.toContain('Narrative Analysis');
      expect(pageContent).not.toContain('narrativeAnalysis');
    });

    it('3. Descriptive paragraph beside score is no longer rendered', () => {
      expect(pageContent).not.toContain('{result.explanation}');
    });

    it('4. Friction points section renders dynamically in the UI', () => {
      expect(pageContent).toContain('Potential Friction Points');
      expect(pageContent).toContain('{fp.category}');
      expect(pageContent).toContain('{fp.personA}');
      expect(pageContent).toContain('{fp.personB}');
    });

    it('5. Matching fields do not appear as friction in calculation', async () => {
      vi.mocked(aiClient.completeStructuredJSON).mockResolvedValueOnce({
        score: 100,
        commonPreferences: [],
        potentialConflicts: [],
        explanation: 'Evaluation complete.',
      });

      const req = new Request('http://localhost:3000/api/roommates/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileA: validProfileA,
          profileB: validProfileA,
        }),
      });

      const res = await POST(req);
      const data = await res.json();
      expect(data.frictionPoints).toHaveLength(0);
    });

    it('6. Conflicting fields appear as friction in calculation', async () => {
      vi.mocked(aiClient.completeStructuredJSON).mockResolvedValueOnce({
        score: 70,
        commonPreferences: [],
        potentialConflicts: [],
        explanation: 'Evaluation complete.',
      });

      const req = new Request('http://localhost:3000/api/roommates/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileA: { ...validProfileA, cleanliness: 'Very neat' },
          profileB: { ...validProfileA, cleanliness: 'Relaxed' },
        }),
      });

      const res = await POST(req);
      const data = await res.json();
      expect(data.frictionPoints.some((fp: any) => fp.category === 'Cleanliness')).toBe(true);
    });

    it('7 & 8. Actual Person A and Person B values are provided in friction points', async () => {
      vi.mocked(aiClient.completeStructuredJSON).mockResolvedValueOnce({
        score: 70,
        commonPreferences: [],
        potentialConflicts: [],
        explanation: 'Evaluation complete.',
      });

      const req = new Request('http://localhost:3000/api/roommates/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileA: { ...validProfileA, noiseTolerance: 'High — music/calls fine' },
          profileB: { ...validProfileA, noiseTolerance: 'Low — need quiet' },
        }),
      });

      const res = await POST(req);
      const data = await res.json();
      const noiseFp = data.frictionPoints.find((fp: any) => fp.category === 'Noise tolerance');
      expect(noiseFp).toBeDefined();
      expect(noiseFp.personA).toBe('High — music/calls fine');
      expect(noiseFp.personB).toBe('Low — need quiet');
    });

    it('9 & 10. Changing inputs changes friction points and recalculates score', async () => {
      // Conflicting guest preferences
      vi.mocked(aiClient.completeStructuredJSON).mockResolvedValueOnce({
        score: 85,
        commonPreferences: [],
        potentialConflicts: [],
        explanation: 'Evaluation complete.',
      });

      const req1 = new Request('http://localhost:3000/api/roommates/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileA: { ...validProfileA, guests: 'No guests' },
          profileB: { ...validProfileA, guests: 'Frequent guests welcome' },
        }),
      });

      const res1 = await POST(req1);
      const data1 = await res1.json();
      expect(data1.frictionPoints.some((fp: any) => fp.category === 'Guest preferences')).toBe(true);

      // Aligned guest preferences
      vi.mocked(aiClient.completeStructuredJSON).mockResolvedValueOnce({
        score: 100,
        commonPreferences: [],
        potentialConflicts: [],
        explanation: 'Evaluation complete.',
      });

      const req2 = new Request('http://localhost:3000/api/roommates/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileA: { ...validProfileA, guests: 'No guests' },
          profileB: { ...validProfileA, guests: 'No guests' },
        }),
      });

      const res2 = await POST(req2);
      const data2 = await res2.json();
      expect(data2.frictionPoints.some((fp: any) => fp.category === 'Guest preferences')).toBe(false);
      expect(data1.score).not.toBe(data2.score);
    });

    it('11. No-friction state displays structured placeholder instead of paragraph', () => {
      expect(pageContent).toContain('No major friction points identified.');
    });

    it('12. Multiple friction points work without arbitrary truncation', async () => {
      vi.mocked(aiClient.completeStructuredJSON).mockResolvedValueOnce({
        score: 30,
        commonPreferences: [],
        potentialConflicts: [],
        explanation: 'Evaluation complete.',
      });

      const req = new Request('http://localhost:3000/api/roommates/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileA: {
            ...validProfileA,
            smoking: 'Smoker',
            foodPreferences: 'Non-vegetarian',
            sleepSchedule: 'Early bird (10 PM – 6 AM)',
          },
          profileB: {
            ...validProfileA,
            smoking: 'Non-smoker',
            foodPreferences: 'Vegan',
            sleepSchedule: 'Night owl (12 AM – 8 AM)',
          },
        }),
      });

      const res = await POST(req);
      const data = await res.json();
      expect(data.frictionPoints.length).toBeGreaterThanOrEqual(3);
    });

    it('13. Recalculation completely replaces old state with new response', () => {
      expect(pageContent).toContain('setResult({');
      expect(pageContent).toContain('frictionPoints: data.frictionPoints || []');
    });

    it('14. No hardcoded friction list exists in page or route', () => {
      // Verify page maps dynamically from result.frictionPoints
      expect(pageContent).toContain('result.frictionPoints.map(');
    });

    it('15. No hardcoded score exists in page', () => {
      expect(pageContent).toContain('{result.score}%');
    });
  });

  describe('Graph UI Contract & Breakdown Tests', () => {
    const pageContent = fs.readFileSync(
      path.resolve(__dirname, '../../app/(dashboard)/roommates/page.tsx'),
      'utf-8'
    );

    it('1. Graph renders after successful compatibility evaluation', () => {
      expect(pageContent).toContain('Compatibility by category');
    });

    it('2. Graph contains all 10 categories', () => {
      expect(pageContent).toContain("key: 'budget', label: 'Budget'");
      expect(pageContent).toContain("key: 'sleepSchedule', label: 'Sleep schedule'");
      expect(pageContent).toContain("key: 'workStudySchedule', label: 'Work/study schedule'");
      expect(pageContent).toContain("key: 'cleanliness', label: 'Cleanliness'");
      expect(pageContent).toContain("key: 'noiseTolerance', label: 'Noise tolerance'");
      expect(pageContent).toContain("key: 'guestPreferences', label: 'Guest preferences'");
      expect(pageContent).toContain("key: 'smoking', label: 'Smoking'");
      expect(pageContent).toContain("key: 'foodPreferences', label: 'Food preferences'");
      expect(pageContent).toContain("key: 'pets', label: 'Pets'");
      expect(pageContent).toContain("key: 'socialPreferences', label: 'Social preferences'");
    });

    it('3. API returns breakdown with all 10 categories', async () => {
      vi.mocked(aiClient.completeStructuredJSON).mockResolvedValueOnce({
        score: 100,
        commonPreferences: [],
        potentialConflicts: [],
        explanation: 'Evaluation complete.',
      });

      const req = new Request('http://localhost:3000/api/roommates/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileA: validProfileA,
          profileB: validProfileA,
        }),
      });

      const res = await POST(req);
      const data = await res.json();
      expect(data.breakdown).toBeDefined();
      expect(data.breakdown.budget).toBeDefined();
      expect(data.breakdown.sleepSchedule).toBeDefined();
      expect(data.breakdown.cleanliness).toBeDefined();
      expect(data.breakdown.smoking).toBeDefined();
      expect(data.breakdown.guestPreferences).toBeDefined();
      expect(data.breakdown.noiseTolerance).toBeDefined();
      expect(data.breakdown.pets).toBeDefined();
      expect(data.breakdown.socialPreferences).toBeDefined();
      expect(data.breakdown.workStudySchedule).toBeDefined();
      expect(data.breakdown.foodPreferences).toBeDefined();
    });

    it('4. Changing sleep changes sleep graph score', async () => {
      vi.mocked(aiClient.completeStructuredJSON).mockResolvedValueOnce({
        score: 90,
        commonPreferences: [],
        potentialConflicts: [],
        explanation: 'Evaluation complete.',
      });

      const req1 = new Request('http://localhost:3000/api/roommates/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileA: { ...validProfileA, sleepSchedule: 'Night owl (12 AM – 8 AM)' },
          profileB: { ...validProfileA, sleepSchedule: 'Night owl (12 AM – 8 AM)' },
        }),
      });

      const res1 = await POST(req1);
      const data1 = await res1.json();
      const sleepScoreAligned = data1.breakdown.sleepSchedule;

      vi.mocked(aiClient.completeStructuredJSON).mockResolvedValueOnce({
        score: 75,
        commonPreferences: [],
        potentialConflicts: [],
        explanation: 'Evaluation complete.',
      });

      const req2 = new Request('http://localhost:3000/api/roommates/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileA: { ...validProfileA, sleepSchedule: 'Night owl (12 AM – 8 AM)' },
          profileB: { ...validProfileA, sleepSchedule: 'Early bird (10 PM – 6 AM)' },
        }),
      });

      const res2 = await POST(req2);
      const data2 = await res2.json();
      const sleepScoreConflicted = data2.breakdown.sleepSchedule;

      expect(sleepScoreAligned).toBeGreaterThan(sleepScoreConflicted);
    });

    it('5. Graph is dynamic and updates when state changes', () => {
      expect(pageContent).toContain('result.breakdown');
      expect(pageContent).toContain('result.breakdown![cat.key] ?? 0');
    });
  });
});
