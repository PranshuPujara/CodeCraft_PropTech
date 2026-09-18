import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../../app/api/recommendations/route';

describe('GET /api/recommendations API Route', () => {
  it('returns 400 when no explicit preferences are provided', async () => {
    // Missing all explicit query parameters and missing userId (defaults to demo-user-1 but wait, demo-user-1 has preferences seeded. 
    // Wait, the API tries to fetch demo-user-1's preferences. If they exist, it might succeed.
    // Let's pass a non-existent user ID and no query params to force a 400.
    const req = new NextRequest('http://localhost:3000/api/recommendations?userId=non-existent-user');
    
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Invalid or missing preference input');
  });

  it('successfully generates recommendations with explicit URL query parameters', async () => {
    const req = new NextRequest('http://localhost:3000/api/recommendations?budget=35000&location=Indiranagar&bedrooms=2&amenities=Gym,Power%20Backup');
    
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty('recommendations');
    expect(data).toHaveProperty('summaryExplanation');
    expect(data).toHaveProperty('appliedPreferences');

    // Check applied preferences matches the URL query
    expect(data.appliedPreferences.budget).toBe(35000);
    expect(data.appliedPreferences.location).toBe('Indiranagar');
    expect(data.appliedPreferences.bedrooms).toBe(2);
    expect(data.appliedPreferences.amenities).toEqual(['Gym', 'Power Backup']);

    // Check recommendations structure
    expect(Array.isArray(data.recommendations)).toBe(true);
    expect(data.recommendations.length).toBeGreaterThan(0);

    for (const rec of data.recommendations) {
      expect(rec.propertyId).toBeDefined();
      expect(rec.matchScore).toBeGreaterThan(0);
      expect(rec.matchScore).toBeLessThanOrEqual(100);
      expect(rec.reason).toBeDefined();
    }
  });

  it('successfully falls back to seeded user preferences if no explicit URL query parameters are provided', async () => {
    // 'demo-user-1' is seeded with budget and preferences in prisma/seed.ts
    const req = new NextRequest('http://localhost:3000/api/recommendations?userId=demo-user-1');
    
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty('recommendations');
    expect(data).toHaveProperty('appliedPreferences');
    
    // The default seeded user has a budget
    expect(data.appliedPreferences.budget).toBeDefined();
  });
});
