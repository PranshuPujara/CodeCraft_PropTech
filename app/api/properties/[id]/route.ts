import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    const property = await db.property.findUnique({
      where: { id: id.trim() },
      include: {
        costBreakdown: true,
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    let parsedAmenities: string[] = [];
    try {
      parsedAmenities = JSON.parse(property.amenities);
    } catch {
      parsedAmenities = [];
    }

    return NextResponse.json({
      property: {
        ...property,
        amenities: parsedAmenities,
      },
    });
  } catch (error: any) {
    console.error('Error fetching property detail:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch property detail',
        details: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
