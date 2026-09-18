import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { calculateFullCostBreakdown } from '../../../lib/cost';
import { completeStructuredJSON } from '../../../lib/ai/client';
import {
  DECISION_ASSISTANT_SYSTEM_PROMPT,
  buildDecisionAssistantUserPrompt,
  generateDeterministicDecisionSupport,
  ShortlistedPropertyContext,
  DecisionUserPreferences,
} from '../../../lib/ai/prompts/decisionAssistant';
import type { DecisionAssistantResponse } from '../../../lib/ai/types';

export const dynamic = 'force-dynamic';

const DEFAULT_USER_ID = 'demo-user-1';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || DEFAULT_USER_ID;

    // 1. Fetch User & Preferences from Database
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    let userBudget = 35000;
    let parsedPreferences: Record<string, any> = {};

    if (user) {
      userBudget = user.budget || 35000;
      try {
        parsedPreferences = JSON.parse(user.preferences || '{}');
      } catch {
        parsedPreferences = {};
      }
    }

    // Override with any explicit preferences sent in request
    const effectivePreferences: DecisionUserPreferences = {
      budget: Number(body.preferences?.budget) || userBudget,
      location: body.preferences?.location || parsedPreferences.location,
      bedrooms: body.preferences?.bedrooms !== undefined ? Number(body.preferences.bedrooms) : parsedPreferences.bedrooms,
      furnishing: body.preferences?.furnishing || parsedPreferences.furnishing,
      amenities: Array.isArray(body.preferences?.amenities) ? body.preferences.amenities : parsedPreferences.amenities,
      commutePoint: body.preferences?.commutePoint || parsedPreferences.commutePoint,
      maxCommuteMinutes: body.preferences?.maxCommuteMinutes ? Number(body.preferences.maxCommuteMinutes) : undefined,
      priority: body.preferences?.priority || 'Balanced',
    };

    // 2. Fetch Shortlisted Properties
    let candidateProperties: any[] = [];

    if (Array.isArray(body.propertyIds)) {
      if (body.propertyIds.length > 0) {
        candidateProperties = await db.property.findMany({
          where: { id: { in: body.propertyIds } },
          include: { costBreakdown: true },
        });
      } else {
        candidateProperties = [];
      }
    } else {
      // Query shortlisted properties for user from database
      const saved = await db.savedProperty.findMany({
        where: {
          userId,
          isShortlisted: true,
        },
        include: {
          property: {
            include: { costBreakdown: true },
          },
        },
      });

      candidateProperties = saved.map((s) => s.property);

      // If user has fewer than 2 shortlisted, check general saved properties as fallback
      if (candidateProperties.length < 2) {
        const allSaved = await db.savedProperty.findMany({
          where: { userId },
          include: {
            property: {
              include: { costBreakdown: true },
            },
          },
          take: 4,
        });
        if (allSaved.length >= 2) {
          candidateProperties = allSaved.map((s) => s.property);
        }
      }
    }

    // 3. Validation: Decision Assistant strictly requires at least 2 properties
    if (candidateProperties.length < 2) {
      return NextResponse.json(
        {
          error: 'At least 2 shortlisted properties are required to analyze decision trade-offs.',
          count: candidateProperties.length,
        },
        { status: 400 }
      );
    }

    // 4. Transform into ShortlistedPropertyContext using shared Cost Engine
    const propertyContexts: ShortlistedPropertyContext[] = candidateProperties.map((prop) => {
      let amenities: string[] = [];
      try {
        amenities = typeof prop.amenities === 'string' ? JSON.parse(prop.amenities) : prop.amenities;
      } catch {
        amenities = [];
      }

      // Use shared cost calculation engine from lib/cost.ts
      const costInput = {
        rent: prop.rent,
        deposit: prop.deposit,
        brokerage: prop.brokerage,
        maintenance: prop.costBreakdown?.maintenance ?? 3000,
        electricity: prop.costBreakdown?.electricity ?? 1500,
        water: prop.costBreakdown?.water ?? 500,
        internet: prop.costBreakdown?.internet ?? 1000,
        transport: prop.costBreakdown?.transport ?? 2000,
        otherRecurring: prop.costBreakdown?.otherRecurring ?? 500,
      };

      const fullCost = calculateFullCostBreakdown(costInput, effectivePreferences.budget);

      return {
        id: prop.id,
        title: prop.title,
        location: prop.location,
        rent: prop.rent,
        deposit: prop.deposit,
        brokerage: prop.brokerage,
        furnishing: prop.furnishing,
        bedrooms: prop.bedrooms,
        amenities,
        description: prop.description,
        commute: prop.costBreakdown?.transport ? `${prop.costBreakdown.transport} min to tech hubs` : undefined,
        cost: {
          estimatedMonthlyCost: fullCost.estimatedMonthlyCost,
          initialMoveInCost: fullCost.initialMoveInCost,
          maintenance: costInput.maintenance,
          electricity: costInput.electricity,
          water: costInput.water,
          internet: costInput.internet,
          transport: costInput.transport,
          otherRecurring: costInput.otherRecurring,
          affordabilitySignal: fullCost.affordability?.formattedSignal,
          affordabilityStatus: fullCost.affordability?.status,
        },
      };
    });

    // 5. Generate Structured Decision Assistant Response
    const userMessage = buildDecisionAssistantUserPrompt(
      effectivePreferences,
      propertyContexts
    );

    let decisionResult: DecisionAssistantResponse;

    try {
      decisionResult = await completeStructuredJSON<DecisionAssistantResponse>({
        systemPrompt: DECISION_ASSISTANT_SYSTEM_PROMPT,
        userMessage,
      });

      // Ensure backward-compatibility mappings
      if (!decisionResult.summary && decisionResult.narrative) {
        decisionResult.summary = decisionResult.narrative;
      }
      if (!decisionResult.properties && decisionResult.propertyProsCons) {
        decisionResult.properties = decisionResult.propertyProsCons.map((p) => ({
          propertyId: p.propertyId,
          propertyName: p.propertyName || p.propertyId,
          pros: p.pros,
          cons: p.cons,
          preferenceAlignment: p.preferenceAlignment || [],
          tradeoffs: p.tradeoffs || [],
        }));
      }
    } catch (aiError) {
      console.warn('AI call for decision assistant failed; using deterministic decision synthesis:', aiError);
      decisionResult = generateDeterministicDecisionSupport(effectivePreferences, propertyContexts);
    }

    return NextResponse.json({
      ...decisionResult,
      evaluatedAgainst: {
        budget: effectivePreferences.budget,
        bedrooms: effectivePreferences.bedrooms,
        furnishing: effectivePreferences.furnishing,
        location: effectivePreferences.location,
      },
      userPreferences: effectivePreferences,
      propertyCount: propertyContexts.length,
      shortlistedCount: propertyContexts.length,
    });
  } catch (error: unknown) {
    console.error('Error in decision assistant API:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: 'Failed to generate decision assistant analysis.', details: message },
      { status: 500 }
    );
  }
}
