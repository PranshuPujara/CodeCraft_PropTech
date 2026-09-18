'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LightbulbIcon,
  SparklesIcon,
  ChevronDownIcon,
} from '@/components/icons';

const money = (v: number) => `₹${new Intl.NumberFormat('en-IN').format(v)}`;

function formatCompact(val: number): string {
  if (val >= 100000) {
    const l = val / 100000;
    return `₹${l % 1 === 0 ? l.toFixed(0) : l.toFixed(2)}L`;
  }
  if (val >= 1000) {
    const k = val / 1000;
    return `₹${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  return `₹${val}`;
}

interface PropertyAnalysis {
  propertyId: string;
  propertyName: string;
  location?: string;
  rent?: number;
  deposit?: number;
  brokerage?: number;
  bedrooms?: number;
  furnishing?: string;
  commute?: string;
  cost?: {
    estimatedMonthlyCost: number;
    initialMoveInCost: number;
    maintenance: number;
    electricity: number;
    water: number;
    internet: number;
    transport: number;
    otherRecurring: number;
    affordabilityStatus?: string;
  };
  pros: string[];
  cons: string[];
  preferenceAlignment: string[];
  tradeoffs: string[];
}

interface DecisionData {
  summary: string;
  properties: PropertyAnalysis[];
  keyTradeoffs: string[];
  evaluatedAgainst: {
    budget: number;
    bedrooms?: number;
    furnishing?: string;
    location?: string;
  };
  userPreferences?: {
    budget: number;
    bedrooms?: number;
    furnishing?: string;
    location?: string;
    priority?: string;
  };
  propertyCount: number;
}

function AssistantContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<DecisionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedProperties, setExpandedProperties] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedProperties((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const loadDecisionAssistant = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const idsParam = searchParams.get('ids');
      let propertyIds: string[] | undefined = undefined;
      if (idsParam) {
        propertyIds = idsParam.split(',').map((s) => s.trim()).filter(Boolean);
      }

      const res = await fetch('/api/decision-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(propertyIds ? { propertyIds } : {}),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        if (res.status === 400 && (errData?.count < 2 || errData?.error?.includes('At least 2'))) {
          setErrorMsg('insufficient_properties');
          setIsLoading(false);
          return;
        }
        throw new Error(errData?.error || 'Failed to load Decision Assistant analysis');
      }

      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error('Error in decision assistant client:', err);
      setErrorMsg(err.message || 'Error communicating with decision support system');
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    loadDecisionAssistant();
  }, [loadDecisionAssistant]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
          <SparklesIcon className="h-6 w-6 animate-spin" />
        </div>
        <h2 className="mt-4 text-base font-bold text-gray-900 dark:text-white">
          Evaluating Decision Intelligence...
        </h2>
        <p className="mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">
          Weighing true monthly overhead, upfront move-in cash, and trade-offs against your stated budget.
        </p>
      </div>
    );
  }

  if (errorMsg === 'insufficient_properties') {
    return (
      <Card className="flex flex-col items-center justify-center p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
          <LightbulbIcon className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
          Shortlist at least two properties to compare their trade-offs.
        </h2>
        <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
          The Decision Assistant analyzes concrete trade-offs between multiple shortlisted properties against your personal budget and lifestyle priorities.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/discover"
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Discover properties →
          </Link>
          <Link
            href="/saved"
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            View saved list
          </Link>
        </div>
      </Card>
    );
  }

  if (errorMsg || !data) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm font-semibold text-red-600 dark:text-red-400">
          {errorMsg || 'Unable to generate analysis at this time.'}
        </p>
        <button
          onClick={() => loadDecisionAssistant()}
          className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          Try again
        </button>
      </Card>
    );
  }

  // Derive Key Decision Signals
  const budget = data.evaluatedAgainst.budget || 35000;
  const monthlyCosts = data.properties.map(
    (p) => p.cost?.estimatedMonthlyCost || (p.rent || 0) + 3000
  );
  const moveInCosts = data.properties.map(
    (p) => p.cost?.initialMoveInCost || ((p.deposit || (p.rent || 0) * 2) + (p.rent || 0))
  );

  const minMonthly = Math.min(...monthlyCosts);
  const maxMonthly = Math.max(...monthlyCosts);
  const minMoveIn = Math.min(...moveInCosts);
  const maxMoveIn = Math.max(...moveInCosts);

  const withinBudgetProps = data.properties.filter(
    (p) => (p.cost?.estimatedMonthlyCost || p.rent || 0) <= budget
  );
  const exceedsBudgetProps = data.properties.filter(
    (p) => (p.cost?.estimatedMonthlyCost || p.rent || 0) > budget
  );

  // Extract a 1-2 sentence concise AI insight
  const conciseInsight = data.summary
    ? data.summary.split(/(?<=[.?!])\s+/).slice(0, 2).join(' ')
    : 'Your shortlisted options highlight a balance between lower recurring costs and preferred configuration.';

  const shortlistedIdsQuery = data.properties.map((p) => p.propertyId).join(',');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <LightbulbIcon className="h-4 w-4" />
            </span>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Decision Assistant
            </p>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Your shortlist, evaluated against your priorities.
          </h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {data.propertyCount} properties · Budget {money(budget)}/mo
            {data.evaluatedAgainst.bedrooms ? ` · ${data.evaluatedAgainst.bedrooms} BHK` : ''}
            {data.evaluatedAgainst.furnishing ? ` · ${data.evaluatedAgainst.furnishing}` : ''}
            {data.evaluatedAgainst.location ? ` · ${data.evaluatedAgainst.location}` : ''}
          </p>
        </div>

        <button
          onClick={() => loadDecisionAssistant()}
          className="self-start rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 sm:self-auto"
        >
          Re-evaluate analysis ↻
        </button>
      </div>

      {/* SECTION 1: DECISION SNAPSHOT (First major visual element) */}
      <Card className="overflow-hidden border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-transparent to-slate-500/5 p-5 dark:border-emerald-500/20">
        <div className="flex items-center justify-between border-b border-gray-200/60 pb-3 dark:border-gray-800/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Your Decision Snapshot
            </span>
          </div>
          <Badge tone="green">Decision Support Mode</Badge>
        </div>

        {/* Core Metric Cards */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Metric 1: Budget Ceiling */}
          <div className="rounded-xl bg-white p-3.5 shadow-sm dark:bg-gray-800/80">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Budget Alignment
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-gray-900 dark:text-white">
                {withinBudgetProps.length} of {data.properties.length}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">within budget</span>
            </div>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
              {exceedsBudgetProps.length > 0
                ? `${exceedsBudgetProps.length} option${exceedsBudgetProps.length > 1 ? 's' : ''} exceed${exceedsBudgetProps.length === 1 ? 's' : ''} ${formatCompact(budget)} ceiling`
                : `All options stay within ${formatCompact(budget)}`}
            </p>
          </div>

          {/* Metric 2: Monthly Recurring Spread */}
          <div className="rounded-xl bg-white p-3.5 shadow-sm dark:bg-gray-800/80">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Monthly Cost Range
            </span>
            <div className="mt-1">
              <span className="text-xl font-black text-emerald-800 dark:text-emerald-300">
                {formatCompact(minMonthly)} — {formatCompact(maxMonthly)}
              </span>
              <span className="text-xs text-gray-500"> / mo</span>
            </div>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
              Spread: {formatCompact(maxMonthly - minMonthly)} true overhead variance
            </p>
          </div>

          {/* Metric 3: Move-in Capital Required */}
          <div className="rounded-xl bg-white p-3.5 shadow-sm dark:bg-gray-800/80">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Upfront Move-In Range
            </span>
            <div className="mt-1">
              <span className="text-xl font-black text-gray-900 dark:text-white">
                {formatCompact(minMoveIn)} — {formatCompact(maxMoveIn)}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
              Includes deposit, brokerage & 1st month rent
            </p>
          </div>
        </div>

        {/* Concise AI Insight Banner (1-2 sentences) */}
        <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-white/80 p-3 text-xs leading-5 text-gray-700 shadow-sm dark:bg-gray-800/60 dark:text-gray-300">
          <span className="font-bold text-emerald-600 dark:text-emerald-400">💡 AI Insight:</span>
          <span>{conciseInsight}</span>
        </div>
      </Card>

      {/* SECTION 2: YOUR PRIORITIES (Compact Chips) */}
      <div>
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
          Evaluated Against Your Stated Priorities
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span>Budget:</span>
            <span>{money(budget)}/mo</span>
          </div>

          {data.evaluatedAgainst.bedrooms && (
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <span>Size:</span>
              <span>{data.evaluatedAgainst.bedrooms} BHK</span>
            </div>
          )}

          {data.evaluatedAgainst.furnishing && (
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <span>Furnishing:</span>
              <span>{data.evaluatedAgainst.furnishing}</span>
            </div>
          )}

          {data.evaluatedAgainst.location && (
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <span>Location:</span>
              <span>{data.evaluatedAgainst.location}</span>
            </div>
          )}

          <div className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            <span>Source:</span>
            <span>User Profile</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: KEY TRADE-OFFS (2-3 compact cards) */}
      <div>
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
          Core Trade-offs Between Options
        </h2>
        <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* Trade-off Card 1: Monthly Commitment */}
          <Card className="p-3.5 border-l-4 border-l-emerald-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Monthly Cost Trade-off
            </span>
            <div className="mt-1 text-sm font-black text-gray-900 dark:text-white">
              {formatCompact(minMonthly)} ↔ {formatCompact(maxMonthly)}
            </div>
            <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-300">
              Lower monthly overhead vs larger floor plan and exact requirement match.
            </p>
          </Card>

          {/* Trade-off Card 2: Move-in Capital */}
          <Card className="p-3.5 border-l-4 border-l-blue-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
              Upfront Cash Requirement
            </span>
            <div className="mt-1 text-sm font-black text-gray-900 dark:text-white">
              {formatCompact(minMoveIn)} ↔ {formatCompact(maxMoveIn)}
            </div>
            <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-300">
              {formatCompact(maxMoveIn - minMoveIn)} variance in move-in liquidity before signing.
            </p>
          </Card>

          {/* Trade-off Card 3: Lifestyle / Commute / Setup */}
          <Card className="p-3.5 border-l-4 border-l-amber-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Setup & Convenience
            </span>
            <div className="mt-1 text-sm font-black text-gray-900 dark:text-white">
              Furnishing ↔ Rent Premium
            </div>
            <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-300">
              {data.keyTradeoffs?.[0] || 'Fully furnished move-in ready convenience commands higher base rent.'}
            </p>
          </Card>
        </div>
      </div>

      {/* SECTION 4: PROPERTY COMPARISON (Compact Cards with Progressive Disclosure) */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Property-by-Property Comparison ({data.properties.length})
          </h2>
          <span className="text-[11px] text-gray-400">
            Ordered by shortlisted sequence
          </span>
        </div>

        <div className="mt-3 grid gap-5 lg:grid-cols-2">
          {data.properties.map((p) => {
            const rent = p.rent || 0;
            const trueMonthly = p.cost?.estimatedMonthlyCost || rent + 3000;
            const moveIn = p.cost?.initialMoveInCost || rent * 3;
            const isExpanded = !!expandedProperties[p.propertyId];

            const diffFromBudget = trueMonthly - budget;
            const isOverBudget = diffFromBudget > 0;

            // Preference matches
            const matchesBhk = !data.evaluatedAgainst.bedrooms || p.bedrooms === data.evaluatedAgainst.bedrooms;
            const matchesFurnishing =
              !data.evaluatedAgainst.furnishing ||
              p.furnishing?.toLowerCase().includes(data.evaluatedAgainst.furnishing.toLowerCase());

            const primaryTradeoff =
              p.tradeoffs?.[0] ||
              (isOverBudget
                ? `Higher recurring overhead (+${money(diffFromBudget)}/mo over budget), but matches your preferred specifications.`
                : `Comfortably within your stated ${money(budget)} budget, keeping monthly recurring commitments low.`);

            return (
              <Card key={p.propertyId} className="flex flex-col p-4 sm:p-5 transition hover:shadow-md dark:border-gray-800">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      href={`/properties/${p.propertyId}`}
                      className="text-base font-bold text-gray-900 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400"
                    >
                      {p.propertyName}
                    </Link>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {p.location || 'Bangalore'} {p.bedrooms ? `· ${p.bedrooms} BHK` : ''} {p.furnishing ? `· ${p.furnishing}` : ''}
                    </p>
                  </div>

                  <Link
                    href={`/properties/${p.propertyId}`}
                    className="text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    Inspect →
                  </Link>
                </div>

                {/* Key Numbers Row */}
                <div className="mt-3.5 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/40">
                  <div className="grid grid-cols-3 gap-1 text-center">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-gray-400">Listed Rent</span>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{money(rent)}</p>
                    </div>

                    <div className="border-x border-gray-200 dark:border-gray-700">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-800 dark:text-emerald-300">
                        True Monthly
                      </span>
                      <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        ≈ {money(trueMonthly)}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-gray-400">Move-in Cash</span>
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{money(moveIn)}</p>
                    </div>
                  </div>

                  {/* Budget Delta Indicator */}
                  <div className="mt-2.5 flex items-center justify-between border-t border-gray-200/60 pt-2 text-[11px] dark:border-gray-700/60">
                    <span className="text-gray-500 dark:text-gray-400">
                      Comparison vs {money(budget)} budget:
                    </span>
                    {isOverBudget ? (
                      <span className="font-bold text-rose-800 dark:text-rose-300">
                        ↑ {money(diffFromBudget)} over budget
                      </span>
                    ) : (
                      <span className="font-bold text-emerald-800 dark:text-emerald-300">
                        ✓ {money(Math.abs(diffFromBudget))} within budget
                      </span>
                    )}
                  </div>
                </div>

                {/* Alignment Indicators (Compact Chips) */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                      !isOverBudget
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                    }`}
                  >
                    {!isOverBudget ? '✓ Budget match' : `⚠ ${money(diffFromBudget)} over budget`}
                  </span>

                  {data.evaluatedAgainst.bedrooms && (
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                        matchesBhk
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {matchesBhk ? `✓ ${p.bedrooms} BHK match` : `✕ ${p.bedrooms} BHK`}
                    </span>
                  )}

                  {data.evaluatedAgainst.furnishing && (
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                        matchesFurnishing
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {matchesFurnishing ? `✓ ${p.furnishing}` : `${p.furnishing}`}
                    </span>
                  )}
                </div>

                {/* Main Trade-off Statement (1 concise sentence) */}
                <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50/70 p-2.5 text-xs text-gray-600 dark:border-gray-800 dark:bg-gray-800/20 dark:text-gray-300">
                  <span className="font-semibold text-gray-900 dark:text-white">Main trade-off: </span>
                  <span>{primaryTradeoff}</span>
                </div>

                {/* Progressive Disclosure (Expandable Breakdown & Reasoning) */}
                <div className="mt-3 border-t border-gray-100 pt-2.5 dark:border-gray-800">
                  <button
                    onClick={() => toggleExpand(p.propertyId)}
                    className="flex w-full items-center justify-between text-xs font-semibold text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
                  >
                    <span>{isExpanded ? 'Hide breakdown & reasoning' : 'View cost breakdown & reasoning'}</span>
                    <ChevronDownIcon
                      className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="mt-3 space-y-3.5 pt-1">
                      {/* Detailed Cost Components */}
                      {p.cost && (
                        <div className="rounded-lg bg-gray-50 p-2.5 text-xs dark:bg-gray-800/40">
                          <p className="font-bold text-gray-900 dark:text-white">
                            Itemized Monthly Cost Components:
                          </p>
                          <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 text-gray-600 dark:text-gray-300">
                            <div>Base Rent: {money(rent)}</div>
                            <div>Maintenance: {money(p.cost.maintenance)}</div>
                            <div>Electricity + Water: {money(p.cost.electricity + p.cost.water)}</div>
                            <div>Internet: {money(p.cost.internet)}</div>
                            <div>Estimated Commute: {money(p.cost.transport)}</div>
                            <div>Security Deposit: {money(p.deposit || rent * 2)}</div>
                          </div>
                        </div>
                      )}

                      {/* Pros & Cons */}
                      <div className="grid gap-2 text-xs sm:grid-cols-2">
                        <div>
                          <p className="font-bold text-emerald-800 dark:text-emerald-300">
                            Why it aligns:
                          </p>
                          <ul className="mt-1 space-y-1 text-gray-600 dark:text-gray-300">
                            {p.pros.slice(0, 3).map((pro, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="font-bold text-emerald-500">+</span>
                                <span>{pro}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <p className="font-bold text-amber-800 dark:text-amber-300">
                            Things to consider:
                          </p>
                          <ul className="mt-1 space-y-1 text-gray-600 dark:text-gray-300">
                            {p.cons.slice(0, 3).map((con, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="font-bold text-amber-500">−</span>
                                <span>{con}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
        <div className="flex gap-3">
          <Link
            href={`/compare?ids=${shortlistedIdsQuery}`}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Side-by-side factor table →
          </Link>
          <Link
            href="/saved"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            Manage shortlist
          </Link>
        </div>

        <p className="text-[11px] text-gray-400">
          Decision Assistant provides objective trade-off intelligence without making the final choice for you.
        </p>
      </div>
    </div>
  );
}

export default function AssistantPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <SparklesIcon className="h-6 w-6 animate-spin" />
          </div>
          <h2 className="mt-4 text-base font-bold text-gray-900 dark:text-white">
            Loading Decision Assistant...
          </h2>
        </div>
      }
    >
      <AssistantContent />
    </Suspense>
  );
}
