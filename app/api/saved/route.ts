import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { getAuthUser } from '../../../lib/auth-session';

export const dynamic = 'force-dynamic';

const DEFAULT_USER_ID = 'demo-user-1';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    const { searchParams } = new URL(request.url);
    const userId =
      authUser?.id ||
      searchParams.get('userId') ||
      DEFAULT_USER_ID;

    const isShortlistedParam = searchParams.get('isShortlisted');

    const where: Record<string, unknown> = { userId };

    if (isShortlistedParam !== null) {
      where.isShortlisted = isShortlistedParam === 'true';
    }

    const saved = await db.savedProperty.findMany({
      where,
      include: {
        property: {
          include: {
            costBreakdown: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const parsedSaved = saved.map((item) => {
      let amenities: string[] = [];
      try {
        amenities = JSON.parse(item.property.amenities);
      } catch {
        amenities = [];
      }
      return {
        ...item,
        property: {
          ...item.property,
          amenities,
        },
      };
    });

    return NextResponse.json({
      savedProperties: parsedSaved,
      count: parsedSaved.length,
    });
  } catch (error: unknown) {
    console.error('Error retrieving saved properties:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      {
        error: 'Failed to retrieve saved properties',
        details: message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    const body = await request.json().catch(() => null);

    if (!body || !body.propertyId || typeof body.propertyId !== 'string') {
      return NextResponse.json(
        { error: 'Valid propertyId is required' },
        { status: 400 }
      );
    }

    const userId =
      authUser?.id ||
      body.userId ||
      DEFAULT_USER_ID;
    const propertyId = body.propertyId.trim();
    const isShortlisted =
      typeof body.isShortlisted === 'boolean' ? body.isShortlisted : false;

    // Verify property exists
    const property = await db.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Ensure user exists
    let user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user && userId === DEFAULT_USER_ID) {
      user = await db.user.create({
        data: {
          id: DEFAULT_USER_ID,
          name: 'Demo User',
          budget: 35000,
          preferences: JSON.stringify({}),
        },
      });
    }

    const saved = await db.savedProperty.upsert({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
      update: {
        isShortlisted,
      },
      create: {
        userId,
        propertyId,
        isShortlisted,
      },
      include: {
        property: {
          include: {
            costBreakdown: true,
          },
        },
      },
    });

    let amenities: string[] = [];
    try {
      amenities = JSON.parse(saved.property.amenities);
    } catch {
      amenities = [];
    }

    return NextResponse.json(
      {
        savedProperty: {
          ...saved,
          property: {
            ...saved.property,
            amenities,
          },
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error saving property:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      {
        error: 'Failed to save property',
        details: message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    const { searchParams } = new URL(request.url);
    let propertyId = searchParams.get('propertyId');
    let userId =
      authUser?.id ||
      searchParams.get('userId') ||
      DEFAULT_USER_ID;

    if (!propertyId) {
      const body = await request.json().catch(() => null);
      if (body?.propertyId) {
        propertyId = body.propertyId;
        if (body.userId) userId = body.userId;
      }
    }

    if (!propertyId || typeof propertyId !== 'string') {
      return NextResponse.json(
        { error: 'Valid propertyId is required to delete saved property' },
        { status: 400 }
      );
    }

    const result = await db.savedProperty.deleteMany({
      where: {
        userId,
        propertyId: propertyId.trim(),
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Saved property not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Property successfully removed from saved list',
      propertyId: propertyId.trim(),
      userId,
    });
  } catch (error: unknown) {
    console.error('Error deleting saved property:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      {
        error: 'Failed to remove saved property',
        details: message,
      },
      { status: 500 }
    );
  }
}
