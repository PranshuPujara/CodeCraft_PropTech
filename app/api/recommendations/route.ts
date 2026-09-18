import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import {
  generatePropertyRecommendations,
  UserPreferencesInput,
  CandidatePropertyInput,
} from '../../../lib/ai/prompts/recommend';
import { calculateFullCostBreakdown } from '../../../lib/cost';

/**
 * GET /api/recommendations
 * PRODUCT.md §6.4 | ARCHITECTURE.md §4
 * Returns personalized, ranked property recommendations based on explicit user preferences.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Extract explicit preferences from query string
    const queryUserId = searchParams.get('userId');
    const queryBudget = searchParams.get('budget') ? parseFloat(searchParams.get('budget') as string) : undefined;
    const queryLocation = searchParams.get('location') || undefined;
    const queryBedrooms = searchParams.get('bedrooms') ? parseInt(searchParams.get('bedrooms') as string, 10) : undefined;
    const queryFurnishing = searchParams.get('furnishing') || undefined;
    const queryAmenities = searchParams.get('amenities') ? searchParams.get('amenities')!.split(',').map(a => a.trim()) : undefined;
    const queryCommutePoint = searchParams.get('commutePoint') || undefined;
    const queryOtherPreferences = searchParams.get('otherPreferences') || undefined;

    let preferences: UserPreferencesInput = {
      budget: queryBudget && !isNaN(queryBudget) ? queryBudget : undefined,
      location: queryLocation,
      bedrooms: queryBedrooms && !isNaN(queryBedrooms) ? queryBedrooms : undefined,
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
        let dbPrefs: any = {};
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

    // Format properties for the AI recommendation prompt
    const candidateProperties: CandidatePropertyInput[] = properties.map((p) => {
      // Use precomputed costBreakdown or fallback to calculating it if missing
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

    // Generate ranked recommendations based ONLY on explicit preferences
    const aiRecommendations = await generatePropertyRecommendations(preferences, candidateProperties);

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
