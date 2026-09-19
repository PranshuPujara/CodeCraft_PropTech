'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SearchIcon, HomeIcon, CloseIcon } from '@/components/icons';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface PropertyResult {
  id: string;
  title: string;
  location: string;
  rent: number;
  bedrooms: number;
  furnishing: string;
  amenities: string[];
  commute?: string;
  costBreakdown?: {
    estimatedMonthlyCost: number;
    initialMoveInCost: number;
  };
  cost?: {
    estimatedMonthlyCost: number;
    initialMoveInCost: number;
  };
}

/* ------------------------------------------------------------------ */
/* Inline SVG icons for locations & actions                            */
/* ------------------------------------------------------------------ */

function MapPinIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}

function BuildingIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5M3.75 3v18h6V12.75h4.5V21h6V7.5l-9-4.5-7.5 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5h.008v.008H6.75V7.5zm0 3h.008v.008H6.75v-.008zm0 3h.008v.008H6.75v-.008zm3.75-6h.008v.008h-.008V7.5zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  );
}

function TrainIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75l-3 3M15.75 18.75l3 3M12 2.25c-3.728 0-6.75 1.007-6.75 2.25v12a3 3 0 003 3h7.5a3 3 0 003-3v-12c0-1.243-3.022-2.25-6.75-2.25z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 9.75h13.5M9 15.75h.008M15 15.75h.008" />
    </svg>
  );
}

function TreeIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-6m0 0l-4 .5c2-3 1-5 1-5l3-4 3 4s-1 2 1 5l-4-.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15l-3 .375C11 12 10 10 10 10l2-2.667L14 10s-1 2 1 5.375L12 15z" />
      <circle cx="12" cy="6" r="3" />
    </svg>
  );
}

function CoffeeIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function CompassIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
    </svg>
  );
}

function SparkleSmallIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

function LayersIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75m11.142 0l4.179 2.25L12 17.25 2.25 12l4.179-2.25" />
    </svg>
  );
}

function DocumentSearchIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function ArrowRightSmIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}

function ClockIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const money = (v: number) => `₹${new Intl.NumberFormat('en-IN').format(v)}`;

const locationSuggestions = [
  {
    name: 'Indiranagar',
    tagline: 'Cafés, nightlife & 100ft Road',
    icon: CoffeeIcon,
    gradient: 'from-rose-500/10 to-orange-500/10 dark:from-rose-500/20 dark:to-orange-500/20',
    iconColor: 'text-rose-500 dark:text-rose-400',
    borderHover: 'hover:border-rose-200 dark:hover:border-rose-800',
  },
  {
    name: 'Koramangala',
    tagline: 'Startup hub, closest to tech parks',
    icon: BuildingIcon,
    gradient: 'from-violet-500/10 to-blue-500/10 dark:from-violet-500/20 dark:to-blue-500/20',
    iconColor: 'text-violet-500 dark:text-violet-400',
    borderHover: 'hover:border-violet-200 dark:hover:border-violet-800',
  },
  {
    name: 'Jayanagar',
    tagline: 'Metro access, residential calm',
    icon: TrainIcon,
    gradient: 'from-sky-500/10 to-cyan-500/10 dark:from-sky-500/20 dark:to-cyan-500/20',
    iconColor: 'text-sky-500 dark:text-sky-400',
    borderHover: 'hover:border-sky-200 dark:hover:border-sky-800',
  },
  {
    name: 'HSR Layout',
    tagline: 'Quiet, green & affordable',
    icon: TreeIcon,
    gradient: 'from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20',
    iconColor: 'text-emerald-500 dark:text-emerald-400',
    borderHover: 'hover:border-emerald-200 dark:hover:border-emerald-800',
  },
];

const recentSearches = [
  '2 BHK under ₹35,000',
  'Furnished near metro',
  'Koramangala apartments',
];

const quickActions = [
  {
    id: 'discover',
    label: 'Browse All Properties',
    sub: 'View the full property database',
    icon: CompassIcon,
    href: '/discover',
    accentColor: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
    accentBg: 'group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30',
  },
  {
    id: 'compare',
    label: 'Compare Shortlisted',
    sub: 'Side-by-side trade-off analysis',
    icon: LayersIcon,
    href: '/compare',
    accentColor: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
    accentBg: 'group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30',
  },
  {
    id: 'copilot',
    label: 'Ask AI Copilot',
    sub: '"Can I afford this apartment?"',
    icon: SparkleSmallIcon,
    href: '/copilot',
    accentColor: 'group-hover:text-violet-600 dark:group-hover:text-violet-400',
    accentBg: 'group-hover:bg-violet-50 dark:group-hover:bg-violet-900/30',
  },
  {
    id: 'agreements',
    label: 'Lease Intelligence',
    sub: 'Upload & inspect rental agreements',
    icon: DocumentSearchIcon,
    href: '/agreements',
    accentColor: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
    accentBg: 'group-hover:bg-amber-50 dark:group-hover:bg-amber-900/30',
  },
];

