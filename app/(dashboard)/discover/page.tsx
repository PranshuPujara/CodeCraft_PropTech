'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { demoProperties } from '@/lib/demo-data';
import { getPropertyImage } from '@/lib/property-images';
import { BookmarkIcon, BookmarkOutlineIcon, FilterIcon, SearchIcon } from '@/components/icons';

const money = (v: number) => `₹${new Intl.NumberFormat('en-IN').format(v)}`;

const POPULAR_LOCATIONS = ['All', 'Indiranagar', 'Koramangala', 'HSR Layout', 'Whitefield', 'Jayanagar'];

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
  image?: string;
  imageAlt?: string;
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
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [bedrooms, setBedrooms] = useState('Any');
  const [furnishing, setFurnishing] = useState('Any');
  const [maxBudget, setMaxBudget] = useState('Any');
  const [sortBy, setSortBy] = useState('recommended');
  const [properties, setProperties] = useState<PropertyItem[]>(demoProperties);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check if any non-default filter is currently applied
  const hasActiveFilters = useMemo(() => {
    return (
      query.trim() !== '' ||
      selectedLocation !== 'All' ||
      bedrooms !== 'Any' ||
      furnishing !== 'Any' ||
      maxBudget !== 'Any' ||
      sortBy !== 'recommended'
    );
  }, [query, selectedLocation, bedrooms, furnishing, maxBudget, sortBy]);

  const resetAllFilters = () => {
    setQuery('');
    setSelectedLocation('All');
    setBedrooms('Any');
    setFurnishing('Any');
    setMaxBudget('Any');
    setSortBy('recommended');
  };

  // Fetch properties from backend API
  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('keyword', query.trim());
      if (selectedLocation !== 'All') params.set('location', selectedLocation);
      if (bedrooms !== 'Any') params.set('bedrooms', bedrooms);
      if (furnishing !== 'Any') params.set('furnishing', furnishing);
      if (maxBudget !== 'Any') params.set('budget', maxBudget);
      if (sortBy !== 'recommended') params.set('sortBy', sortBy);

      const res = await fetch(`/api/properties?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.properties)) {
          setProperties(data.properties);
        } else {
          setProperties([]);
        }
      }
    } catch {
      // Fallback to client filtered demo properties if network error
      const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
      const filtered = demoProperties.filter((p) => {
        const matchesTokens =
          tokens.length === 0 ||
          tokens.every(
            (t) =>
              p.title.toLowerCase().includes(t) ||
              p.location.toLowerCase().includes(t) ||
              p.furnishing.toLowerCase().includes(t) ||
              (p.description && p.description.toLowerCase().includes(t)) ||
              (Array.isArray(p.amenities) && p.amenities.some((a) => a.toLowerCase().includes(t)))
          );

        const matchesLocation =
          selectedLocation === 'All' ||
          p.location.toLowerCase().includes(selectedLocation.toLowerCase());
        const matchesBedrooms = bedrooms === 'Any' || String(p.bedrooms) === bedrooms;
        const matchesFurnishing = furnishing === 'Any' || p.furnishing === furnishing;
        const matchesBudget = maxBudget === 'Any' || p.rent <= Number(maxBudget);

        return matchesTokens && matchesLocation && matchesBedrooms && matchesFurnishing && matchesBudget;
      });

      if (sortBy === 'price-asc') {
        filtered.sort((a, b) => a.rent - b.rent);
      } else if (sortBy === 'price-desc') {
        filtered.sort((a, b) => b.rent - a.rent);
      }

      setProperties(filtered);
    } finally {
      setIsLoading(false);
    }
  }, [query, selectedLocation, bedrooms, furnishing, maxBudget, sortBy]);

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
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchProperties]);

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
          body: JSON.stringify({ propertyId: id, isShortlisted: false }),
        });
      }
    } catch (e) {
      console.error('Error toggling saved state:', e);
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
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Live Property Discovery
            </p>
          </div>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
            Find options you can actually evaluate.
          </h1>
          <p className="mt-1.5 text-[15px] leading-relaxed text-gray-500 dark:text-gray-400">
            Real photos, verified amenities, and true monthly cost breakdown for every listing.
          </p>
        </div>

        {hasActiveFilters && (
          <button
            onClick={resetAllFilters}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition"
          >
            <span>Reset all filters</span>
            <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-[10px]">✕</span>
          </button>
        )}
      </div>

      {/* Efficient Search & Filter Console */}
      <Card className="p-4 space-y-3.5 border-gray-200/80 shadow-sm dark:border-gray-800">
        {/* Top Search & Filter Dropdowns */}
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-12">
          {/* Main Search Bar */}
          <div className="relative sm:col-span-2 lg:col-span-4">
            <SearchIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              maxLength={100}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50/80 pl-10 pr-9 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-emerald-500"
              placeholder="Search 2BHK, gym, balcony, wifi..."
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                title="Clear search"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Bedrooms Filter */}
          <div className="lg:col-span-2">
            <select
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="Any">All BHK</option>
              <option value="1">1 BHK</option>
              <option value="2">2 BHK</option>
              <option value="3">3 BHK</option>
            </select>
          </div>

          {/* Furnishing Filter */}
          <div className="lg:col-span-2">
            <select
              value={furnishing}
              onChange={(e) => setFurnishing(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="Any">All Furnishing</option>
              <option value="Furnished">Furnished</option>
              <option value="Semi-Furnished">Semi-Furnished</option>
              <option value="Unfurnished">Unfurnished</option>
            </select>
          </div>

          {/* Max Budget Filter */}
          <div className="lg:col-span-2">
            <select
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="Any">All Budgets</option>
              <option value="25000">Under ₹25k</option>
              <option value="35000">Under ₹35k</option>
              <option value="50000">Under ₹50k</option>
            </select>
          </div>

          {/* Sort By Filter */}
          <div className="lg:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="recommended">Recommended</option>
              <option value="price-asc">Rent: Low to High</option>
              <option value="price-desc">Rent: High to Low</option>
            </select>
          </div>
        </div>

        {/* Quick Location Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 mr-1 flex items-center gap-1">
            <FilterIcon className="h-3 w-3" /> Quick Location:
          </span>
          {POPULAR_LOCATIONS.map((loc) => {
            const isSelected = selectedLocation === loc;
            return (
              <button
                key={loc}
                onClick={() => setSelectedLocation(loc)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {loc}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Results Header / Live Counter */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
        <p className="flex items-center gap-2">
          {isLoading ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              Searching verified listings...
            </span>
          ) : (
            <span>
              <strong className="font-semibold text-gray-900 dark:text-white">
                {properties.length}
              </strong>{' '}
              {properties.length === 1 ? 'property' : 'properties'} available
              {selectedLocation !== 'All' ? ` in ${selectedLocation}` : ''}
            </span>
          )}
        </p>
        <p className="hidden sm:block text-[11px] text-gray-400">
          Instant cost engine calculation included
        </p>
      </div>

      {/* Property Grid or Zero Results State */}
      {properties.length === 0 && !isLoading ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed dark:border-gray-800">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
            <SearchIcon className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-bold text-gray-900 dark:text-white">
            No properties match your search
          </h3>
          <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            We couldn&apos;t find any flats or houses matching your current criteria. Try expanding your location or clearing filters.
          </p>
          <button
            onClick={resetAllFilters}
            className="mt-5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Reset All Filters
          </button>
        </Card>
      ) : (
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

            // Resolve high-resolution demo photo
            const imageInfo = getPropertyImage(property);
            const imageUrl = property.image || imageInfo.url;
            const imageAlt = property.imageAlt || imageInfo.alt;

            return (
              <Card
                key={property.id}
                className="group flex flex-col overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-800"
              >
                {/* Visual Photo Area */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img
                    src={imageUrl}
                    alt={imageAlt}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  {/* Subtle dark gradient overlay on bottom for contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

                  {/* Overlaid Badges (BHK & Furnishing) */}
                  <div className="absolute left-3 top-3 flex items-center gap-1.5">
                    <span className="rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-md border border-white/10 shadow-sm">
                      {property.bedrooms} BHK
                    </span>
                    <span className="rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-md border border-white/10 shadow-sm">
                      {property.furnishing}
                    </span>
                  </div>

                  {/* Wishlist / Bookmark Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toggleSave(property.id);
                    }}
                    className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full shadow-sm backdrop-blur-md transition hover:scale-110 ${
                      isSaved
                        ? 'bg-white text-emerald-600 dark:bg-gray-900 dark:text-emerald-400'
                        : 'bg-white/85 text-gray-700 hover:text-emerald-600 dark:bg-gray-900/85 dark:text-gray-200'
                    }`}
                    title={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
                    aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
                    aria-pressed={isSaved}
                  >
                    {isSaved ? (
                      <BookmarkIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <BookmarkOutlineIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-4">
                  {/* Title */}
                  <h3 className="text-[15px] font-semibold text-gray-900 line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors dark:text-white">
                    {property.title}
                  </h3>

                  {/* Location & Commute */}
                  <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1 line-clamp-1">
                    <span>📍</span>
                    <span>{property.location}</span>
                    {property.commute && (
                      <span className="text-gray-400 dark:text-gray-500">· {property.commute}</span>
                    )}
                  </p>

                  {/* Financial Summary */}
                  <div className="mt-3.5 rounded-lg bg-gray-50 p-2.5 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                    <div className="flex items-baseline justify-between">
                      <p className="text-sm font-bold text-tabular text-gray-900 dark:text-white">
                        {money(property.rent)}{' '}
                        <span className="text-[11px] font-normal text-gray-500 dark:text-gray-400">
                          / mo rent
                        </span>
                      </p>
                      <span className="text-[11px] font-medium text-tabular text-emerald-700 dark:text-emerald-400">
                        True: ≈{money(monthlyEst)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-tabular text-gray-500 dark:text-gray-400">
                      <span>Deposit: {money(property.deposit)}</span>
                      <span>Move-in: {money(moveInEst)}</span>
                    </div>
                  </div>

                  {/* Badges and Amenities */}
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {Array.isArray(property.amenities) &&
                      property.amenities.slice(0, 3).map((a) => (
                        <span
                          key={a}
                          className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        >
                          {a}
                        </span>
                      ))}
                    {Array.isArray(property.amenities) && property.amenities.length > 3 && (
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                        +{property.amenities.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Spacer */}
                  <div className="flex-1 min-h-[14px]"></div>

                  {/* Footer */}
                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
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
                      {isCompare ? 'In Comparison' : 'Compare'}
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
      )}

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
