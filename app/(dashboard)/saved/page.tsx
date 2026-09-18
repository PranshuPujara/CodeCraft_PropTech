'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  HomeIcon,
  HeartIcon,
  StarIcon,
  ChevronRightIcon,
  CompareIcon,
  LightbulbIcon,
  SearchIcon,
  SparklesIcon,
} from '@/components/icons';

const money = (v: number) => `₹${new Intl.NumberFormat('en-IN').format(v)}`;

interface SavedItem {
  id: string;
  userId: string;
  propertyId: string;
  isShortlisted: boolean;
  property: {
    id: string;
    title: string;
    location: string;
    rent: number;
    deposit: number;
    brokerage: number;
    bedrooms: number;
    furnishing: string;
    commute?: string;
    amenities?: string[];
    costBreakdown?: {
      estimatedMonthlyCost: number;
      initialMoveInCost: number;
      maintenance?: number;
      electricity?: number;
      water?: number;
      internet?: number;
      transport?: number;
    };
    cost?: {
      estimatedMonthlyCost: number;
      initialMoveInCost: number;
    };
  };
}

export default function SavedPage() {
  const [savedList, setSavedList] = useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'all' | 'shortlisted' | 'saved'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchSaved = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/saved');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.savedProperties)) {
          setSavedList(data.savedProperties);
        }
      }
    } catch (err) {
      console.error('Error fetching saved properties:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const toggleShortlist = async (savedItem: SavedItem) => {
    const nextState = !savedItem.isShortlisted;
    // Optimistic UI update
    setSavedList((list) =>
      list.map((s) => (s.id === savedItem.id ? { ...s, isShortlisted: nextState } : s))
    );

    try {
      await fetch('/api/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: savedItem.propertyId,
          isShortlisted: nextState,
        }),
      });
    } catch (e) {
      console.error('Failed to update shortlist status:', e);
      fetchSaved();
    }
  };

  const removeSaved = async (savedItem: SavedItem) => {
    // Optimistic UI update
    setSavedList((list) => list.filter((s) => s.id !== savedItem.id));
    try {
      await fetch(`/api/saved?propertyId=${savedItem.propertyId}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Failed to remove saved property:', e);
      fetchSaved();
    }
  };

  const shortlisted = savedList.filter((s) => s.isShortlisted);
  const others = savedList.filter((s) => !s.isShortlisted);

  const displayedList =
    filterTab === 'shortlisted'
      ? shortlisted
      : filterTab === 'saved'
      ? others
      : savedList;

  const shortlistedIdsQuery = shortlisted.map((s) => s.property.id).join(',');

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <StarIcon className="h-4 w-4" />
            </span>
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Saved & Shortlisted Homes
            </p>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Decision Shortlist & Bookmarks
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Curate shortlisted properties to weigh true monthly costs, analyze trade-offs, and run AI Decision Support.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-900">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === 'grid'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Grid View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === 'list'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Dense List
            </button>
          </div>
          <Link
            href="/discover"
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <SearchIcon className="h-3.5 w-3.5" />
            Browse more
          </Link>
        </div>
      </div>

      {/* Decision Intelligence Active Action Banner */}
      {shortlisted.length >= 2 ? (
        <Card className="relative overflow-hidden border-emerald-500/40 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-5 dark:border-emerald-500/30">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/30">
                <SparklesIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge tone="green">Ready for Decision Analysis</Badge>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {shortlisted.length} shortlisted homes selected
                  </span>
                </div>
                <h3 className="mt-1 text-base font-bold text-gray-900 dark:text-white">
                  Weigh trade-offs across your {shortlisted.length} shortlisted properties
                </h3>
                <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-300">
                  Synthesize true monthly costs, commute realities, and objective pros/cons against your budget.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href={`/assistant?ids=${shortlistedIdsQuery}`}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
              >
                <LightbulbIcon className="h-4 w-4" />
                Run Decision Assistant →
              </Link>
              <Link
                href={`/compare?ids=${shortlistedIdsQuery}`}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-xs font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50 dark:border-emerald-800 dark:bg-gray-800 dark:text-emerald-300 dark:hover:bg-gray-700"
              >
                <CompareIcon className="h-4 w-4" />
                Factor Table ({shortlisted.length})
              </Link>
            </div>
          </div>
        </Card>
      ) : shortlisted.length === 1 ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-amber-300 bg-amber-50/60 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
              <LightbulbIcon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                1 property shortlisted: &quot;{shortlisted[0].property.title}&quot;
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Shortlist at least 1 more property using the &ldquo;+ Shortlist&rdquo; button to activate AI Decision Support.
              </p>
            </div>
          </div>
          <Badge tone="amber">Need 1 More for AI Decision</Badge>
        </Card>
      ) : null}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3 dark:border-gray-800">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterTab('all')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              filterTab === 'all'
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            All Saved ({savedList.length})
          </button>
          <button
            onClick={() => setFilterTab('shortlisted')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              filterTab === 'shortlisted'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            <StarIcon className="h-3.5 w-3.5" />
            Shortlisted for Decision ({shortlisted.length})
          </button>
          <button
            onClick={() => setFilterTab('saved')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              filterTab === 'saved'
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Saved for Later ({others.length})
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Showing {displayedList.length} properties
        </p>
      </div>

      {/* Content Rendering */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-72 animate-pulse bg-gray-100 dark:bg-gray-800/40" />
          ))}
        </div>
      ) : displayedList.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
            <HomeIcon className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="mt-4 text-base font-bold text-gray-900 dark:text-white">
            {filterTab === 'shortlisted'
              ? 'No properties in your decision shortlist yet'
              : 'No saved properties found'}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">
            {filterTab === 'shortlisted'
              ? 'Click the "⭐ Shortlist" button on any saved home to include it in the Decision Assistant evaluation.'
              : 'Browse properties on the discovery page and tap the heart icon to save them for decision comparison.'}
          </p>
          <div className="mt-5 flex gap-3">
            {filterTab !== 'all' ? (
              <button
                onClick={() => setFilterTab('all')}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                View all saved ({savedList.length})
              </button>
            ) : null}
            <Link
              href="/discover"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              Discover properties →
            </Link>
          </div>
        </Card>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayedList.map((item) => (
            <PropertyCard
              key={item.id}
              savedItem={item}
              onToggleShortlist={() => toggleShortlist(item)}
              onRemove={() => removeSaved(item)}
            />
          ))}
        </div>
      ) : (
        /* DENSE LIST VIEW */
        <div className="space-y-3">
          {displayedList.map((item) => (
            <PropertyDenseRow
              key={item.id}
              savedItem={item}
              onToggleShortlist={() => toggleShortlist(item)}
              onRemove={() => removeSaved(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Rich Property Card */
function PropertyCard({
  savedItem,
  onToggleShortlist,
  onRemove,
}: {
  savedItem: SavedItem;
  onToggleShortlist: () => void;
  onRemove: () => void;
}) {
  const p = savedItem.property;
  const isShortlisted = savedItem.isShortlisted;

  const monthlyCost =
    p.costBreakdown?.estimatedMonthlyCost ||
    p.cost?.estimatedMonthlyCost ||
    p.rent + 3500;
  const moveInCost =
    p.costBreakdown?.initialMoveInCost ||
    p.cost?.initialMoveInCost ||
    (p.deposit || p.rent * 2) + (p.brokerage || 0) + p.rent;

  const amenitiesList = Array.isArray(p.amenities) ? p.amenities : [];

  return (
    <Card className="group flex flex-col overflow-hidden transition hover:shadow-md dark:border-gray-800">
      {/* Visual Cover / Banner */}
      <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-gray-100 via-slate-100 to-gray-200 dark:from-gray-800/80 dark:via-gray-800 dark:to-gray-900">
        <HomeIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 transition group-hover:scale-105" />

        {/* Top Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge tone="blue">{p.bedrooms} BHK</Badge>
          <Badge tone="blue">{p.furnishing}</Badge>
        </div>

        {/* Remove Button */}
        <button
          onClick={onRemove}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow-sm backdrop-blur-sm transition hover:scale-110 hover:bg-rose-50 dark:bg-gray-900/90 dark:hover:bg-rose-950/50"
          title="Remove from saved"
        >
          <HeartIcon className="h-4 w-4" />
        </button>

        {/* Shortlist Ribbon Status */}
        {isShortlisted && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-emerald-600/90 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm backdrop-blur-sm">
            <StarIcon className="h-3 w-3" />
            <span>Shortlisted for Decision</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{p.location}</p>
        <Link
          href={`/properties/${p.id}`}
          className="mt-0.5 font-bold text-gray-900 line-clamp-1 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400"
        >
          {p.title}
        </Link>

        {p.commute && (
          <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            📍 {p.commute}
          </p>
        )}

        {/* True Cost Breakdown Box */}
        <div className="mt-3.5 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50">
          <div className="grid grid-cols-3 gap-1 text-center">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-gray-400">Base Rent</span>
              <p className="text-xs font-semibold text-gray-900 dark:text-white">{money(p.rent)}</p>
            </div>
            <div className="border-x border-gray-200 dark:border-gray-700">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-800 dark:text-emerald-300">
                True Monthly
              </span>
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                ≈ {money(monthlyCost)}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-gray-400">Move-in Cash</span>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{money(moveInCost)}</p>
            </div>
          </div>
        </div>

        {/* Amenities preview */}
        {amenitiesList.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {amenitiesList.slice(0, 3).map((a) => (
              <span
                key={a}
                className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              >
                {a}
              </span>
            ))}
            {amenitiesList.length > 3 && (
              <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                +{amenitiesList.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Card Footer Actions */}
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
          <button
            onClick={onToggleShortlist}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              isShortlisted
                ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                : 'border border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            <StarIcon className="h-3.5 w-3.5" />
            {isShortlisted ? 'In Shortlist' : '+ Shortlist'}
          </button>

          <Link
            href={`/properties/${p.id}`}
            className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
          >
            Details
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </Card>
  );
}

/** Dense Row Layout for List View */
function PropertyDenseRow({
  savedItem,
  onToggleShortlist,
  onRemove,
}: {
  savedItem: SavedItem;
  onToggleShortlist: () => void;
  onRemove: () => void;
}) {
  const p = savedItem.property;
  const isShortlisted = savedItem.isShortlisted;

  const monthlyCost =
    p.costBreakdown?.estimatedMonthlyCost ||
    p.cost?.estimatedMonthlyCost ||
    p.rent + 3500;
  const moveInCost =
    p.costBreakdown?.initialMoveInCost ||
    p.cost?.initialMoveInCost ||
    (p.deposit || p.rent * 2) + (p.brokerage || 0) + p.rent;

  return (
    <Card className="flex flex-col gap-4 p-4 transition hover:shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
      <div className="flex items-center gap-4">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
          <HomeIcon className="h-6 w-6 text-gray-400" />
          {isShortlisted && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white">
              <StarIcon className="h-2.5 w-2.5" />
            </span>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={`/properties/${p.id}`}
              className="font-bold text-gray-900 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400"
            >
              {p.title}
            </Link>
            {isShortlisted && <Badge tone="green">Shortlisted</Badge>}
          </div>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {p.location} · {p.bedrooms} BHK · {p.furnishing} {p.commute ? `· 📍 ${p.commute}` : ''}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <div className="text-right">
          <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
            ≈ {money(monthlyCost)}
            <span className="text-xs font-normal text-gray-400"> / mo</span>
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Rent: {money(p.rent)} · Move-in: {money(moveInCost)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleShortlist}
            className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              isShortlisted
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            <StarIcon className="h-3 w-3" />
            {isShortlisted ? 'Shortlisted' : '+ Shortlist'}
          </button>

          <button
            onClick={onRemove}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-white text-rose-500 hover:bg-rose-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-rose-950/40"
            title="Remove from saved"
          >
            <HeartIcon className="h-4 w-4" />
          </button>

          <Link
            href={`/properties/${p.id}`}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:hover:text-gray-200"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </Card>
  );
}
