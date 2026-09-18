'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { demoSaved } from '@/lib/demo-data';
import { HomeIcon, ChevronRightIcon } from '@/components/icons';

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
    bedrooms: number;
    furnishing: string;
    commute?: string;
    costBreakdown?: {
      estimatedMonthlyCost: number;
      initialMoveInCost: number;
    };
    cost?: {
      estimatedMonthlyCost: number;
      initialMoveInCost: number;
    };
  };
}

export default function SavedPage() {
  const [savedList, setSavedList] = useState<SavedItem[]>(demoSaved as any);
  const [isLoading, setIsLoading] = useState(true);

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
    // Optimistic UI
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

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Saved properties
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Your bookmarked homes.
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {savedList.length} saved · {shortlisted.length} shortlisted for comparison (synced with database)
        </p>
      </div>

      {isLoading && (
        <div className="text-xs text-gray-400 animate-pulse">Syncing with database...</div>
      )}

      {/* Shortlisted */}
      {shortlisted.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            Shortlisted for Decision
          </h2>
          <div className="space-y-3">
            {shortlisted.map((saved) => (
              <PropertyRow
                key={saved.id}
                saved={saved}
                onToggleShortlist={() => toggleShortlist(saved)}
                onRemove={() => removeSaved(saved)}
              />
            ))}
          </div>
          {shortlisted.length >= 2 && (
            <div className="mt-4 flex gap-3">
              <Link
                href={`/compare?ids=${shortlisted.map((s) => s.property.id).join(',')}`}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                Compare shortlisted ({shortlisted.length}) →
              </Link>
              <Link
                href="/assistant"
                className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                Decision Assistant →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Others */}
      {others.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            Saved
          </h2>
          <div className="space-y-3">
            {others.map((saved) => (
              <PropertyRow
                key={saved.id}
                saved={saved}
                onToggleShortlist={() => toggleShortlist(saved)}
                onRemove={() => removeSaved(saved)}
              />
            ))}
          </div>
        </div>
      )}

      {savedList.length === 0 && !isLoading && (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <HomeIcon className="h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="mt-4 font-semibold text-gray-900 dark:text-white">
            No saved properties yet
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Browse properties and save the ones you want to evaluate.
          </p>
          <Link
            href="/discover"
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Go to discovery →
          </Link>
        </Card>
      )}
    </div>
  );
}

function PropertyRow({
  saved,
  onToggleShortlist,
  onRemove,
}: {
  saved: SavedItem;
  onToggleShortlist: () => void;
  onRemove: () => void;
}) {
  const p = saved.property;
  const monthlyCost =
    p.costBreakdown?.estimatedMonthlyCost ||
    p.cost?.estimatedMonthlyCost ||
    p.rent + 4000;
  const moveInCost =
    p.costBreakdown?.initialMoveInCost ||
    p.cost?.initialMoveInCost ||
    p.rent * 3;

  return (
    <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
          <HomeIcon className="h-6 w-6 text-gray-400" />
        </div>
        <div>
          <Link
            href={`/properties/${p.id}`}
            className="font-semibold text-gray-900 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400"
          >
            {p.title}
          </Link>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {p.location} · {p.bedrooms} BHK · {p.furnishing}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <div className="text-right">
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            ≈ {money(monthlyCost)}
            <span className="text-xs font-normal text-gray-500 dark:text-gray-400"> / mo</span>
          </p>
          <p className="text-[11px] text-gray-400">Move-in: {money(moveInCost)}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleShortlist}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              saved.isShortlisted
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            {saved.isShortlisted ? '✓ Shortlisted' : '+ Shortlist'}
          </button>
          <button
            onClick={onRemove}
            className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400"
            title="Remove from saved"
          >
            ✕
          </button>
          <Link
            href={`/properties/${p.id}`}
            className="rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </Card>
  );
}
