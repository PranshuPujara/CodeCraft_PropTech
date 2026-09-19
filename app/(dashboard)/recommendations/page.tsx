'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { demoProperties } from '@/lib/demo-data';
import { getPropertyImage } from '@/lib/property-images';
import { BookmarkIcon, BookmarkOutlineIcon, StarIcon, SparklesIcon } from '@/components/icons';
import { useUser } from '@/context/UserContext';

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
    deposit?: number;
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

const BUDGET_PRESETS = [
  { label: '₹25K', value: '25000' },
  { label: '₹35K', value: '35000' },
  { label: '₹50K', value: '50000' },
];

export default function RecommendationsPage() {
  const { budget: globalBudget, updateBudget, isLoading: isUserLoading } = useUser();
  const [budget, setBudget] = useState(globalBudget.toString());
  const [bedroomPref, setBedroomPref] = useState('2');
  const [furnishingPref, setFurnishingPref] = useState('Any');
  const [results, setResults] = useState<EnrichedRecommendation[]>([]);
  const [summaryExplanation, setSummaryExplanation] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load saved property IDs
  const fetchSaved = useCallback(async () => {
    try {
      const res = await fetch('/api/saved');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.savedProperties)) {
          setSavedIds(data.savedProperties.map((s: { propertyId: string }) => s.propertyId));
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  const toggleSave = async (id: string) => {
    const isCurrentlySaved = savedIds.includes(id);
    setSavedIds((prev) =>
      isCurrentlySaved ? prev.filter((i) => i !== id) : [...prev, id]
    );

    try {
      if (isCurrentlySaved) {
        await fetch(`/api/saved?propertyId=${id}`, { method: 'DELETE' });
      } else {
        await fetch('/api/saved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ propertyId: id }),
        });
      }
    } catch {
      // Revert on error
      setSavedIds((prev) =>
        isCurrentlySaved ? [...prev, id] : prev.filter((i) => i !== id)
      );
    }
  };

  useEffect(() => {
    if (!isUserLoading) {
      setBudget(globalBudget.toString());
    }
  }, [globalBudget, isUserLoading]);

  const fetchRecommendations = useCallback(async () => {
    setValidationError(null);

    // Validate budget
    if (budget.trim() !== '') {
      const budgetNum = Number(budget);
      if (isNaN(budgetNum) || budgetNum <= 0) {
        setValidationError('Please enter a valid monthly budget greater than ₹0.');
        return;
      }
      if (budgetNum > 10000000) {
        setValidationError('Monthly budget cannot exceed ₹1,00,00,000.');
        return;
      }
      
      if (budgetNum !== globalBudget) {
        await updateBudget(budgetNum);
      }
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (budget.trim()) params.set('budget', budget.trim());
      if (bedroomPref !== 'Any') params.set('bedrooms', bedroomPref);
      if (furnishingPref !== 'Any') params.set('furnishing', furnishingPref);

      // 1. Fetch recommendations
      const recRes = await fetch(`/api/recommendations?${params.toString()}`);
      let recs: RecommendationItem[] = [];
      if (recRes.ok) {
        const recData = await recRes.json();
        if (Array.isArray(recData.recommendations)) {
          recs = recData.recommendations;
        }
        if (recData.summaryExplanation) {
          setSummaryExplanation(recData.summaryExplanation);
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

      setResults(enriched);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setResults([]);
      setValidationError('Unable to calculate recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [budget, bedroomPref, furnishingPref]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* 1. Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Property Matching
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Recommended for you
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Properties ranked against your budget, space requirements, and estimated true living costs.
        </p>
      </div>

      {/* 2. Preference Filters */}
      <Card className="p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          {/* Budget with quick presets */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Monthly budget
              </label>
              <div className="flex gap-1">
                {BUDGET_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      setBudget(preset.value);
                      if (validationError) setValidationError(null);
                    }}
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition ${
                      budget === preset.value
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-semibold text-gray-400">
                ₹
              </span>
              <input
                type="number"
                min="1000"
                max="10000000"
                step="500"
                value={budget}
                onChange={(e) => {
                  setBudget(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-7 pr-3 text-sm font-medium text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                placeholder="35000"
              />
            </div>
          </div>

          {/* Bedrooms */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Bedrooms
            </label>
            <select
              value={bedroomPref}
              onChange={(e) => setBedroomPref(e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="Any">Any BHK</option>
              <option value="1">1 BHK</option>
              <option value="2">2 BHK</option>
              <option value="3">3 BHK</option>
            </select>
          </div>

          {/* Furnishing */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Furnishing
            </label>
            <select
              value={furnishingPref}
              onChange={(e) => setFurnishingPref(e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="Any">Any Furnishing</option>
              <option value="Furnished">Furnished</option>
              <option value="Semi-Furnished">Semi-Furnished</option>
              <option value="Unfurnished">Unfurnished</option>
            </select>
          </div>

          {/* Apply button */}
          <div>
            <button
              onClick={fetchRecommendations}
              disabled={isLoading}
              className="h-9 w-full rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {isLoading ? 'Updating...' : 'Update matches'}
            </button>
          </div>
        </div>

        {validationError && (
          <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {validationError}
          </div>
        )}
      </Card>

      {/* 3. Results Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-500" />
              Finding your best property matches...
            </span>
          ) : (
            summaryExplanation || `${results.length} properties matched your preferences`
          )}
        </p>
      </div>

      {/* 4. Ranked Property Cards */}
      <div className="space-y-4">
        {!isLoading && results.length === 0 ? (
          <Card className="p-10 text-center">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              No matching properties found
            </h3>
            <p className="mx-auto mt-1.5 max-w-sm text-xs text-gray-500 dark:text-gray-400">
              Try adjusting your monthly budget or selecting Any BHK / Any Furnishing to discover more homes.
            </p>
            <button
              onClick={() => {
                setBudget('45000');
                setBedroomPref('Any');
                setFurnishingPref('Any');
              }}
              className="mt-4 rounded-lg border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              Reset to wider filters
            </button>
          </Card>
        ) : (
          results.map(({ property, rank, matchScore, reason }) => {
            const monthlyEst =
              property.costBreakdown?.estimatedMonthlyCost ||
              property.cost?.estimatedMonthlyCost ||
              property.rent + 4000;
            const moveInEst =
              property.costBreakdown?.initialMoveInCost ||
              property.cost?.initialMoveInCost ||
              property.rent * 3;
            const isSaved = savedIds.includes(property.id);
            const imageInfo = getPropertyImage(property);

            return (
              <Card
                key={property.id}
                className="group overflow-hidden transition hover:border-gray-300 dark:hover:border-gray-700"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Property Image & Rank Indicator */}
                  <div className="relative h-44 w-full shrink-0 overflow-hidden bg-gray-100 sm:h-auto sm:w-56 md:w-64 dark:bg-gray-800">
                    <img
                      src={imageInfo.url}
                      alt={imageInfo.alt}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* Compact rank chip */}
                    <div className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-md bg-gray-900/85 px-2 py-1 text-[11px] font-bold text-white shadow backdrop-blur-sm">
                      <span className="text-emerald-400">#{rank}</span>
                      <span className="font-normal text-gray-300">Pick</span>
                    </div>

                    {/* Bookmark quick button */}
                    <button
                      type="button"
                      onClick={() => toggleSave(property.id)}
                      className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-sm backdrop-blur-sm transition hover:scale-105 dark:bg-gray-900/90 dark:text-gray-300"
                      aria-label={isSaved ? 'Remove from saved' : 'Save property'}
                    >
                      {isSaved ? (
                        <BookmarkIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <BookmarkOutlineIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Property Details */}
                  <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                    <div>
                      {/* Title & Match Badge */}
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <Link
                            href={`/properties/${property.id}`}
                            className="text-base font-bold text-gray-900 transition hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400 sm:text-lg"
                          >
                            {property.title}
                          </Link>
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {property.location} · {property.bedrooms} BHK · {property.furnishing}
                          </p>
                        </div>

                        {/* Calm match score pill */}
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                          {matchScore}% match
                        </span>
                      </div>

                      {/* Cost Summary Row */}
                      <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2 text-xs dark:border-gray-800 dark:bg-gray-800/40">
                        <div>
                          <span className="text-gray-400 dark:text-gray-500">True Monthly: </span>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {money(monthlyEst)}
                          </span>
                          <span className="text-[11px] text-gray-400"> / mo</span>
                        </div>
                        <div className="text-gray-300 dark:text-gray-700">•</div>
                        <div>
                          <span className="text-gray-400 dark:text-gray-500">Base Rent: </span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {money(property.rent)}
                          </span>
                        </div>
                        <div className="text-gray-300 dark:text-gray-700">•</div>
                        <div>
                          <span className="text-gray-400 dark:text-gray-500">Move-in: </span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {money(moveInEst)}
                          </span>
                        </div>
                      </div>

                      {/* Why it matches (Calm, readable explanation) */}
                      <div className="mt-3 rounded-lg border-l-2 border-emerald-500 bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-gray-800/30 dark:text-gray-300">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          Why it fits:{' '}
                        </span>
                        <span>{reason}</span>
                      </div>
                    </div>

                    {/* Card Footer: Amenities & Actions */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3 dark:border-gray-800">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(property.amenities) &&
                          property.amenities.slice(0, 4).map((a: string) => (
                            <span
                              key={a}
                              className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                            >
                              {a}
                            </span>
                          ))}
                      </div>

                      <Link
                        href={`/properties/${property.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                      >
                        <span>View breakdown</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
