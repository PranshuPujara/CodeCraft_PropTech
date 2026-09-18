import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const keyword = searchParams.get('keyword')?.trim();
    const location = searchParams.get('location')?.trim();
    const budgetParam = searchParams.get('budget');
    const bedroomsParam = searchParams.get('bedrooms');
    const furnishing = searchParams.get('furnishing')?.trim();
    const amenitiesParam = searchParams.get('amenities')?.trim();

    // Input validation: budget
    let maxBudget: number | undefined;
    if (budgetParam !== null) {
      maxBudget = Number(budgetParam);
      if (isNaN(maxBudget) || maxBudget < 0) {
        return NextResponse.json(
          { error: 'Invalid budget parameter: must be a non-negative number' },
          { status: 400 }
        );
      }
    }

    // Input validation: bedrooms
    let bedrooms: number | undefined;
    if (bedroomsParam !== null) {
      bedrooms = Number(bedroomsParam);
      if (isNaN(bedrooms) || !Number.isInteger(bedrooms) || bedrooms < 0) {
        return NextResponse.json(
          { error: 'Invalid bedrooms parameter: must be a non-negative integer' },
          { status: 400 }
        );
      }
    }

    // Build Prisma query conditions
    const where: Record<string, unknown> = {};

    if (maxBudget !== undefined) {
      where.rent = { lte: maxBudget };
    }

    if (bedrooms !== undefined) {
      where.bedrooms = bedrooms;
    }

    if (furnishing) {
      where.furnishing = {
        contains: furnishing,
      };
    }

    if (location) {
      where.location = {
        contains: location,
      };
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { location: { contains: keyword } },
        { description: { contains: keyword } },
      ];
    }

    const rawProperties = await db.property.findMany({
      where,
      include: {
        costBreakdown: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Parse JSON amenities and apply amenity filter in memory (SQLite compatibility)
    let properties = rawProperties.map((prop) => {
      let parsedAmenities: string[] = [];
      try {
        parsedAmenities = JSON.parse(prop.amenities);
      } catch {
        parsedAmenities = [];
      }
      return {
        ...prop,
        amenities: parsedAmenities,
      };
    });

    if (amenitiesParam) {
      const requestedAmenities = amenitiesParam
        .split(',')
        .map((a) => a.trim().toLowerCase())
        .filter(Boolean);

      if (requestedAmenities.length > 0) {
        properties = properties.filter((prop) => {
          const propAmenitiesLower = prop.amenities.map((a) => a.toLowerCase());
          return requestedAmenities.every((req) =>
            propAmenitiesLower.some((a) => a.includes(req))
          );
        });
      }
    }

    return NextResponse.json({
      properties,
      count: properties.length,
    });
  } catch (error: unknown) {
    console.error('Error fetching properties:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      {
        error: 'Failed to fetch properties',
        details: message,
      },
      { status: 500 }
    );
  }
}
