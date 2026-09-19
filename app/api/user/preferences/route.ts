import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

const DEFAULT_USER_ID = 'demo-user-1';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || DEFAULT_USER_ID;

    let user = await db.user.findUnique({
      where: { id: userId },
    });

    // Create demo user if it doesn't exist
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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      budget: user.budget,
      preferences: user.preferences ? JSON.parse(user.preferences) : {},
    });
  } catch (error: unknown) {
    console.error('Error retrieving user preferences:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: 'Failed to retrieve user preferences', details: message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const userId = body.userId || DEFAULT_USER_ID;
    
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
    } else if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updateData: any = {};

    if (body.budget !== undefined) {
      const budget = Number(body.budget);
      if (isNaN(budget) || budget <= 0 || budget > 10000000) {
        return NextResponse.json({ error: 'Invalid budget. Must be between 1 and 10,000,000' }, { status: 400 });
      }
      updateData.budget = budget;
    }

    if (body.preferences !== undefined) {
      updateData.preferences = JSON.stringify(body.preferences);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({
      budget: updatedUser.budget,
      preferences: updatedUser.preferences ? JSON.parse(updatedUser.preferences) : {},
    });
  } catch (error: unknown) {
    console.error('Error updating user preferences:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: 'Failed to update user preferences', details: message },
      { status: 500 }
    );
  }
}
