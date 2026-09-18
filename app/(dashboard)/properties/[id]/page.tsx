'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { demoProperties } from '@/lib/demo-data';
import { HomeIcon } from '@/components/icons';

const money = (v: number) => `₹${new Intl.NumberFormat('en-IN').format(v)}`;

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  const property = demoProperties.find((p) => p.id === params.id);

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

  const monthlyItems = [
    property.cost.rent,
    property.cost.maintenance,
    property.cost.electricity,
    property.cost.water,
    property.cost.internet,
    property.cost.transport,
    property.cost.otherRecurring,
  ];
  const moveInItems = [
    property.cost.deposit,
    property.cost.brokerage,
    property.cost.firstMonthRent,
  ];

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
          <div className="flex h-48 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 sm:h-64">
            <HomeIcon className="h-16 w-16 text-gray-300 dark:text-gray-600" />
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
              <button className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                ♡ Save property
              </button>
            </div>

            {/* Badges */}
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge tone="blue">{property.bedrooms} bedrooms</Badge>
              <Badge tone="blue">{property.bathrooms ?? 1} bathrooms</Badge>
              <Badge tone="blue">{property.furnishing}</Badge>
              {property.amenities.map((a) => (
                <Badge key={a}>{a}</Badge>
              ))}
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
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {' '}/ month
              </span>
            </p>
          </Card>

          {/* True monthly cost */}
          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  True monthly cost
                </h2>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Recurring costs, itemised
                </p>
              </div>
              <Badge tone="blue">Estimated</Badge>
            </div>
            <dl className="mt-5 space-y-3">
              {monthlyItems.map((item) => (
                <div className="flex justify-between text-sm" key={item.label}>
                  <dt className="text-gray-600 dark:text-gray-400">
                    {item.label}
                    {item.isEstimated && (
                      <span className="ml-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                        est.
                      </span>
                    )}
                  </dt>
                  <dd className="font-medium text-gray-800 dark:text-gray-200">
                    {money(item.value)}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 border-t border-gray-200 pt-4 dark:border-gray-700">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">
                  Estimated monthly total
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {money(property.cost.estimatedMonthlyCost)}
                </span>
              </div>
              <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800">
                <p className="text-xs leading-5 text-gray-600 dark:text-gray-400">
                  <Badge
                    tone={
                      property.cost.affordability.status === 'affordable'
                        ? 'green'
                        : property.cost.affordability.status === 'stretch'
                        ? 'amber'
                        : 'red'
                    }
                    className="mr-2"
                  >
                    {property.cost.affordability.formattedSignal}
                  </Badge>
                  {property.cost.affordability.explanation}
                </p>
              </div>
            </div>
          </Card>

          {/* Move-in cost */}
          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Initial move-in cost
                </h2>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  One-time payments to plan for
                </p>
              </div>
              <Badge>Exact values</Badge>
            </div>
            <dl className="mt-5 space-y-3">
              {moveInItems.map((item) => (
                <div className="flex justify-between text-sm" key={item.label}>
                  <dt className="text-gray-600 dark:text-gray-400">{item.label}</dt>
                  <dd className="font-medium text-gray-800 dark:text-gray-200">
                    {money(item.value)}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 flex justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
              <span className="font-semibold text-gray-900 dark:text-white">
                Total to move in
              </span>
              <span className="font-bold text-gray-900 dark:text-white">
                {money(property.cost.initialMoveInCost)}
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
