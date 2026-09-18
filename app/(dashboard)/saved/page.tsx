'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { demoProperties, demoSaved } from '@/lib/demo-data';
import { HomeIcon, ChevronRightIcon } from '@/components/icons';

const money = (v: number) => `₹${new Intl.NumberFormat('en-IN').format(v)}`;

export default function SavedPage() {
  const [savedList, setSavedList] = useState(demoSaved);

  const toggleShortlist = (id: string) =>
    setSavedList((list) =>
      list.map((s) => (s.id === id ? { ...s, isShortlisted: !s.isShortlisted } : s))
    );

  const removeSaved = (id: string) =>
    setSavedList((list) => list.filter((s) => s.id !== id));

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
          {savedList.length} saved · {shortlisted.length} shortlisted for comparison
        </p>
      </div>

      {/* Shortlisted */}
      {shortlisted.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            Shortlisted
          </h2>
          <div className="space-y-3">
            {shortlisted.map((saved) => (
              <PropertyRow
                key={saved.id}
                saved={saved}
                onToggleShortlist={() => toggleShortlist(saved.id)}
                onRemove={() => removeSaved(saved.id)}
              />
            ))}
          </div>
          {shortlisted.length >= 2 && (
            <div className="mt-4">
              <Link
                href="/compare"
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                Compare shortlisted →
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
                onToggleShortlist={() => toggleShortlist(saved.id)}
                onRemove={() => removeSaved(saved.id)}
              />
            ))}
          </div>
        </div>
      )}

      {savedList.length === 0 && (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <HomeIcon className="h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="mt-4 font-semibold text-gray-900 dark:text-white">
            No saved properties yet
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Browse properties and save the ones you like.
          </p>
          <Link
            href="/discover"
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Discover properties →
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
  saved: (typeof demoSaved)[number];
  onToggleShortlist: () => void;
  onRemove: () => void;
}) {
  const prop = saved.property as (typeof demoProperties)[number];
  return (
    <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      <div className="flex flex-1 items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
          <HomeIcon className="h-5 w-5 text-gray-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
            {prop.title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {prop.location} · {prop.commute}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            ≈ {money(prop.cost.estimatedMonthlyCost)}
            <span className="font-normal text-gray-500 dark:text-gray-400"> /mo</span>
          </p>
        </div>
        <button
          onClick={onToggleShortlist}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            saved.isShortlisted
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
              : 'border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400'
          }`}
        >
          {saved.isShortlisted ? '★ Shortlisted' : '☆ Shortlist'}
        </button>
        <button
          onClick={onRemove}
          className="text-xs text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
        >
          Remove
        </button>
        <Link href={`/properties/${prop.id}`}>
          <ChevronRightIcon className="h-4 w-4 text-gray-300 dark:text-gray-600" />
        </Link>
      </div>
    </Card>
  );
}
