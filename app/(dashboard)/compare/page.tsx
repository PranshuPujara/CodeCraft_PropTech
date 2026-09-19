'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { demoProperties } from '@/lib/demo-data';
import { useUser } from '@/context/UserContext';

const money = (v: number) => `₹${new Intl.NumberFormat('en-IN').format(v)}`;

interface ComparedProperty {
  id: string;
  title: string;
  location: string;
  rent: number;
  deposit: number;
  bedrooms: number;
  bathrooms?: number;
  furnishing: string;
  commute?: string;
  amenities: string[];
  costBreakdown?: {
    estimatedMonthlyCost: number;
    initialMoveInCost: number;
    affordability?: {
      formattedSignal: string;
      status: string;
    };
  };
}

interface TradeOff {
  dimension: string;
  propertyAId?: string;
  propertyBId?: string;
  statement?: string;
  tradeoff?: string;
}

function CompareContent() {
  const searchParams = useSearchParams();
  const { budget: budgetThreshold, isLoading: isUserLoading } = useUser();
  const [properties, setProperties] = useState<ComparedProperty[]>([]);
  const [tradeoffs, setTradeoffs] = useState<TradeOff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    async function loadComparison() {
      setIsLoading(true);
      try {
        let propertyIds: string[] = [];
        const idsParam = searchParams.get('ids');

        if (idsParam) {
          propertyIds = idsParam
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        } else {
          // Fetch shortlisted/saved properties first
          const savedRes = await fetch('/api/saved');
          if (savedRes.ok) {
            const savedData = await savedRes.json();
            const shortlisted = savedData.savedProperties?.filter(
              (s: any) => s.isShortlisted
            );
            if (shortlisted && shortlisted.length >= 2) {
              propertyIds = shortlisted.map((s: any) => s.propertyId);
            } else if (savedData.savedProperties?.length >= 2) {
              propertyIds = savedData.savedProperties
                .slice(0, 2)
                .map((s: any) => s.propertyId);
            }
          }
        }

        // If still fewer than 2, get from properties list
        if (propertyIds.length < 2) {
          const propsRes = await fetch('/api/properties');
          if (propsRes.ok) {
            const propsData = await propsRes.json();
            if (propsData.properties?.length >= 2) {
              propertyIds = propsData.properties.slice(0, 2).map((p: any) => p.id);
            }
          }
        }

        if (propertyIds.length >= 2) {
          const compareRes = await fetch('/api/compare', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ propertyIds, budget: budgetThreshold }),
          });

          if (compareRes.ok) {
            const compareData = await compareRes.json();
            if (compareData.properties && compareData.properties.length >= 2) {
              setProperties(compareData.properties);
              setTradeoffs(compareData.tradeoffs || []);
              setIsLoading(false);
              return;
            }
          }
        }

        // Fallback to demo properties
        const fallbackProps = demoProperties.slice(0, 2);
        setProperties(fallbackProps as any);
        setTradeoffs([
          {
            dimension: 'Rent',
            tradeoff: `${fallbackProps[0].title} has higher base rent than ${fallbackProps[1].title}.`,
          },
        ]);
      } catch (e) {
        console.error('Error loading comparison:', e);
        setProperties(demoProperties.slice(0, 2) as any);
      } finally {
        setIsLoading(false);
      }
    }

    if (!isUserLoading) {
      loadComparison();
    }
  }, [searchParams, budgetThreshold, isUserLoading]);

  const getMonthlyCost = (p: ComparedProperty) =>
    p.costBreakdown?.estimatedMonthlyCost ||
    (p as any).cost?.estimatedMonthlyCost ||
    p.rent + 3000;

  const getMoveInCost = (p: ComparedProperty) =>
    p.costBreakdown?.initialMoveInCost ||
    (p as any).cost?.initialMoveInCost ||
    p.deposit + p.rent;

  // Dynamic calculations for Top Summary & Key Difference
  const summaryMetrics = useMemo(() => {
    if (properties.length === 0) return null;

    const lowestMonthlyProp = properties.reduce(
      (min, p) => (getMonthlyCost(p) < getMonthlyCost(min) ? p : min),
      properties[0]
    );

    const lowestMoveInProp = properties.reduce(
      (min, p) => (getMoveInCost(p) < getMoveInCost(min) ? p : min),
      properties[0]
    );

    const overBudgetCount = properties.filter(
      (p) => getMonthlyCost(p) > budgetThreshold
    ).length;

    // Sort by monthly cost for difference analysis
    const sorted = [...properties].sort(
      (a, b) => getMonthlyCost(a) - getMonthlyCost(b)
    );
    const cheapest = sorted[0];
    const mostExpensive = sorted[sorted.length - 1];
    const monthlyDiff = getMonthlyCost(mostExpensive) - getMonthlyCost(cheapest);

    const diffHeadline =
      monthlyDiff > 0
        ? `${money(monthlyDiff)}/month cheaper`
        : 'Identical monthly cost';

    // 1-2 sentence difference explanation
    let diffSentence = '';
    if (tradeoffs.length > 0 && (tradeoffs[0].tradeoff || tradeoffs[0].statement)) {
      diffSentence = tradeoffs[0].tradeoff || tradeoffs[0].statement || '';
    } else if (monthlyDiff > 0) {
      diffSentence = `${cheapest.title} has a lower monthly cost, while ${mostExpensive.title} provides more space and alternative amenities.`;
    } else {
      diffSentence = `${cheapest.title} and ${mostExpensive.title} have equivalent overall financial footprints.`;
    }

    return {
      lowestMonthlyCost: getMonthlyCost(lowestMonthlyProp),
      lowestMonthlyProp,
      lowestMoveInCost: getMoveInCost(lowestMoveInProp),
      lowestMoveInProp,
      overBudgetCount,
      diffHeadline,
      diffSentence,
    };
  }, [properties, tradeoffs]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        <p className="mt-3 text-xs text-gray-500">Evaluating your shortlist...</p>
      </div>
    );
  }

  if (properties.length < 2) {
    return (
      <Card className="p-12 text-center">
        <p className="font-semibold text-gray-900 dark:text-white">
          Please select at least 2 properties to compare
        </p>
        <Link
          href="/discover"
          className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          Go to discovery →
        </Link>
      </Card>
    );
  }

  // Rows for optional detailed comparison table
  const detailedRows = [
    { label: 'Base rent', values: properties.map((p) => `${money(p.rent)} / mo`) },
    {
      label: 'True monthly cost',
      values: properties.map((p) => money(getMonthlyCost(p))),
    },
    {
      label: 'Move-in cash required',
      values: properties.map((p) => money(getMoveInCost(p))),
    },
    { label: 'Security deposit', values: properties.map((p) => money(p.deposit)) },
    { label: 'Commute indicator', values: properties.map((p) => p.commute ?? '—') },
    { label: 'Furnishing status', values: properties.map((p) => p.furnishing) },
    { label: 'Bedrooms', values: properties.map((p) => `${p.bedrooms} BHK`) },
    {
      label: 'Key Amenities',
      values: properties.map((p) =>
        Array.isArray(p.amenities) ? p.amenities.slice(0, 4).join(', ') : '—'
      ),
    },
  ];

  return (
    <div className="max-w-5xl space-y-8 pb-12">
      {/* 1. Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Compare your shortlist
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          See the differences that matter to your decision.
        </p>
      </div>

      {/* 2. Top Summary (3 compact metrics) */}
      {summaryMetrics && (
        <div className="grid gap-3.5 sm:grid-cols-3">
          {/* Lowest monthly */}
          <div className="rounded-xl border border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Lowest true monthly cost
            </p>
            <p className="mt-1 text-xl font-bold text-tabular text-gray-900 dark:text-white">
              {money(summaryMetrics.lowestMonthlyCost)}
            </p>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 truncate">
              {summaryMetrics.lowestMonthlyProp.title}
            </p>
          </div>

          {/* Lowest move-in */}
          <div className="rounded-xl border border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Lowest move-in cost
            </p>
            <p className="mt-1 text-xl font-bold text-tabular text-gray-900 dark:text-white">
              {money(summaryMetrics.lowestMoveInCost)}
            </p>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 truncate">
              {summaryMetrics.lowestMoveInProp.title}
            </p>
          </div>

          {/* Budget status */}
          <div className="rounded-xl border border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Budget status
            </p>
            <p className="mt-1 text-xl font-bold text-tabular">
              {summaryMetrics.overBudgetCount === 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400">All in budget</span>
              ) : summaryMetrics.overBudgetCount === properties.length ? (
                <span className="text-amber-600 dark:text-amber-400">Over budget</span>
              ) : (
                <span className="text-gray-900 dark:text-white">
                  {properties.length - summaryMetrics.overBudgetCount} of {properties.length} in budget
                </span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              {summaryMetrics.overBudgetCount === 0
                ? `Within ₹${budgetThreshold / 1000}K budget`
                : `${summaryMetrics.overBudgetCount} exceeds ₹${budgetThreshold / 1000}K monthly`}
            </p>
          </div>
        </div>
      )}

      {/* 3. Property Cards (2-3 clean side-by-side cards) */}
      <div className={`grid gap-5 md:grid-cols-${Math.min(properties.length, 3)}`}>
        {properties.map((p) => {
          const monthly = getMonthlyCost(p);
          const isUnderBudget = monthly <= budgetThreshold;

          return (
            <div
              key={p.id}
              className="flex flex-col justify-between rounded-2xl border border-gray-200/80 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
            >
              <div>
                {/* Property Name & Location */}
                <h2 className="text-base font-bold text-gray-900 dark:text-white line-clamp-1">
                  {p.title}
                </h2>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {p.location}
                </p>

                {/* True Monthly Cost */}
                <div className="mt-6">
                  <p className="text-2xl font-bold tracking-tight text-tabular text-gray-900 dark:text-white">
                    {money(monthly)}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    estimated / month
                  </p>
                </div>

                {/* Base Rent */}
                <p className="mt-3 text-sm text-tabular text-gray-600 dark:text-gray-300">
                  {money(p.rent)} rent
                </p>

                {/* Key Attributes */}
                <p className="mt-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                  {p.bedrooms} BHK · {p.furnishing}
                </p>

                {/* Simple Budget Indicator */}
                <div className="mt-3">
                  {isUnderBudget ? (
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      ✓ Within ₹{budgetThreshold / 1000}K budget
                    </p>
                  ) : (
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                      ⚠ Over ₹{budgetThreshold / 1000}K budget (+{money(monthly - budgetThreshold)})
                    </p>
                  )}
                </div>
              </div>

              {/* View Property Link */}
              <div className="mt-6 border-t border-gray-100 pt-4 dark:border-gray-800">
                <Link
                  href={`/properties/${p.id}`}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  View property →
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Key Difference (1 concise section, 1-2 sentences maximum) */}
      {summaryMetrics && (
        <div className="rounded-xl border border-gray-200/80 bg-gray-50/50 p-5 dark:border-gray-800 dark:bg-gray-900/50">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            What&apos;s different?
          </p>
          <p className="mt-1 text-base font-bold text-gray-900 dark:text-white">
            {summaryMetrics.diffHeadline}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
            {summaryMetrics.diffSentence}
          </p>
        </div>
      )}

      {/* 5. Optional Details (Accordion / Collapsible) */}
      <div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          {showDetails ? 'Hide detailed comparison ↑' : 'View detailed comparison →'}
        </button>

        {showDetails && (
          <div className="mt-4 overflow-hidden rounded-xl border border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="overflow-x-auto">
              <table className="min-w-[500px] w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/40">
                    <th className="px-4 py-3 font-semibold text-gray-500 dark:text-gray-400">
                      Factor
                    </th>
                    {properties.map((p) => (
                      <th key={p.id} className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                        {p.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {detailedRows.map((row, idx) => (
                    <tr
                      key={row.label}
                      className={idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/30 dark:bg-gray-800/20'}
                    >
                      <td className="px-4 py-2.5 font-medium text-gray-500 dark:text-gray-400">
                        {row.label}
                      </td>
                      {row.values.map((v, i) => (
                        <td key={i} className="px-4 py-2.5 text-tabular text-gray-900 dark:text-gray-100">
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-xs text-gray-500">Loading comparison...</div>}>
      <CompareContent />
    </Suspense>
  );
}
