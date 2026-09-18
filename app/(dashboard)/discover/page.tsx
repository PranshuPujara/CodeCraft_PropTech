'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { demoProperties, demoSaved } from '@/lib/demo-data';
import { HomeIcon, HeartIcon, HeartOutlineIcon, FilterIcon, SearchIcon } from '@/components/icons';

const money = (v: number) => `₹${new Intl.NumberFormat('en-IN').format(v)}`;

export default function DiscoverPage() {
  const [query, setQuery] = useState('');
  const [bedrooms, setBedrooms] = useState('Any');
  const [furnishing, setFurnishing] = useState('Any');
  const [savedIds, setSavedIds] = useState(demoSaved.map((s) => s.property.id));
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const properties = useMemo(
    () =>
      demoProperties.filter(
        (p) =>
          (p.title + p.location).toLowerCase().includes(query.toLowerCase()) &&
          (bedrooms === 'Any' || String(p.bedrooms) === bedrooms) &&
          (furnishing === 'Any' || p.furnishing === furnishing)
      ),
    [query, bedrooms, furnishing]
  );

  const toggleSave = (id: string) =>
    setSavedIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
  const toggleCompare = (id: string) =>
    setCompareIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Property discovery
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Find options you can actually evaluate.
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Every listing includes its estimated monthly total and move-in cost.
        </p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_140px_160px_140px]">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none placeholder:text-gray-400 focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:border-emerald-600"
              placeholder="Search location or property"
            />
          </div>
          <select
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <option>Any</option>
            <option value="1">1 BHK</option>
            <option value="2">2 BHK</option>
            <option value="3">3 BHK</option>
          </select>
          <select
            value={furnishing}
            onChange={(e) => setFurnishing(e.target.value)}
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <option>Any</option>
            <option>Furnished</option>
            <option>Semi-Furnished</option>
            <option>Unfurnished</option>
          </select>
          <button className="flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5">
            <FilterIcon className="h-4 w-4" /> Filters
          </button>
        </div>
      </Card>

      {/* Results count */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {properties.length} {properties.length === 1 ? 'option' : 'options'} shown
        · all ongoing costs are estimates unless labelled otherwise.
      </p>

      {/* Property grid */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {properties.map((property) => {
          const isSaved = savedIds.includes(property.id);
          const isCompare = compareIds.includes(property.id);
          return (
            <Card key={property.id} className="flex flex-col overflow-hidden">
              {/* Image area */}
              <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-750">
                <HomeIcon className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                <button
                  onClick={() => toggleSave(property.id)}
                  className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full transition ${
                    isSaved
                      ? 'bg-rose-50 text-rose-500 dark:bg-rose-900/30 dark:text-rose-400'
                      : 'bg-white/80 text-gray-400 hover:text-rose-500 dark:bg-gray-800/80'
                  }`}
                >
                  {isSaved ? (
                    <HeartIcon className="h-4 w-4" />
                  ) : (
                    <HeartOutlineIcon className="h-4 w-4" />
                  )}
                </button>
                <div className="absolute bottom-3 left-3">
                  <Badge tone="neutral">{property.furnishing}</Badge>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-4">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {property.location}
                </p>
                <h3 className="mt-1 text-sm font-semibold leading-5 text-gray-900 dark:text-white">
                  {property.title}
                </h3>

                {/* Price + affordability */}
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {money(property.rent)}
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {' '}/ mo
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      ≈ {money(property.cost.estimatedMonthlyCost)} total{' '}
                      <span className="text-gray-400 dark:text-gray-500">
                        estimated
                      </span>
                    </p>
                  </div>
                  <Badge
                    tone={
                      property.cost.affordability.status === 'affordable'
                        ? 'green'
                        : property.cost.affordability.status === 'stretch'
                        ? 'amber'
                        : 'red'
                    }
                  >
                    {property.cost.affordability.formattedSignal}
                  </Badge>
                </div>

                {/* Amenities */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {property.amenities.slice(0, 4).map((a) => (
                    <span
                      key={a}
                      className="rounded-md bg-gray-50 px-2 py-0.5 text-[11px] text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    >
                      {a}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4 dark:border-gray-700">
                  <button
                    onClick={() => toggleCompare(property.id)}
                    className={`flex-1 rounded-lg border py-2 text-xs font-medium transition ${
                      isCompare
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5'
                    }`}
                  >
                    {isCompare ? '✓ Comparing' : 'Add to compare'}
                  </button>
                  <Link
                    href={`/properties/${property.id}`}
                    className="flex-1 rounded-lg bg-gray-900 py-2 text-center text-xs font-medium text-white transition hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                  >
                    View details
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Compare sticky bar */}
      {compareIds.length > 0 && (
        <div className="sticky bottom-4 flex items-center justify-between rounded-xl bg-gray-900 px-5 py-3 text-sm text-white shadow-xl dark:bg-gray-800">
          <span>
            {compareIds.length} {compareIds.length === 1 ? 'property' : 'properties'}{' '}
            selected
            {compareIds.length < 2 && (
              <span className="ml-2 text-gray-400">Choose at least 2 to compare.</span>
            )}
          </span>
          {compareIds.length >= 2 && (
            <Link
              href="/compare"
              className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white"
            >
              Compare now →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
