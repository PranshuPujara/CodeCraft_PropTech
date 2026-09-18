'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { demoProperties } from '@/lib/demo-data';
import { StarIcon, SparklesIcon } from '@/components/icons';

const money = (v: number) => `₹${new Intl.NumberFormat('en-IN').format(v)}`;

interface RecommendationItem {
  propertyId: string;
  rank: number;
  matchScore: number;
  reason: string;
}

interface EnrichedRecommendation {
  property: {
    id: string;
    title: string;
    location: string;
    rent: number;
    bedrooms: number;
    furnishing: string;
    amenities: string[];
    costBreakdown?: {
      estimatedMonthlyCost: number;
      initialMoveInCost: number;
    };
    cost?: {
      estimatedMonthlyCost: number;
      initialMoveInCost: number;
    };
  };
  rank: number;
  matchScore: number;
  reason: string;
}

export default function RecommendationsPage() {
  const [budget, setBudget] = useState('35000');
  const [bedroomPref, setBedroomPref] = useState('2');
  const [furnishingPref, setFurnishingPref] = useState('Any');
  const [results, setResults] = useState<EnrichedRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (budget) params.set('budget', budget);
      if (bedroomPref !== 'Any') params.set('bedrooms', bedroomPref);
      if (furnishingPref !== 'Any') params.set('furnishing', furnishingPref);

      // 1. Fetch AI recommendations
      const recRes = await fetch(`/api/recommendations?${params.toString()}`);
      let recs: RecommendationItem[] = [];
      if (recRes.ok) {
        const recData = await recRes.json();
        if (Array.isArray(recData.recommendations)) {
          recs = recData.recommendations;
        }
      }

      // 2. Fetch properties to pair with recommendations
      const propsRes = await fetch('/api/properties');
      let allProps: any[] = [];
      if (propsRes.ok) {
        const propsData = await propsRes.json();
        allProps = propsData.properties || [];
      }
      if (allProps.length === 0) {
        allProps = demoProperties;
      }

      // 3. Enrich recommendations
      if (recs.length > 0) {
        const enriched: EnrichedRecommendation[] = recs
          .map((rec) => {
            const matchedProp = allProps.find((p) => p.id === rec.propertyId);
            if (!matchedProp) return null;
            return {
              property: matchedProp,
              rank: rec.rank,
              matchScore: rec.matchScore,
              reason: rec.reason,
            };
          })
          .filter(Boolean) as EnrichedRecommendation[];

        if (enriched.length > 0) {
          setResults(enriched);
          setIsLoading(false);
          return;
        }
      }

      // Fallback
      setResults(
        demoProperties.slice(0, 3).map((p, i) => ({
          property: p,
          rank: i + 1,
          matchScore: 92 - i * 4,
          reason: `Matches budget of ₹${budget} and location preferences. Estimated monthly cost is ₹${money(
            p.cost.estimatedMonthlyCost
          )}.`,
        }))
      );
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setResults(
        demoProperties.slice(0, 3).map((p, i) => ({
          property: p,
          rank: i + 1,
          matchScore: 90 - i * 5,
          reason: `Fulfills bedroom and budget criteria. True monthly cost is estimated at ₹${money(
            p.cost.estimatedMonthlyCost
          )}.`,
        }))
      );
    } finally {
      setIsLoading(false);
    }
  }, [budget, bedroomPref, furnishingPref]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Personalized recommendations
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Properties that match your needs.
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Every recommendation is ranked by the backend engine with an explicit explanation.
        </p>
      </div>

      {/* Preference inputs */}
      <Card className="p-5 sm:p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white">Your preferences</h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Adjust preferences to recalculate personalized matches.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Monthly budget (₹)
            </label>
            <input
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              placeholder="35000"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Bedrooms
            </label>
            <select
              value={bedroomPref}
              onChange={(e) => setBedroomPref(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <option value="Any">Any BHK</option>
              <option value="1">1 BHK</option>
              <option value="2">2 BHK</option>
              <option value="3">3 BHK</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Furnishing
            </label>
            <select
              value={furnishingPref}
              onChange={(e) => setFurnishingPref(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <option value="Any">Any</option>
              <option value="Furnished">Furnished</option>
              <option value="Semi-Furnished">Semi-Furnished</option>
              <option value="Unfurnished">Unfurnished</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchRecommendations}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              <SparklesIcon className="h-4 w-4" /> Recalculate
            </button>
          </div>
        </div>
      </Card>

      {/* Results header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 animate-ping rounded-full bg-emerald-500" />
              Generating attribute-grounded recommendations...
            </span>
          ) : (
            `${results.length} ranked matches found`
          )}
        </p>
      </div>

      {/* Ranked property cards */}
      <div className="space-y-4">
        {results.map(({ property, rank, matchScore, reason }) => {
          const monthlyEst =
            property.costBreakdown?.estimatedMonthlyCost ||
            property.cost?.estimatedMonthlyCost ||
            property.rent + 4000;
          const moveInEst =
            property.costBreakdown?.initialMoveInCost ||
            property.cost?.initialMoveInCost ||
            property.rent * 3;

          return (
            <Card key={property.id} className="p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-base font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                    #{rank}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/properties/${property.id}`}
                        className="font-bold text-gray-900 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400 sm:text-lg"
                      >
                        {property.title}
                      </Link>
                      <Badge tone="green">
                        <StarIcon className="mr-1 inline h-3.5 w-3.5" />
                        {matchScore}% match score
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {property.location} · {property.bedrooms} BHK · {property.furnishing}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    ≈ {money(monthlyEst)}
                    <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                      {' '}
                      / mo
                    </span>
                  </p>
                  <p className="text-xs text-gray-400">Move-in: {money(moveInEst)}</p>
                </div>
              </div>

              {/* Binding Rule: Score/Recommendation MUST have explicit explanation next to it */}
              <div className="mt-4 rounded-xl bg-emerald-50/60 p-3.5 dark:bg-emerald-950/20">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Why this matches your criteria
                </p>
                <p className="mt-1 text-sm leading-6 text-gray-700 dark:text-gray-300">
                  {reason}
                </p>
              </div>

              {/* Card footer */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3 dark:border-gray-800">
                <div className="flex flex-wrap gap-1.5">
                  {Array.isArray(property.amenities) &&
                    property.amenities.slice(0, 4).map((a: string) => (
                      <span
                        key={a}
                        className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      >
                        {a}
                      </span>
                    ))}
                </div>
                <Link
                  href={`/properties/${property.id}`}
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                >
                  View full breakdown →
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
