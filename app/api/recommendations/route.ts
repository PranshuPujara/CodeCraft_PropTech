import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import {
  generatePropertyRecommendations,
  UserPreferencesInput,
  CandidatePropertyInput,
} from '../../../lib/ai/prompts/recommend';
import { calculateFullCostBreakdown } from '../../../lib/cost';

export const dynamic = 'force-dynamic';

/**
 * GET /api/recommendations
 * PRODUCT.md §6.4 | ARCHITECTURE.md §4
 * Returns personalized, ranked property recommendations based on explicit user preferences.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Extract explicit preferences from query string with boundary validation
    const queryUserId = searchParams.get('userId')?.trim().slice(0, 100);
    const rawBudget = searchParams.get('budget');
    const parsedBudget = rawBudget ? parseFloat(rawBudget) : undefined;
    const queryBudget = parsedBudget !== undefined && !isNaN(parsedBudget) && parsedBudget > 0 && parsedBudget <= 10000000 ? parsedBudget : undefined;

    const rawBedrooms = searchParams.get('bedrooms');
    const parsedBedrooms = rawBedrooms ? parseInt(rawBedrooms, 10) : undefined;
    const queryBedrooms = parsedBedrooms !== undefined && !isNaN(parsedBedrooms) && parsedBedrooms >= 0 && parsedBedrooms <= 10 ? parsedBedrooms : undefined;

    const queryLocation = searchParams.get('location')?.trim().slice(0, 100) || undefined;
    const queryFurnishing = searchParams.get('furnishing')?.trim().slice(0, 50) || undefined;
    const queryAmenities = searchParams.get('amenities')
      ? searchParams.get('amenities')!.split(',').map(a => a.trim().slice(0, 50)).filter(Boolean).slice(0, 20)
      : undefined;
    const queryCommutePoint = searchParams.get('commutePoint')?.trim().slice(0, 100) || undefined;
    const queryOtherPreferences = searchParams.get('otherPreferences')?.trim().slice(0, 200) || undefined;

    let preferences: UserPreferencesInput = {
      budget: queryBudget,
      location: queryLocation,
      bedrooms: queryBedrooms,
      furnishing: queryFurnishing,
      amenities: queryAmenities,
      commutePoint: queryCommutePoint,
      otherPreferences: queryOtherPreferences,
    };

    // If no explicit preferences provided in URL, fallback to user's saved preferences
    const hasAnyQueryPreference = Object.values(preferences).some((val) => val !== undefined && (Array.isArray(val) ? val.length > 0 : true));

    if (!hasAnyQueryPreference) {
      const userId = queryUserId || 'demo-user-1';
      const user = await db.user.findUnique({ where: { id: userId } });
      
      if (user) {
        let dbPrefs: Partial<UserPreferencesInput> = {};
        try {
          if (user.preferences) {
            dbPrefs = JSON.parse(user.preferences);
          }
        } catch (e) {
          console.warn('Failed to parse user preferences JSON', e);
        }
        
        preferences = {
          budget: user.budget,
          location: dbPrefs.location,
          bedrooms: dbPrefs.bedrooms,
          furnishing: dbPrefs.furnishing,
          amenities: dbPrefs.amenities,
          commutePoint: dbPrefs.commutePoint,
          otherPreferences: dbPrefs.otherPreferences,
        };
      }
    }

    // Validate that we have at least one explicit preference
    const hasAnyPreference = Object.values(preferences).some(
      (val) => val !== undefined && (Array.isArray(val) ? val.length > 0 : val !== '')
    );

    if (!hasAnyPreference) {
      return NextResponse.json(
        { error: 'Invalid or missing preference input. At least one explicit preference (budget, location, etc.) must be provided.' },
        { status: 400 }
      );
    }

    // Fetch all available properties to rank (or a reasonable limit for candidate selection)
    const properties = await db.property.findMany({
      include: {
        costBreakdown: true,
      }
    });

    if (properties.length === 0) {
      return NextResponse.json(
        { error: 'No properties available in the system.' },
        { status: 404 }
      );
    }

    // Format properties and calculate true monthly cost FIRST
    const candidateProperties: CandidatePropertyInput[] = properties.map((p) => {
      let estimatedMonthlyCost: number | undefined;
      if (p.costBreakdown) {
        estimatedMonthlyCost = p.costBreakdown.estimatedMonthlyCost;
      } else {
        const fullCost = calculateFullCostBreakdown({
          rent: p.rent,
          deposit: p.deposit,
          brokerage: p.brokerage,
        });
        estimatedMonthlyCost = fullCost.estimatedMonthlyCost;
      }

      return {
        id: p.id,
        title: p.title,
        location: p.location,
        rent: p.rent,
        deposit: p.deposit,
        bedrooms: p.bedrooms,
        furnishing: p.furnishing,
        amenities: p.amenities,
        estimatedMonthlyCost,
        description: p.description,
      };
    });

    // Apply hard filtering using TRUE monthly cost
    let filteredProperties = candidateProperties;
    
    if (preferences.budget && preferences.budget > 0) {
      filteredProperties = filteredProperties.filter(p => p.estimatedMonthlyCost !== undefined && p.estimatedMonthlyCost <= preferences.budget!);
    }
    
    if (preferences.bedrooms !== undefined) {
      filteredProperties = filteredProperties.filter(p => p.bedrooms === preferences.bedrooms);
    }
    
    if (preferences.furnishing && preferences.furnishing.trim().length > 0) {
      filteredProperties = filteredProperties.filter(p => p.furnishing.toLowerCase() === preferences.furnishing!.toLowerCase());
    }

    // Generate ranked recommendations based ONLY on explicitly filtered preferences
    const aiRecommendations = await generatePropertyRecommendations(preferences, filteredProperties);

    return NextResponse.json({
      recommendations: aiRecommendations.recommendations,
      summaryExplanation: aiRecommendations.summaryExplanation,
      appliedPreferences: preferences, // Helpful for UI to show exactly what was evaluated
    });
  } catch (error) {
    console.error('Error in GET /api/recommendations:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while generating recommendations.' },
      { status: 500 }
    );
  }
}
