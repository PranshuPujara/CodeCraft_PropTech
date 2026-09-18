import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../../app/api/compare/route';
import { db } from '../../lib/db';

describe('POST /api/compare API Route', () => {
  it('returns 400 when body is invalid or missing propertyIds', async () => {
    const req = new NextRequest('http://localhost:3000/api/compare', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('propertyIds must be an array');
  });

  it('returns 400 when fewer than 2 property IDs are provided', async () => {
    const req = new NextRequest('http://localhost:3000/api/compare', {
      method: 'POST',
      body: JSON.stringify({ propertyIds: ['single-id'] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('At least 2 valid and unique property IDs');
  });

  it('returns 404 when non-existent property IDs are passed resulting in < 2 properties', async () => {
    const req = new NextRequest('http://localhost:3000/api/compare', {
      method: 'POST',
      body: JSON.stringify({ propertyIds: ['non-existent-1', 'non-existent-2'] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain('Insufficient valid properties found');
  });

  it('successfully compares 2 valid seeded properties with cost breakdown and trade-offs', async () => {
    const properties = await db.property.findMany({ take: 2 });
    expect(properties.length).toBeGreaterThanOrEqual(2);

    const propertyIds = [properties[0].id, properties[1].id];

    const req = new NextRequest('http://localhost:3000/api/compare', {
      method: 'POST',
      body: JSON.stringify({ propertyIds, userId: 'demo-user-1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty('properties');
    expect(data).toHaveProperty('tradeoffs');
    expect(data).toHaveProperty('summary');

    expect(data.properties.length).toBe(2);
    expect(data.properties[0].id).toBe(propertyIds[0]);
    expect(data.properties[1].id).toBe(propertyIds[1]);

    // Check itemized cost breakdown on both
    for (const prop of data.properties) {
      expect(prop.costBreakdown).toBeDefined();
      expect(prop.costBreakdown.estimatedMonthlyCost).toBeGreaterThan(0);
      expect(prop.costBreakdown.initialMoveInCost).toBeGreaterThan(0);
      expect(prop.costBreakdown.rent).toHaveProperty('value');
      expect(prop.costBreakdown.rent).toHaveProperty('isEstimated');
      expect(prop.costBreakdown.affordability).toBeDefined();
      expect(prop.costBreakdown.affordability.ratio).toBeGreaterThan(0);
    }

    // Check trade-offs
    expect(Array.isArray(data.tradeoffs)).toBe(true);
    expect(data.tradeoffs.length).toBeGreaterThan(0);

    for (const tradeoff of data.tradeoffs) {
      expect(tradeoff.dimension).toBeDefined();
      expect(tradeoff.tradeoff).toBeDefined();
      expect(tradeoff.propertyAId).toBe(propertyIds[0]);
      expect(tradeoff.propertyBId).toBe(propertyIds[1]);
    }
  });
});
