'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { demoProperties } from '@/lib/demo-data';
import { HomeIcon, StarIcon, SparklesIcon } from '@/components/icons';

const money = (v: number) => `₹${new Intl.NumberFormat('en-IN').format(v)}`;

const recommendationReasons: Record<string, string> = {
  'indiranagar-2bhk':
    'Matches your 2 BHK preference in Bangalore. Monthly cost is ≈₹40,500 which is within your budget. Semi-furnished with parking and balcony — both listed as preferred amenities.',
  'koramangala-loft':
    'Closest to your commute point at 9 min. Fully furnished with fibre internet and workstations, ideal for remote work. Higher monthly cost but strong amenity match.',
  'jayanagar-2bhk':
    'Lowest monthly estimate at ≈₹36,400. Near Jayanagar Metro for commute flexibility. Semi-furnished — matches your preference. Budget-friendly option with solid fundamentals.',
  'hsr-studio':
    'Most affordable at ≈₹27,200/month. Furnished 1 BHK ideal if living solo. Short commute at 18 min. Well under your stated budget at ~78%.',
};

export default function RecommendationsPage() {
  const [showResults, setShowResults] = useState(false);
  const [budget, setBudget] = useState('35000');
  const [bedroomPref, setBedroomPref] = useState('2');
  const [furnishingPref, setFurnishingPref] = useState('Any');

  const ranked = [...demoProperties].sort(
    (a, b) => a.cost.estimatedMonthlyCost - b.cost.estimatedMonthlyCost
  );

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
          Each recommendation explains why it was selected — not just {"\""}great match!{"\""}.
        </p>
      </div>

      {/* Preference inputs */}
      <Card className="p-5 sm:p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          Your preferences
        </h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Tell us what matters to you.
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
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Bedrooms
            </label>
            <select
              value={bedroomPref}
              onChange={(e) => setBedroomPref(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="Any">Any</option>
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
              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option>Any</option>
              <option>Furnished</option>
              <option>Semi-Furnished</option>
              <option>Unfurnished</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Location
            </label>
            <input
              defaultValue="Bangalore"
              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>
        </div>
        <button
          onClick={() => setShowResults(true)}
          className="mt-5 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <SparklesIcon className="mr-2 inline h-4 w-4" />
          Get recommendations
        </button>
      </Card>

      {/* Results */}
      {showResults && (
        <div className="space-y-4 animate-slide-up">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {ranked.length} properties ranked by fit. Each includes a specific
            explanation.
          </p>
          {ranked.map((property, index) => (
            <Card key={property.id} className="flex flex-col gap-4 p-5 sm:flex-row">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                {index === 0 ? (
                  <StarIcon className="h-6 w-6 text-amber-500" />
                ) : (
                  <HomeIcon className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 dark:text-gray-500">
                        #{index + 1}
                      </span>
                      <Link
                        href={`/properties/${property.id}`}
                        className="font-semibold text-gray-900 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400"
                      >
                        {property.title}
                      </Link>
                      {index === 0 && (
                        <Badge tone="green">Top match</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {property.location}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      ≈ {money(property.cost.estimatedMonthlyCost)}
                      <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                        {' '}/mo
                      </span>
                    </p>
                    <Badge
                      tone={
                        property.cost.affordability.status === 'affordable'
                          ? 'green'
                          : 'amber'
                      }
                      className="mt-1"
                    >
                      {property.cost.affordability.formattedSignal}
                    </Badge>
                  </div>
                </div>

                {/* WHY this matches */}
                <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/50 px-4 py-3 dark:border-emerald-800/30 dark:bg-emerald-900/10">
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    Why this matches
                  </p>
                  <p className="mt-1 text-sm leading-5 text-emerald-700 dark:text-emerald-200">
                    {recommendationReasons[property.id]}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