/* ------------------------------------------------------------------ */
/* Main Component                                                      */
/* ------------------------------------------------------------------ */
export default function CommandSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PropertyResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-focus input when opening
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setQuery('');
      setResults([]);
      setActiveIndex(-1);
    }
  }, [isOpen]);

  // Debounced live search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/properties?keyword=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.properties || []);
        }
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation
  const totalItems = results.length + (query ? 0 : locationSuggestions.length);
  const handleKeyNav = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => (i < totalItems - 1 ? i + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => (i > 0 ? i - 1 : totalItems - 1));
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        if (query && results[activeIndex]) {
          router.push(`/properties/${results[activeIndex].id}`);
          setIsOpen(false);
        } else if (!query && activeIndex < locationSuggestions.length) {
          setQuery(locationSuggestions[activeIndex].name);
          setActiveIndex(-1);
        }
      }
    },
    [activeIndex, totalItems, query, results, router]
  );

  const navigateTo = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  /* ---- Closed trigger ---- */
  if (!isOpen) {
    return (
      <>
        {/* Desktop trigger */}
        <button
          onClick={() => setIsOpen(true)}
          className="group relative hidden h-10 w-80 items-center gap-2.5 rounded-xl border border-gray-200/80 bg-gray-50/80 pl-10 pr-3 text-left text-sm text-gray-400 transition-all duration-200 hover:border-emerald-300/60 hover:bg-white hover:shadow-[0_2px_12px_-2px_rgba(16,185,129,0.12)] xl:flex dark:border-gray-700/80 dark:bg-gray-800/60 dark:text-gray-500 dark:hover:border-emerald-700/60 dark:hover:bg-gray-700/80 dark:hover:shadow-[0_2px_12px_-2px_rgba(16,185,129,0.08)]"
          aria-label="Search properties (⌘K)"
        >
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-hover:text-emerald-500" />
          <span className="flex-1 truncate">Search properties, locations…</span>
          <kbd className="pointer-events-none flex h-5 select-none items-center gap-0.5 rounded-md border border-gray-200/80 bg-white px-1.5 text-[10px] font-medium text-gray-400 shadow-[0_1px_0_1px_rgba(0,0,0,0.04)] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-500 dark:shadow-none">
            ⌘K
          </kbd>
        </button>

        {/* Mobile trigger */}
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 xl:hidden dark:text-gray-400 dark:hover:bg-white/5"
          aria-label="Search"
        >
          <SearchIcon className="h-5 w-5" />
        </button>
      </>
    );
  }

  /* ---- Open overlay ---- */
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-gray-950/30 backdrop-blur-[6px] transition-opacity cmd-backdrop-in"
        onClick={() => setIsOpen(false)}
        aria-hidden
        style={{ animation: 'cmdBackdropIn 0.15s ease-out' }}
      />

      {/* Panel */}
      <div
        className="fixed inset-x-4 top-[12vh] z-[101] mx-auto max-w-[640px] sm:inset-x-auto sm:w-full"
        style={{ animation: 'cmdPanelIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.25)] ring-1 ring-black/[0.04] backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/95 dark:shadow-[0_24px_80px_-12px_rgba(0,0,0,0.6)] dark:ring-white/[0.04]">

          {/* ── Search Input ── */}
          <div className="relative flex items-center gap-3 px-5">
            <div className="relative">
              <SearchIcon className="h-[18px] w-[18px] text-gray-400 dark:text-gray-500" />
              {isSearching && (
                <span
                  className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-500"
                  style={{ animation: 'spin 0.6s linear infinite' }}
                />
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(-1);
              }}
              onKeyDown={handleKeyNav}
              maxLength={100}
              className="h-[56px] flex-1 bg-transparent text-[15px] font-medium text-gray-900 outline-none placeholder:text-gray-400 placeholder:font-normal dark:text-white dark:placeholder:text-gray-500"
              placeholder="Search by name, location, or budget range…"
              aria-label="Search"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                aria-label="Clear search"
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-6 items-center rounded-md border border-gray-200 bg-gray-50 px-1.5 text-[10px] font-semibold tracking-wide text-gray-400 transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500 dark:hover:bg-gray-700"
            >
              ESC
            </button>
          </div>

          {/* Divider with subtle gradient */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700/70" />

          {/* ── Content Area ── */}
          <div className="no-scrollbar max-h-[56vh] overflow-y-auto overscroll-contain px-2 py-2">

            {/* ── Loading Shimmer ── */}
            {isSearching && (
              <div className="space-y-2 p-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-3" style={{ animation: `cmdShimmer 1.5s ease-in-out ${i * 0.15}s infinite` }}>
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-800/60" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-3/5 rounded-md bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-800/60" />
                      <div className="h-2.5 w-2/5 rounded-md bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-800/60" />
                    </div>
                    <div className="h-5 w-16 rounded-md bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-800/60" />
                  </div>
                ))}
              </div>
            )}

            {/* ── Search Results ── */}
            {!isSearching && query.trim() && results.length > 0 && (
              <>
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-gray-500">
                    Properties
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {results.length} found
                  </span>
                </div>

                {results.map((property, idx) => {
                  const monthlyEst =
                    property.costBreakdown?.estimatedMonthlyCost ||
                    property.cost?.estimatedMonthlyCost ||
                    property.rent + 4000;
                  const isActive = activeIndex === idx;

                  return (
                    <button
                      key={property.id}
                      onClick={() => navigateTo(`/properties/${property.id}`)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`group/item flex w-full items-center gap-3.5 rounded-xl px-3 py-3 text-left transition-all duration-150 ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-50/80 to-emerald-50/30 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.15)] dark:from-emerald-900/20 dark:to-emerald-900/5 dark:shadow-[inset_0_0_0_1px_rgba(16,185,129,0.1)]'
                          : 'hover:bg-gray-50/80 dark:hover:bg-gray-800/40'
                      }`}
                      style={{ animation: `cmdItemIn 0.2s ease-out ${idx * 0.04}s both` }}
                    >
                      {/* Icon */}
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-150 ${
                        isActive
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                      }`}>
                        <HomeIcon className="h-5 w-5" />
                      </div>

                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-semibold transition-colors ${
                          isActive ? 'text-emerald-800 dark:text-emerald-200' : 'text-gray-900 dark:text-white'
                        }`}>
                          {property.title}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                          <MapPinIcon className="h-3 w-3 shrink-0" />
                          <span className="truncate">{property.location}</span>
                          <span className="mx-0.5 h-0.5 w-0.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                          <span className="shrink-0">{property.bedrooms} BHK</span>
                          <span className="mx-0.5 h-0.5 w-0.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                          <span className="shrink-0">{property.furnishing}</span>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="shrink-0 text-right">
                        <p className={`text-sm font-bold tabular-nums transition-colors ${
                          isActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-900 dark:text-white'
                        }`}>
                          {money(property.rent)}
                        </p>
                        <p className="text-[10px] tabular-nums text-gray-400 dark:text-gray-500">
                          Total ≈{money(monthlyEst)}/mo
                        </p>
                      </div>

                      {/* Arrow indicator */}
                      <ArrowRightSmIcon className={`h-3.5 w-3.5 shrink-0 transition-all duration-150 ${
                        isActive ? 'translate-x-0 text-emerald-500 opacity-100' : '-translate-x-1 opacity-0'
                      }`} />
                    </button>
                  );
                })}

                {/* CTA: View all */}
                <button
                  onClick={() => navigateTo(`/discover`)}
                  className="group mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200/80 bg-gray-50/50 py-2.5 text-xs font-semibold text-gray-500 transition-all hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-600 dark:border-gray-700/80 dark:bg-gray-800/30 dark:text-gray-400 dark:hover:border-emerald-800 dark:hover:bg-emerald-900/10 dark:hover:text-emerald-400"
                >
                  View all results in Discover
                  <ArrowRightSmIcon className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </button>
              </>
            )}

            {/* ── No Results ── */}
            {!isSearching && query.trim() && results.length === 0 && (
              <div className="flex flex-col items-center gap-4 py-14 text-center">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-800/60">
                    <SearchIcon className="h-7 w-7 text-gray-300 dark:text-gray-600" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm ring-2 ring-white dark:bg-gray-800 dark:ring-gray-800">
                    <CloseIcon className="h-3 w-3" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    No properties match &ldquo;{query}&rdquo;
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-gray-400 dark:text-gray-500">
                    Try a different location, BHK type, or budget range
                  </p>
                </div>
                <button
                  onClick={() => navigateTo('/discover')}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md"
                >
                  Browse all properties
                </button>
              </div>
            )}

            {/* ── Default State ── */}
            {!query.trim() && !isSearching && (
              <>
                {/* Recent Searches */}
                <div className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <ClockIcon className="h-3 w-3 text-gray-400" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-gray-500">
                      Recent
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {recentSearches.map((s) => (
                      <button
                        key={s}
                        onClick={() => setQuery(s)}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-150 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-600 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-[0_1px_4px_rgba(16,185,129,0.1)] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:shadow-none dark:hover:border-emerald-800 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-300"
                      >
                        <SearchIcon className="h-3 w-3 text-gray-400" />
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="my-1 h-px bg-gradient-to-r from-transparent via-gray-150 to-transparent dark:via-gray-800" />

                {/* Explore by Location */}
                <div className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <MapPinIcon className="h-3 w-3 text-gray-400" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-gray-500">
                      Explore by location
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 px-2 pb-2">
                  {locationSuggestions.map((loc, idx) => {
                    const isActive = activeIndex === idx;
                    const IconComp = loc.icon;
                    return (
                      <button
                        key={loc.name}
                        onClick={() => setQuery(loc.name)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={`group/loc flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all duration-200 ${
                          isActive
                            ? `bg-gradient-to-br ${loc.gradient} border-transparent shadow-sm`
                            : `border-gray-100 bg-white/60 ${loc.borderHover} hover:bg-white hover:shadow-sm dark:border-gray-800 dark:bg-gray-800/40 dark:hover:bg-gray-800/80`
                        }`}
                        style={{ animation: `cmdItemIn 0.2s ease-out ${idx * 0.05}s both` }}
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                          isActive
                            ? `${loc.iconColor} bg-white/80 shadow-sm dark:bg-gray-900/60`
                            : 'bg-gray-100/80 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                        }`}>
                          <IconComp className={`h-5 w-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover/loc:scale-105'}`} />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-[13px] font-semibold transition-colors ${
                            isActive ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {loc.name}
                          </p>
                          <p className="truncate text-[11px] text-gray-400 dark:text-gray-500">
                            {loc.tagline}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Divider */}
                <div className="my-1 h-px bg-gradient-to-r from-transparent via-gray-150 to-transparent dark:via-gray-800" />

                {/* Quick Actions */}
                <div className="px-3 py-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-gray-500">
                    Quick actions
                  </span>
                </div>
                <div className="space-y-0.5 px-2 pb-2">
                  {quickActions.map((action, idx) => {
                    const IconComp = action.icon;
                    return (
                      <button
                        key={action.id}
                        onClick={() => navigateTo(action.href)}
                        className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        style={{ animation: `cmdItemIn 0.2s ease-out ${(idx + 4) * 0.04}s both` }}
                      >
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400 transition-all duration-200 ${action.accentBg} ${action.accentColor} dark:bg-gray-800 dark:text-gray-500`}>
                          <IconComp className="h-[18px] w-[18px]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-gray-700 dark:text-gray-300">
                            {action.label}
                          </p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500">
                            {action.sub}
                          </p>
                        </div>
                        <ArrowRightSmIcon className="h-3.5 w-3.5 -translate-x-1 text-gray-300 opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100 group-hover:text-gray-400 dark:text-gray-600 dark:group-hover:text-gray-500" />
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between border-t border-gray-100/80 bg-gray-50/50 px-5 py-2.5 dark:border-gray-800/80 dark:bg-gray-900/50">
            <div className="flex items-center gap-3.5 text-[11px] text-gray-400 dark:text-gray-500">
              <span className="flex items-center gap-1">
                <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-gray-200/80 bg-white px-1 text-[10px] font-medium shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:border-gray-700 dark:bg-gray-800 dark:shadow-none">↑</kbd>
                <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-gray-200/80 bg-white px-1 text-[10px] font-medium shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:border-gray-700 dark:bg-gray-800 dark:shadow-none">↓</kbd>
                <span className="ml-0.5">navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-gray-200/80 bg-white px-1 text-[10px] font-medium shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:border-gray-700 dark:bg-gray-800 dark:shadow-none">↵</kbd>
                <span className="ml-0.5">select</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-gray-200/80 bg-white px-1 text-[10px] font-medium shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:border-gray-700 dark:bg-gray-800 dark:shadow-none">esc</kbd>
                <span className="ml-0.5">dismiss</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 dark:text-gray-500">
              <span className="flex h-[18px] w-[18px] items-center justify-center rounded bg-gradient-to-br from-emerald-500 to-emerald-600 text-[9px] font-bold text-white shadow-sm">R</span>
              <span>Rentwise</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Inline keyframe styles ── */}
      <style jsx>{`
        @keyframes cmdBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cmdPanelIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes cmdItemIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes cmdShimmer {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
