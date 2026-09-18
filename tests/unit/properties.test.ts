import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getProperties } from '../../app/api/properties/route';
import { GET as getPropertyDetail } from '../../app/api/properties/[id]/route';
import { GET as getPropertyCost } from '../../app/api/properties/[id]/cost/route';
import {
  GET as getSavedProperties,
  POST as saveProperty,
  DELETE as deleteSavedProperty,
} from '../../app/api/saved/route';

// Mock db for testing route handlers
vi.mock('../../lib/db', () => {
  const mockProperties = [
    {
      id: 'prop-1',
      title: 'Modern 2BHK in Heart of Indiranagar',
      location: 'Indiranagar, Bangalore',
      rent: 32000,
      deposit: 150000,
      brokerage: 16000,
      furnishing: 'Semi-Furnished',
      amenities: JSON.stringify(['Power Backup', 'Security', 'Parking', 'Wifi']),
      bedrooms: 2,
      description: 'Spacious 2BHK apartment in Indiranagar',
      createdAt: new Date(),
      updatedAt: new Date(),
      costBreakdown: {
        id: 'cost-1',
        propertyId: 'prop-1',
        maintenance: 3000,
        electricity: 1500,
        water: 500,
        internet: 1000,
        transport: 2000,
        otherRecurring: 500,
        estimatedMonthlyCost: 40500,
        initialMoveInCost: 198000,
      },
    },
    {
      id: 'prop-2',
      title: 'Affordable 1BHK near Metro',
      location: 'HSR Layout, Bangalore',
      rent: 18000,
      deposit: 80000,
      brokerage: 0,
      furnishing: 'Unfurnished',
      amenities: JSON.stringify(['Security', 'Parking']),
      bedrooms: 1,
      description: 'Cozy 1BHK close to metro station',
      createdAt: new Date(),
      updatedAt: new Date(),
      costBreakdown: null,
    },
  ];

  let mockSaved: any[] = [];

  return {
    db: {
      property: {
        findMany: vi.fn(async ({ where }: { where?: any } = {}) => {
          let results = [...mockProperties];
          if (where?.rent?.lte) {
            results = results.filter((p) => p.rent <= where.rent.lte);
          }
          if (where?.bedrooms !== undefined) {
            results = results.filter((p) => p.bedrooms === where.bedrooms);
          }
          if (where?.furnishing?.contains) {
            results = results.filter((p) =>
              p.furnishing.toLowerCase().includes(where.furnishing.contains.toLowerCase())
            );
          }
          if (where?.location?.contains) {
            results = results.filter((p) =>
              p.location.toLowerCase().includes(where.location.contains.toLowerCase())
            );
          }
          return results;
        }),
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
          return mockProperties.find((p) => p.id === where.id) || null;
        }),
      },
      user: {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
          if (where.id === 'demo-user-1') {
            return {
              id: 'demo-user-1',
              name: 'Alex Johnson',
              budget: 35000,
            };
          }
          return null;
        }),
        create: vi.fn(async ({ data }: any) => data),
      },
      savedProperty: {
        findMany: vi.fn(async ({ where }: { where?: any } = {}) => {
          return mockSaved.filter((s) => {
            if (where?.userId && s.userId !== where.userId) return false;
            if (where?.isShortlisted !== undefined && s.isShortlisted !== where.isShortlisted)
              return false;
            return true;
          });
        }),
        upsert: vi.fn(async ({ create, update, where }: any) => {
          const existingIndex = mockSaved.findIndex(
            (s) =>
              s.userId === where.userId_propertyId.userId &&
              s.propertyId === where.userId_propertyId.propertyId
          );
          const property = mockProperties.find(
            (p) => p.id === (create?.propertyId || where.userId_propertyId.propertyId)
          );

          if (existingIndex >= 0) {
            mockSaved[existingIndex] = {
              ...mockSaved[existingIndex],
              ...update,
              property,
            };
            return mockSaved[existingIndex];
          } else {
            const newItem = {
              id: 'saved-' + (mockSaved.length + 1),
              ...create,
              property,
              createdAt: new Date(),
            };
            mockSaved.push(newItem);
            return newItem;
          }
        }),
        deleteMany: vi.fn(async ({ where }: any) => {
          const initialLen = mockSaved.length;
          mockSaved = mockSaved.filter(
            (s) => !(s.userId === where.userId && s.propertyId === where.propertyId)
          );
          return { count: initialLen - mockSaved.length };
        }),
      },
    },
  };
});

