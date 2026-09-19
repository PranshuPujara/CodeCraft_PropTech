'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { demoProperties } from '@/lib/demo-data';
import { getPropertyImage } from '@/lib/property-images';
import { HeartIcon, HeartOutlineIcon } from '@/components/icons';

const money = (v: number) => `₹${new Intl.NumberFormat('en-IN').format(v)}`;

interface CostItem {
  value: number;
  isEstimated: boolean;
  label: string;
}

interface CostResponse {
  propertyId: string;
  rent: CostItem;
  maintenance: CostItem;
  electricity: CostItem;
  water: CostItem;
  internet: CostItem;
  transport: CostItem;
  otherRecurring: CostItem;
  estimatedMonthlyCost: number;
  deposit: CostItem;
  brokerage: CostItem;
  firstMonthRent: CostItem;
  initialMoveInCost: number;
  isAnyEstimated: boolean;
  affordability: {
    ratio: number;
    percentage: number;
    formattedSignal: string;
    status: 'comfortable' | 'moderate' | 'stretch' | 'over_budget';
    explanation: string;
  };
}

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  const [property, setProperty] = useState<any>(null);
  const [cost, setCost] = useState<CostResponse | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // 1. Fetch Property Details
        const propRes = await fetch(`/api/properties/${params.id}`);
        if (propRes.ok) {
          const propData = await propRes.json();
          setProperty(propData.property);
        } else {
          // Fallback to demo properties
          const fallback = demoProperties.find((p) => p.id === params.id) || demoProperties[0];
          setProperty(fallback);
        }

        // 2. Fetch True Cost from Backend Cost Engine
        const costRes = await fetch(`/api/properties/${params.id}/cost?budget=35000`);
        if (costRes.ok) {
          const costData = await costRes.json();
          setCost(costData);
        } else {
          const fallback = demoProperties.find((p) => p.id === params.id) || demoProperties[0];
          setCost(fallback.cost as any);
        }

        // 3. Check saved state
        const savedRes = await fetch('/api/saved');
        if (savedRes.ok) {
          const savedData = await savedRes.json();
          if (Array.isArray(savedData.savedProperties)) {
            setIsSaved(savedData.savedProperties.some((s: any) => s.propertyId === params.id));
          }
        }
      } catch (err) {
        console.error('Failed to load property data:', err);
        const fallback = demoProperties.find((p) => p.id === params.id) || demoProperties[0];
        setProperty(fallback);
        setCost(fallback.cost as any);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [params.id]);

  const toggleSave = async () => {
    if (!property) return;
    const nextState = !isSaved;
    setIsSaved(nextState);
    try {
      if (!nextState) {
        await fetch(`/api/saved?propertyId=${property.id}`, { method: 'DELETE' });
      } else {
        await fetch('/api/saved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ propertyId: property.id, isShortlisted: false }),
        });
      }
    } catch {
      setIsSaved(!nextState);
    }
  };

  if (isLoading && !property) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <p className="mt-4 text-sm text-gray-500">Loading property intelligence...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-semibold text-gray-900 dark:text-white">Property not found</p>
        <Link href="/discover" className="mt-4 text-sm text-emerald-600">
          ← Back to discovery
        </Link>
      </div>
    );
  }

  const monthlyItems = cost
    ? [
        cost.rent,
        cost.maintenance,
        cost.electricity,
        cost.water,
        cost.internet,
        cost.transport,
        cost.otherRecurring,
      ]
    : [];

  const moveInItems = cost
    ? [cost.deposit, cost.brokerage, cost.firstMonthRent]
    : [];

  return (
    <div className="space-y-6">
      <Link
        href="/discover"
        className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
      >
        ← Back to discovery
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Left — property info */}
        <div>
          {/* Hero image area */}
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-gray-100 shadow-sm dark:bg-gray-800">
            <img
              src={(property as any).image || getPropertyImage(property).url}
              alt={property.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <span className="rounded-md bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md border border-white/10 shadow-sm">
                {property.bedrooms} BHK
              </span>
              <span className="rounded-md bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md border border-white/10 shadow-sm">
                {property.furnishing}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="mt-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {property.location}
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                  {property.title}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-400">
                  {property.description}
                </p>
              </div>
              <button
                onClick={toggleSave}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {isSaved ? (
                  <>
                    <HeartIcon className="h-4 w-4 text-rose-500" /> Saved
                  </>
                ) : (
                  <>
                    <HeartOutlineIcon className="h-4 w-4" /> Save property
                  </>
                )}
              </button>
            </div>

            {/* Badges */}
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge tone="blue">{property.bedrooms} BHK</Badge>
              <Badge tone="blue">{property.furnishing}</Badge>
              {Array.isArray(property.amenities) &&
                property.amenities.map((a: string) => <Badge key={a}>{a}</Badge>)}
            </div>

            {/* Commute info */}
            {property.commute && (
              <div className="mt-5 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                🚗 {property.commute}
              </div>
            )}
          </div>
        </div>

        {/* Right — cost intelligence */}
        <div className="space-y-5">
          {/* Rent headline */}
          <Card className="p-5">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Advertised monthly rent
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {money(property.rent)}
              <span className="text-base font-normal text-gray-500 dark:text-gray-400">
                {' '}
                / month
              </span>
            </p>
          </Card>

          {/* True monthly cost */}
          {cost && (
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    Estimated true monthly cost
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    What you will actually spend each month
                  </p>
                </div>
                <Badge tone="blue">≈ {money(cost.estimatedMonthlyCost)}</Badge>
              </div>

              <div className="mt-4 space-y-2.5 border-t border-gray-100 pt-4 dark:border-gray-800">
                {monthlyItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      {item.label}
                      {item.isEstimated && (
                        <span
                          className="ml-1 text-[11px] text-amber-600 dark:text-amber-400"
                          title="Estimated consumption figure"
                        >
                          (est.)
                        </span>
                      )}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {money(item.value)}
                    </span>
                  </div>
                ))}

                <div className="flex items-center justify-between border-t border-gray-200 pt-3 text-sm font-bold text-gray-900 dark:border-gray-700 dark:text-white">
                  <span>Total monthly</span>
                  <span>≈ {money(cost.estimatedMonthlyCost)} / mo</span>
                </div>
              </div>
            </Card>
          )}

          {/* Move-in cost */}
          {cost && (
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    Initial move-in cost
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    Cash required before you get the keys
                  </p>
                </div>
                <Badge tone="amber">{money(cost.initialMoveInCost)}</Badge>
              </div>

              <div className="mt-4 space-y-2.5 border-t border-gray-100 pt-4 dark:border-gray-800">
                {moveInItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {money(item.value)}
                    </span>
                  </div>
                ))}

                <div className="flex items-center justify-between border-t border-gray-200 pt-3 text-sm font-bold text-gray-900 dark:border-gray-700 dark:text-white">
                  <span>Total move-in cash</span>
                  <span>{money(cost.initialMoveInCost)}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Affordability signal from backend engine */}
          {cost?.affordability && (
            <Card className="border-emerald-200 bg-emerald-50/40 p-5 dark:border-emerald-800/40 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Affordability Signal
                </span>
                <Badge tone={cost.affordability.status === 'comfortable' ? 'green' : 'amber'}>
                  {cost.affordability.formattedSignal}
                </Badge>
              </div>
              <p className="mt-2 text-xs leading-5 text-gray-600 dark:text-gray-400">
                {cost.affordability.explanation}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
