import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { calculateFullCostBreakdown } from '../../../lib/cost';
import {
  generateComparisonTradeoffs,
  PropertyComparisonInput,
} from '../../../lib/ai/prompts/compare';

/**
 * POST /api/compare
 * PRODUCT.md §6.3 | ARCHITECTURE.md §4
 * Compares 2 or more properties side-by-side with itemized costs and AI trade-off analysis.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body. JSON object expected.' },
        { status: 400 }
      );
    }

    const { propertyIds, userId } = body;

    if (!propertyIds || !Array.isArray(propertyIds)) {
      return NextResponse.json(
        { error: 'propertyIds must be an array of at least 2 property IDs.' },
        { status: 400 }
      );
    }

    // Deduplicate IDs while preserving order
    const uniquePropertyIds = Array.from(new Set(propertyIds.filter((id) => typeof id === 'string' && id.trim().length > 0)));

    if (uniquePropertyIds.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 valid and unique property IDs are required for comparison.' },
        { status: 400 }
      );
    }

    // Fetch user if specified for budget/affordability calculation
    let userBudget: number | undefined;
    if (userId && typeof userId === 'string') {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (user) {
        userBudget = user.budget;
      }
    } else {
      // Default to demo user if available
      const demoUser = await db.user.findUnique({ where: { id: 'demo-user-1' } });
      if (demoUser) {
        userBudget = demoUser.budget;
      }
    }

    // Fetch properties with cost breakdown
    const properties = await db.property.findMany({
      where: {
        id: { in: uniquePropertyIds },
      },
      include: {
        costBreakdown: true,
      },
    });

    const foundIds = new Set(properties.map((p) => p.id));
    const missingIds = uniquePropertyIds.filter((id) => !foundIds.has(id));

    if (missingIds.length > 0 && properties.length < 2) {
      return NextResponse.json(
        {
          error: `Insufficient valid properties found for comparison. Missing property IDs: ${missingIds.join(', ')}`,
        },
        { status: 404 }
      );
    }

    // Sort properties to match the requested order
    const sortedProperties = uniquePropertyIds
      .map((id) => properties.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined);

    // Format properties and compute full cost breakdown using single source of truth (/lib/cost.ts)
    const formattedProperties = sortedProperties.map((p) => {
      const parsedAmenities: string[] = typeof p.amenities === 'string'
        ? (JSON.parse(p.amenities || '[]') as string[])
        : Array.isArray(p.amenities)
        ? p.amenities
        : [];

      const fullCost = calculateFullCostBreakdown(
        {
          rent: p.rent,
          deposit: p.deposit,
          brokerage: p.brokerage,
          maintenance: p.costBreakdown?.maintenance,
          electricity: p.costBreakdown?.electricity,
          water: p.costBreakdown?.water,
          internet: p.costBreakdown?.internet,
          transport: p.costBreakdown?.transport,
          otherRecurring: p.costBreakdown?.otherRecurring,
        },
        userBudget
      );

      return {
        id: p.id,
        title: p.title,
        location: p.location,
        rent: p.rent,
        deposit: p.deposit,
        brokerage: p.brokerage,
        furnishing: p.furnishing,
        amenities: parsedAmenities,
        bedrooms: p.bedrooms,
        description: p.description,
        costBreakdown: fullCost,
      };
    });

    // Prepare inputs for comparison trade-offs prompt
    const comparisonInputs: PropertyComparisonInput[] = formattedProperties.map((p) => ({
      id: p.id,
      title: p.title,
      location: p.location,
      rent: p.rent,
      deposit: p.deposit,
      brokerage: p.brokerage,
      bedrooms: p.bedrooms,
      furnishing: p.furnishing,
      amenities: p.amenities,
      estimatedMonthlyCost: p.costBreakdown.estimatedMonthlyCost,
      initialMoveInCost: p.costBreakdown.initialMoveInCost,
      description: p.description,
    }));

    // Generate plain-language trade-offs naming dimensions and both properties
    const aiTradeoffs = await generateComparisonTradeoffs(comparisonInputs);

    const normalizedTradeoffs = (aiTradeoffs.tradeoffs || []).map((t) => ({
      ...t,
      tradeoff: t.tradeoff || (t as any).statement,
      statement: t.tradeoff || (t as any).statement,
    }));

    return NextResponse.json({
      properties: formattedProperties,
      tradeoffs: normalizedTradeoffs,
      summary: aiTradeoffs.summary,
      ...(missingIds.length > 0 ? { warnings: [`Some requested IDs were not found: ${missingIds.join(', ')}`] } : {}),
    });
  } catch (error) {
    console.error('Error in POST /api/compare:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while generating property comparison.' },
      { status: 500 }
    );
  }
}