describe('Property Discovery & Cost APIs', () => {
  describe('GET /api/properties', () => {
    it('returns all properties with parsed amenities array', async () => {
      const req = new NextRequest('http://localhost:3000/api/properties');
      const res = await getProperties(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(data.properties)).toBe(true);
      expect(data.properties.length).toBe(2);
      expect(Array.isArray(data.properties[0].amenities)).toBe(true);
      expect(data.properties[0].amenities).toContain('Security');
    });

    it('filters properties by budget correctly', async () => {
      const req = new NextRequest('http://localhost:3000/api/properties?budget=20000');
      const res = await getProperties(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.properties.length).toBe(1);
      expect(data.properties[0].id).toBe('prop-2');
    });

    it('filters properties by bedrooms correctly', async () => {
      const req = new NextRequest('http://localhost:3000/api/properties?bedrooms=2');
      const res = await getProperties(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.properties.length).toBe(1);
      expect(data.properties[0].bedrooms).toBe(2);
    });

    it('rejects invalid budget input with 400 error', async () => {
      const req = new NextRequest('http://localhost:3000/api/properties?budget=invalid');
      const res = await getProperties(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('rejects negative bedrooms input with 400 error', async () => {
      const req = new NextRequest('http://localhost:3000/api/properties?bedrooms=-1');
      const res = await getProperties(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });

  describe('GET /api/properties/[id]', () => {
    it('returns property detail for valid ID', async () => {
      const req = new NextRequest('http://localhost:3000/api/properties/prop-1');
      const res = await getPropertyDetail(req, { params: { id: 'prop-1' } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.property).toBeDefined();
      expect(data.property.id).toBe('prop-1');
      expect(Array.isArray(data.property.amenities)).toBe(true);
    });

    it('returns 404 for non-existent property ID', async () => {
      const req = new NextRequest('http://localhost:3000/api/properties/unknown-id');
      const res = await getPropertyDetail(req, { params: { id: 'unknown-id' } });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toContain('not found');
    });
  });

  describe('GET /api/properties/[id]/cost', () => {
    it('returns itemized cost, move-in cost, and affordability for valid ID', async () => {
      const req = new NextRequest('http://localhost:3000/api/properties/prop-1/cost?budget=40000');
      const res = await getPropertyCost(req, { params: { id: 'prop-1' } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.propertyId).toBe('prop-1');
      expect(data.estimatedMonthlyCost).toBeDefined();
      expect(data.initialMoveInCost).toBeDefined();
      expect(data.affordability).toBeDefined();
      expect(data.affordability.percentage).toBeDefined();
      expect(data.rent.isEstimated).toBe(false);
    });

    it('returns 404 for cost request with invalid property ID', async () => {
      const req = new NextRequest('http://localhost:3000/api/properties/unknown-id/cost');
      const res = await getPropertyCost(req, { params: { id: 'unknown-id' } });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBeDefined();
    });
  });

  describe('Saved & Shortlisted API (/api/saved)', () => {
    it('saves a property and returns 201', async () => {
      const req = new NextRequest('http://localhost:3000/api/saved', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'demo-user-1',
          propertyId: 'prop-1',
          isShortlisted: true,
        }),
      });

      const res = await saveProperty(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.savedProperty).toBeDefined();
      expect(data.savedProperty.propertyId).toBe('prop-1');
      expect(data.savedProperty.isShortlisted).toBe(true);
    });

    it('lists saved properties for user', async () => {
      const req = new NextRequest('http://localhost:3000/api/saved?userId=demo-user-1');
      const res = await getSavedProperties(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(data.savedProperties)).toBe(true);
      expect(data.savedProperties.length).toBeGreaterThanOrEqual(1);
    });

    it('removes a property from saved list', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/saved?propertyId=prop-1&userId=demo-user-1',
        { method: 'DELETE' }
      );
      const res = await deleteSavedProperty(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.message).toContain('successfully removed');
    });
  });
});
