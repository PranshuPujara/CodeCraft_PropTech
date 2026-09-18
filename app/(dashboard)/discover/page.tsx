'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { demoProperties } from '@/lib/demo-data';
import { HomeIcon, BookmarkIcon, BookmarkOutlineIcon, FilterIcon, SearchIcon } from '@/components/icons';

const money = (v: number) => `₹${new Intl.NumberFormat('en-IN').format(v)}`;

interface PropertyItem {
  id: string;
  title: string;
  location: string;
  rent: number;
  deposit: number;
  brokerage: number;
  furnishing: string;
  bedrooms: number;
  bathrooms?: number;
  commute?: string;
  amenities: string[];
  description?: string;
  costBreakdown?: {
    estimatedMonthlyCost: number;
    initialMoveInCost: number;
    maintenance: number;
    electricity: number;
    water: number;
    internet: number;
    transport: number;
    otherRecurring: number;
  };
}

export default function DiscoverPage() {
  const [query, setQuery] = useState('');
  const [bedrooms, setBedrooms] = useState('Any');
  const [furnishing, setFurnishing] = useState('Any');
  const [properties, setProperties] = useState<PropertyItem[]>(demoProperties);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch properties from backend API
  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('keyword', query.trim());
      if (bedrooms !== 'Any') params.set('bedrooms', bedrooms);
      if (furnishing !== 'Any') params.set('furnishing', furnishing);

      const res = await fetch(`/api/properties?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.properties) && data.properties.length > 0) {
          setProperties(data.properties);
        } else {
          // If search yielded 0 or filtered out
          setProperties([]);
        }
      }
    } catch {
      // Fallback to client filtered demo properties if network error
      setProperties(
        demoProperties.filter(
          (p) =>
            (p.title + p.location).toLowerCase().includes(query.toLowerCase()) &&
            (bedrooms === 'Any' || String(p.bedrooms) === bedrooms) &&
            (furnishing === 'Any' || p.furnishing === furnishing)
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [query, bedrooms, furnishing]);

  // Fetch saved property IDs from backend
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
      // Keep initial
    }
  }, []);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProperties();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchProperties]);

  const toggleSave = async (id: string) => {
    const isCurrentlySaved = savedIds.includes(id);
    // Optimistic UI update
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
          body: JSON.stringify({ propertyId: id, isShortlisted: false }),
        });
      }
    } catch (e) {
      console.error('Error toggling saved state:', e);
      // Revert if error
      setSavedIds((prev) =>
        isCurrentlySaved ? [...prev, id] : prev.filter((i) => i !== id)
      );
    }
  };

  const toggleCompare = (id: string) =>
    setCompareIds((ids) =>
      ids.includes(id) ? ids.filter((i) => i !== id) : ids.length < 4 ? [...ids, id] : ids
    );

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
              type="text"
              maxLength={100}
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
            <option value="Any">All BHK</option>
            <option value="1">1 BHK</option>
            <option value="2">2 BHK</option>
            <option value="3">3 BHK</option>
          </select>
          <select
            value={furnishing}
            onChange={(e) => setFurnishing(e.target.value)}
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="Any">All Furnishing</option>
            <option value="Furnished">Furnished</option>
            <option value="Semi-Furnished">Semi-Furnished</option>
            <option value="Unfurnished">Unfurnished</option>
          </select>
          <div className="flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 dark:border-gray-700 dark:text-gray-400">
            <FilterIcon className="h-4 w-4" /> Live DB
          </div>
        </div>
      </Card>

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <p>
          {isLoading ? 'Searching database...' : `${properties.length} options found in database`}
          {' · '}all recurring costs calculated by backend cost engine.
        </p>
      </div>

      {/* Property grid */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {properties.map((property) => {
          const isSaved = savedIds.includes(property.id);
          const isCompare = compareIds.includes(property.id);
          const monthlyEst =
            property.costBreakdown?.estimatedMonthlyCost ||
            (property as any).cost?.estimatedMonthlyCost ||
            property.rent + 4000;
          const moveInEst =
            property.costBreakdown?.initialMoveInCost ||
            (property as any).cost?.initialMoveInCost ||
            property.deposit + property.brokerage + property.rent;

          return (
            <Card key={property.id} className="flex flex-col overflow-hidden transition hover:shadow-md dark:border-gray-800">
              {/* Photo Area */}
              <div className="relative flex h-48 items-center justify-center bg-gradient-to-br from-gray-100 via-slate-100 to-gray-200 dark:from-gray-800/80 dark:via-gray-800 dark:to-gray-900">
                <HomeIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 transition hover:scale-105" />
                
                {/* Wishlist / Bookmark Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleSave(property.id);
                  }}
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-sm backdrop-blur-sm transition hover:scale-110 hover:text-emerald-600 dark:bg-gray-900/90 dark:text-gray-300"
                  title={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
                  aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
                  aria-pressed={isSaved}
                >
                  {isSaved ? (
                    <BookmarkIcon className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <BookmarkOutlineIcon className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-4">
                {/* Title */}
                <h3 className="font-bold text-gray-900 line-clamp-2 dark:text-white">
                  {property.title}
                </h3>
                
                {/* Location */}
                <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                  {property.location}
                </p>

                {/* Financial Summary */}
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {money(property.rent)} <span className="text-xs font-normal text-gray-500 dark:text-gray-400">/ month rent</span>
                  </p>
                  {/* Preserved financial intelligence visually simplified */}
                  <div className="mt-1 flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
                    <span className="text-emerald-700 dark:text-emerald-400">True Monthly: ≈{money(monthlyEst)}</span>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <span>Move-in: {money(moveInEst)}</span>
                  </div>
                </div>

                {/* Badges and Amenities grouped together */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-medium border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50">
                    {property.furnishing}
                  </span>
                  <span className="rounded-md bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-medium border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50">
                    {property.bedrooms} BHK
                  </span>
                  {Array.isArray(property.amenities) && property.amenities.slice(0, 3).map((a) => (
                    <span
                      key={a}
                      className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    >
                      {a}
                    </span>
                  ))}
                  {Array.isArray(property.amenities) && property.amenities.length > 3 && (
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      +{property.amenities.length - 3}
                    </span>
                  )}
                </div>
                
                {/* Spacer to push footer to bottom */}
                <div className="flex-1"></div>

                {/* Footer */}
                <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
                  <button
                    onClick={() => toggleCompare(property.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                      isCompare
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
                    }`}
                    aria-label={isCompare ? 'Remove from comparison' : 'Add to compare'}
                  >
                    <span className="text-sm">{isCompare ? '✓' : '+'}</span>
                    {isCompare ? 'Added to Compare' : 'Add to Compare'}
                  </button>
                  <Link
                    href={`/properties/${property.id}`}
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Sticky comparison bar */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-2xl border border-gray-200 bg-white/95 px-5 py-3 shadow-xl backdrop-blur-md dark:border-gray-700 dark:bg-gray-900/95">
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-white">
                {compareIds.length}
              </strong>{' '}
              {compareIds.length === 1 ? 'property' : 'properties'} selected
            </span>
            {compareIds.length >= 2 ? (
              <Link
                href={`/compare?ids=${compareIds.join(',')}`}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                Compare side-by-side →
              </Link>
            ) : (
              <span className="text-xs text-gray-400">Select at least 2</span>
            )}
            <button
              onClick={() => setCompareIds([])}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
