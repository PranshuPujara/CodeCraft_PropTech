'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { demoProperties } from '@/lib/demo-data';

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
  const [properties, setProperties] = useState<ComparedProperty[]>([]);
  const [tradeoffs, setTradeoffs] = useState<TradeOff[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadComparison() {
      setIsLoading(true);
      try {
        let propertyIds: string[] = [];
        const idsParam = searchParams.get('ids');

        if (idsParam) {
          propertyIds = idsParam.split(',').map((s) => s.trim()).filter(Boolean);
        } else {
          // Fetch shortlisted/saved properties first
          const savedRes = await fetch('/api/saved');
          if (savedRes.ok) {
            const savedData = await savedRes.json();
            const shortlisted = savedData.savedProperties?.filter((s: any) => s.isShortlisted);
            if (shortlisted && shortlisted.length >= 2) {
              propertyIds = shortlisted.map((s: any) => s.propertyId);
            } else if (savedData.savedProperties?.length >= 2) {
              propertyIds = savedData.savedProperties.slice(0, 2).map((s: any) => s.propertyId);
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
            body: JSON.stringify({ propertyIds, budget: 35000 }),
          });

          if (compareRes.ok) {
            const compareData = await compareRes.json();
            if (compareData.properties && compareData.properties.length >= 2) {
              setProperties(compareData.properties);
              setTradeoffs(compareData.tradeoffs || []);
              setSummary(compareData.summary || null);
              setIsLoading(false);
              return;
            }
          }
        }

        // Fallback to demo properties with realistic tradeoffs
        const fallbackProps = demoProperties.slice(0, 2);
        setProperties(fallbackProps as any);
        setTradeoffs([
          {
            dimension: 'Rent',
            tradeoff: `${fallbackProps[1].title} is ₹4,000/month cheaper in base rent than ${fallbackProps[0].title}.`,
            statement: `${fallbackProps[1].title} is ₹4,000/month cheaper in base rent than ${fallbackProps[0].title}.`,
          },
          {
            dimension: 'Furnishing',
            tradeoff: `${fallbackProps[0].title} is Fully Furnished, whereas ${fallbackProps[1].title} is Semi-Furnished.`,
            statement: `${fallbackProps[0].title} is Fully Furnished, whereas ${fallbackProps[1].title} is Semi-Furnished.`,
          },
        ]);
        setSummary('Side-by-side trade-off analysis comparing monthly rent savings against furnishing preferences.');
      } catch (e) {
        console.error('Error loading comparison:', e);
        setProperties(demoProperties.slice(0, 2) as any);
      } finally {
        setIsLoading(false);
      }
    }

    loadComparison();
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <p className="mt-4 text-sm text-gray-500">Evaluating side-by-side trade-offs...</p>
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
          className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Go to discovery →
        </Link>
      </Card>
    );
  }

  const rows = [
    { label: 'Base rent', values: properties.map((p) => `${money(p.rent)} / mo`) },
    {
      label: 'True monthly cost',
      values: properties.map(
        (p) =>
          `≈ ${money(
            p.costBreakdown?.estimatedMonthlyCost ||
              (p as any).cost?.estimatedMonthlyCost ||
              p.rent + 3000
          )}`
      ),
    },
    {
      label: 'Move-in cash required',
      values: properties.map((p) =>
        money(
          p.costBreakdown?.initialMoveInCost ||
            (p as any).cost?.initialMoveInCost ||
            p.deposit + p.rent
        )
      ),
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
    {
      label: 'Budget signal',
      values: properties.map(
        (p) =>
          p.costBreakdown?.affordability?.formattedSignal ||
          (p as any).cost?.affordability?.formattedSignal ||
          'Calculated against ₹35k'
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Property comparison
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          See the trade-offs, not just the columns.
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Comparing {properties.length} options against your ₹35,000 monthly budget.
        </p>
      </div>

      {/* Comparison table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[640px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Decision factor
                </th>
                {properties.map((p) => (
                  <th key={p.id} className="px-5 py-4">
                    <Link
                      href={`/properties/${p.id}`}
                      className="font-bold text-gray-900 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400"
                    >
                      {p.title}
                    </Link>
                    <p className="mt-0.5 text-xs font-normal text-gray-500 dark:text-gray-400">
                      {p.location}
                    </p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((row, idx) => (
                <tr
                  key={row.label}
                  className={idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/20'}
                >
                  <td className="px-5 py-3.5 font-medium text-gray-700 dark:text-gray-300">
                    {row.label}
                  </td>
                  {row.values.map((v, i) => (
                    <td key={i} className="px-5 py-3.5 text-gray-900 dark:text-gray-100">
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* AI Trade-offs from Backend */}
      {tradeoffs.length > 0 && (
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Structured Trade-off Insights
            </h2>
            {summary && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {summary}
              </p>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {tradeoffs.map((t, idx) => {
              const text = t.tradeoff || t.statement || '';
              return (
                <Card key={idx} className="p-4 border-l-4 border-l-emerald-500">
                  <div className="flex items-center justify-between">
                    <Badge tone="blue">{t.dimension}</Badge>
                    <span className="text-[11px] text-gray-400">Pairwise Trade-off</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-gray-700 dark:text-gray-300">
                    {text}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Action links */}
      <div className="flex gap-3">
        <Link
          href="/assistant"
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          View Decision Assistant narrative →
        </Link>
        <Link
          href="/copilot"
          className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        >
          Ask AI Copilot about trade-offs
        </Link>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm text-gray-500">Loading comparison...</div>}>
      <CompareContent />
    </Suspense>
  );
}
