import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { getPropertyImage } from '../../../lib/property-images';

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
    const sortBy = searchParams.get('sortBy')?.trim();

    // Input validation: budget
    let maxBudget: number | undefined;
    if (budgetParam !== null && budgetParam !== '' && budgetParam !== 'Any') {
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
    if (bedroomsParam !== null && bedroomsParam !== '' && bedroomsParam !== 'Any') {
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

    if (furnishing && furnishing !== 'Any') {
      where.furnishing = {
        contains: furnishing,
      };
    }

    if (location && location !== 'All') {
      where.location = {
        contains: location,
      };
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

    // Parse JSON amenities, attach image, and apply enhanced multi-token search in memory
    let properties = rawProperties.map((prop) => {
      let parsedAmenities: string[] = [];
      try {
        parsedAmenities = JSON.parse(prop.amenities);
      } catch {
        parsedAmenities = [];
      }
      const imageInfo = getPropertyImage({
        id: prop.id,
        title: prop.title,
        bedrooms: prop.bedrooms,
        description: prop.description,
      });

      return {
        ...prop,
        amenities: parsedAmenities,
        image: imageInfo.url,
        imageAlt: imageInfo.alt,
      };
    });

    // Multi-token keyword search across title, location, description, furnishing, and amenities
    if (keyword) {
      const tokens = keyword
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => t.length > 0);

      if (tokens.length > 0) {
        properties = properties.filter((prop) => {
          const titleLower = prop.title.toLowerCase();
          const locationLower = prop.location.toLowerCase();
          const descLower = prop.description.toLowerCase();
          const furnishingLower = prop.furnishing.toLowerCase();
          const amenitiesLower = prop.amenities.map((a) => a.toLowerCase());

          return tokens.every((token) => {
            // Check BHK variants e.g. "2bhk" or "2"
            if (token === '1bhk' || token === '1-bhk') return prop.bedrooms === 1;
            if (token === '2bhk' || token === '2-bhk') return prop.bedrooms === 2;
            if (token === '3bhk' || token === '3-bhk') return prop.bedrooms === 3;

            return (
              titleLower.includes(token) ||
              locationLower.includes(token) ||
              descLower.includes(token) ||
              furnishingLower.includes(token) ||
              amenitiesLower.some((a) => a.includes(token))
            );
          });
        });
      }
    }

    // Amenity filter
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

    // Sorting
    if (sortBy === 'price-asc') {
      properties.sort((a, b) => a.rent - b.rent);
    } else if (sortBy === 'price-desc') {
      properties.sort((a, b) => b.rent - a.rent);
    } else if (sortBy === 'newest') {
      properties.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
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
