import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { calculateFullCostBreakdown, CostInput } from '../../../../../lib/cost';

export async function GET(
  request: NextRequest,
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

    const { searchParams } = new URL(request.url);
    const budgetParam = searchParams.get('budget');
    const userIdParam = searchParams.get('userId');

    let budget: number | undefined;

    if (budgetParam !== null) {
      const parsed = Number(budgetParam);
      if (!isNaN(parsed) && parsed > 0) {
        budget = parsed;
      }
    } else if (userIdParam) {
      const user = await db.user.findUnique({
        where: { id: userIdParam.trim() },
      });
      if (user) {
        budget = user.budget;
      }
    } else {
      // Default to demo user budget if available
      const demoUser = await db.user.findUnique({
        where: { id: 'demo-user-1' },
      });
      if (demoUser) {
        budget = demoUser.budget;
      }
    }

    const costInput: CostInput = {
      rent: property.rent,
      deposit: property.deposit,
      brokerage: property.brokerage,
      maintenance: property.costBreakdown?.maintenance,
      electricity: property.costBreakdown?.electricity,
      water: property.costBreakdown?.water,
      internet: property.costBreakdown?.internet,
      transport: property.costBreakdown?.transport,
      otherRecurring: property.costBreakdown?.otherRecurring,
    };

    const costResult = calculateFullCostBreakdown(costInput, budget);

    return NextResponse.json({
      propertyId: property.id,
      ...costResult,
    });
  } catch (error: unknown) {
    console.error('Error calculating property cost:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      {
        error: 'Failed to calculate property cost',
        details: message,
      },
      { status: 500 }
    );
  }
}
