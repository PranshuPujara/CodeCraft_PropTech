'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LightbulbIcon, SparklesIcon, ChevronRightIcon, HomeIcon } from '@/components/icons';

const money = (v: number) => `₹${new Intl.NumberFormat('en-IN').format(v)}`;

interface PropertyAnalysis {
  propertyId: string;
  propertyName: string;
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
  propertyCount: number;
}

export default function AssistantPage() {
  const [data, setData] = useState<DecisionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadDecisionAssistant() {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch('/api/decision-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          if (res.status === 400 && errData?.count < 2) {
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
    }

    loadDecisionAssistant();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
          <SparklesIcon className="h-6 w-6 animate-spin" />
        </div>
        <h2 className="mt-4 text-base font-bold text-gray-900 dark:text-white">
          Synthesizing Decision Intelligence...
        </h2>
        <p className="mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">
          Weighing true monthly overhead, upfront move-in cash, and trade-offs across your shortlisted properties.
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
          Shortlist at least 2 properties
        </h2>
        <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
          The Decision Assistant analyzes concrete trade-offs between properties against your personal budget and lifestyle priorities.
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
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
        >
          Try again
        </button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            <LightbulbIcon className="h-4 w-4" />
          </span>
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Decision Assistant
          </p>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Your shortlist, weighed against your priorities.
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Objective decision support weighing true costs and trade-offs — helping you decide without deciding for you.
        </p>
      </div>

      {/* Decision Context Banner */}
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4 border-l-4 border-l-emerald-500">
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Evaluating <strong className="text-gray-900 dark:text-white">{data.propertyCount} properties</strong> against your stated monthly budget of{' '}
            <strong className="text-emerald-700 dark:text-emerald-300">{money(data.evaluatedAgainst.budget)}/mo</strong>
            {data.evaluatedAgainst.bedrooms && ` · ${data.evaluatedAgainst.bedrooms} BHK requirement`}
            {data.evaluatedAgainst.furnishing && ` · ${data.evaluatedAgainst.furnishing}`}
          </div>
        </div>
        <Badge tone="green">Decision Support Mode</Badge>
      </Card>

      {/* Synthesized Narrative */}
      <Card className="p-5 sm:p-6">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">
          Synthesized Decision Narrative
        </h2>
        <div className="mt-3 text-sm leading-7 text-gray-700 dark:text-gray-300">
          {data.summary}
        </div>
      </Card>

      {/* Key Trade-offs Grid */}
      {data.keyTradeoffs && data.keyTradeoffs.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Core Trade-offs Between Options
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.keyTradeoffs.map((item, idx) => (
              <Card key={idx} className="p-4 bg-gray-50/50 dark:bg-gray-800/30">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Trade-off #{idx + 1}
                </span>
                <p className="mt-2 text-sm leading-6 text-gray-700 dark:text-gray-300">
                  {item}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Property-by-Property Breakdown */}
      <div>
        <h2 className="text-base font-bold text-gray-900 dark:text-white">
          Property-by-Property Breakdown
        </h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          {data.properties.map((p) => (
            <Card key={p.propertyId} className="flex flex-col p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <Link
                    href={`/properties/${p.propertyId}`}
                    className="text-lg font-bold text-gray-900 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400"
                  >
                    {p.propertyName}
                  </Link>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    Shortlisted candidate
                  </p>
                </div>
                <Link
                  href={`/properties/${p.propertyId}`}
                  className="text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  Inspect details →
                </Link>
              </div>

              {/* Preference Alignment */}
              {p.preferenceAlignment && p.preferenceAlignment.length > 0 && (
                <div className="mt-4 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Preference Alignment
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {p.preferenceAlignment.map((align, i) => (
                      <li key={i} className="text-xs text-gray-700 dark:text-gray-300">
                        • {align}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pros & Cons */}
              <div className="mt-5 space-y-4 flex-1">
                {/* Advantages */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Potential Advantages
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {p.pros.map((pro, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <span className="mt-0.5 font-bold text-emerald-500">+</span>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Considerations */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    Factors to Consider / Trade-offs
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {p.cons.map((con, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <span className="mt-0.5 font-bold text-amber-500">−</span>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Trade-off summary */}
              {p.tradeoffs && p.tradeoffs.length > 0 && (
                <div className="mt-5 border-t border-gray-100 pt-3 dark:border-gray-800">
                  <p className="text-xs leading-5 text-gray-500 dark:text-gray-400 italic">
                    &quot;{p.tradeoffs[0]}&quot;
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-wrap gap-3 pt-2">
        <Link
          href="/compare"
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          View side-by-side factor table →
        </Link>
        <Link
          href="/copilot"
          className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        >
          Ask Copilot follow-up questions
        </Link>
      </div>
    </div>
  );
}
