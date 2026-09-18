import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as postAgreement } from '../../app/api/agreements/route';
import { POST as postRoommateCompatibility } from '../../app/api/roommates/compatibility/route';
import { POST as postCompare } from '../../app/api/compare/route';
import { POST as postDecisionAssistant } from '../../app/api/decision-assistant/route';
import { GET as getProperties } from '../../app/api/properties/route';
import { GET as getRecommendations } from '../../app/api/recommendations/route';

describe('Global Input Validation Tests', () => {
  describe('1. Agreement File Upload Validation', () => {
    it('rejects upload when no file is provided', async () => {
      const formData = new FormData();
      const req = new Request('http://localhost:3000/api/agreements', {
        method: 'POST',
        body: formData,
      });

      const res = await postAgreement(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/No file uploaded/i);
    });

    it('rejects non-PDF files', async () => {
      const formData = new FormData();
      const textBlob = new Blob(['not a pdf content'], { type: 'text/plain' });
      formData.append('file', textBlob, 'notes.txt');

      const req = new Request('http://localhost:3000/api/agreements', {
        method: 'POST',
        body: formData,
      });

      const res = await postAgreement(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/Only PDF files.*are accepted/i);
    });

    it('rejects empty PDF files (0 bytes)', async () => {
      const formData = new FormData();
      const emptyBlob = new Blob([], { type: 'application/pdf' });
      formData.append('file', emptyBlob, 'empty.pdf');

      const req = new Request('http://localhost:3000/api/agreements', {
        method: 'POST',
        body: formData,
      });

      const res = await postAgreement(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/file is empty/i);
    });
  });

  describe('2. Roommate Compatibility Input Validation', () => {
    const baseProfile = {
      sleepSchedule: 'Night owl (12 AM - 8 AM)',
      workSchedule: 'Hybrid (2-3 days office)',
      cleanliness: 'Very neat / tidy daily',
      noiseTolerance: 'Moderate noise ok',
      guests: 'Occasional weekends',
      smoking: 'Never',
      foodPreferences: 'No preference / flexible',
      pets: 'No pets',
      socialPreferences: 'Friendly but private',
    };

    it('rejects negative budget in profileA', async () => {
      const req = new Request('http://localhost:3000/api/roommates/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileA: { ...baseProfile, budget: -5000 },
          profileB: { ...baseProfile, budget: 20000 },
        }),
      });

      const res = await postRoommateCompatibility(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/Invalid budget in profileA/i);
    });

    it('rejects non-numeric budget string in profileB', async () => {
      const req = new Request('http://localhost:3000/api/roommates/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileA: { ...baseProfile, budget: 20000 },
          profileB: { ...baseProfile, budget: 'not-a-number' },
        }),
      });

      const res = await postRoommateCompatibility(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/Invalid budget in profileB/i);
    });

    it('rejects budget exceeding upper limit (10,000,000)', async () => {
      const req = new Request('http://localhost:3000/api/roommates/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileA: { ...baseProfile, budget: 50000000 },
          profileB: { ...baseProfile, budget: 20000 },
        }),
      });

      const res = await postRoommateCompatibility(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/Invalid budget in profileA/i);
    });
  });

  describe('3. Comparison Route Input Validation', () => {
    it('rejects request when propertyIds is missing or not an array', async () => {
      const req = new NextRequest('http://localhost:3000/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyIds: 'single-string' }),
      });

      const res = await postCompare(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/must be an array/i);
    });

    it('rejects request with duplicate IDs that result in fewer than 2 unique IDs', async () => {
      const req = new NextRequest('http://localhost:3000/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyIds: ['same-id-1', 'same-id-1'] }),
      });

      const res = await postCompare(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/At least 2 valid and unique property IDs/i);
    });
  });

  describe('4. Property Query Filter Validation', () => {
    it('rejects negative budget in property query parameters', async () => {
      const req = new NextRequest('http://localhost:3000/api/properties?budget=-1000');
      const res = await getProperties(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/non-negative number/i);
    });

    it('rejects fractional or negative bedroom counts in property query parameters', async () => {
      const req = new NextRequest('http://localhost:3000/api/properties?bedrooms=-2');
      const res = await getProperties(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/non-negative integer/i);
    });
  });

  describe('5. Recommendations Query Validation', () => {
    it('ignores invalid negative budgets and falls back cleanly without 500 error', async () => {
      const req = new NextRequest('http://localhost:3000/api/recommendations?budget=-50000');
      const res = await getRecommendations(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('recommendations');
    });
  });

  describe('6. Decision Assistant Input Validation', () => {
    it('rejects empty propertyIds array with informative 400 error', async () => {
      const req = new NextRequest('http://localhost:3000/api/decision-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyIds: [] }),
      });

      const res = await postDecisionAssistant(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/at least 2.*shortlisted/i);
    });

    it('rejects single property ID with 400 error', async () => {
      const req = new NextRequest('http://localhost:3000/api/decision-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyIds: ['single-id'] }),
      });

      const res = await postDecisionAssistant(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/at least 2.*shortlisted/i);
    });
  });
});
