'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { demoProperties, demoSaved } from '@/lib/demo-data';
import {
  SearchIcon,
  CompareIcon,
  DocumentIcon,
  UsersIcon,
  ChevronRightIcon,
  HomeIcon,
} from '@/components/icons';


const money = (v: number) => `₹${new Intl.NumberFormat('en-IN').format(v)}`;

export default function DashboardOverview() {
  const [properties, setProperties] = useState<any[]>(demoProperties);
  const [savedList, setSavedList] = useState<any[]>(demoSaved);
  const [agreements, setAgreements] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [propsRes, savedRes, agreementsRes] = await Promise.all([
          fetch('/api/properties').catch(() => null),
          fetch('/api/saved').catch(() => null),
          fetch('/api/agreements').catch(() => null),
        ]);

        if (propsRes && propsRes.ok) {
          const propsData = await propsRes.json();
          if (propsData.properties?.length > 0) setProperties(propsData.properties);
        }

        if (savedRes && savedRes.ok) {
          const savedData = await savedRes.json();
          if (savedData.savedProperties) setSavedList(savedData.savedProperties);
        }

        if (agreementsRes && agreementsRes.ok) {
          const agreementsData = await agreementsRes.json();
          if (agreementsData.agreements) setAgreements(agreementsData.agreements);
        }
      } catch (e) {
        console.error('Error fetching dashboard summary:', e);
      }
    }

    loadDashboardData();
  }, []);


  const shortlisted = savedList.filter((s) => s.isShortlisted);
  const topProperty =
    shortlisted[0]?.property || savedList[0]?.property || properties[0] || demoProperties[0];

  const monthlyEst =
    topProperty.costBreakdown?.estimatedMonthlyCost ||
    topProperty.cost?.estimatedMonthlyCost ||
    topProperty.rent + 4000;

  const moveInEst =
    topProperty.costBreakdown?.initialMoveInCost ||
    topProperty.cost?.initialMoveInCost ||
    topProperty.rent * 3;

  const agreementAlertsCount =
    agreements.length > 0
      ? agreements.reduce((acc, a) => acc + (a.flaggedClauses?.length || 0), 0)
      : 2;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Welcome to Rentwise
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Make your next rental decision clearer.
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-gray-500 dark:text-gray-400">
            Compare true recurring monthly expenses, inspect lease clauses, and find compatible roommates.
          </p>
        </div>
        <Link
          href="/discover"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <SearchIcon className="h-4 w-4" /> Browse {properties.length} properties
        </Link>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Saved homes"
          value={String(savedList.length)}
          detail={`${shortlisted.length} shortlisted for comparison`}
          color="emerald"
        />
        <MetricCard
          label="Estimated monthly"
          value={`≈ ${money(monthlyEst)}`}
          detail={`For ${topProperty.title.slice(0, 22)}...`}
          color="blue"
        />
        <MetricCard
          label="Move-in cash"
          value={money(moveInEst)}
          detail="Deposit + brokerage + first rent"
          color="amber"
        />
        <MetricCard
          label="Agreement alerts"
          value={`${agreementAlertsCount} items`}
          detail="Require attention before signing"
          color="red"
        />
      </div>

      {/* Shortlist preview & Cost breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Shortlist */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Shortlisted homes
              </h2>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Properties marked for detailed evaluation
              </p>
            </div>
            <Link
              href="/saved"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              View all ({savedList.length}) →
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {(shortlisted.length > 0 ? shortlisted : savedList.slice(0, 2)).map((item) => {
              const p = item.property || item;
              const costEst =
                p.costBreakdown?.estimatedMonthlyCost ||
                p.cost?.estimatedMonthlyCost ||
                p.rent + 4000;

              return (
                <div
                  key={item.id || p.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 p-3 transition hover:border-gray-200 dark:border-gray-800 dark:hover:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                      <HomeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <Link
                        href={`/properties/${p.id}`}
                        className="text-sm font-semibold text-gray-900 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400"
                      >
                        {p.title}
                      </Link>
                      <p className="text-xs text-gray-400">{p.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      ≈ {money(costEst)}/mo
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-800 flex justify-between items-center">
            <Link
              href="/compare"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              Compare side-by-side →
            </Link>
            <Link
              href="/assistant"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              Decision Assistant analysis →
            </Link>
          </div>
        </Card>

        {/* Cost breakdown spotlight */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Cost breakdown preview
              </h2>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {topProperty.title}
              </p>
            </div>
            <Link
              href={`/properties/${topProperty.id}`}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              Full breakdown →
            </Link>
          </div>

          <div className="mt-4 space-y-2">
            <CostRow
              label="Advertised base rent"
              amount={money(topProperty.rent)}
              sub="Landlord direct"
            />
            <CostRow
              label="Society maintenance"
              amount={money(topProperty.costBreakdown?.maintenance || 3000)}
              sub="Society dues"
            />
            <CostRow
              label="Utilities (power, water, net)"
              amount={money(
                (topProperty.costBreakdown?.electricity || 1500) +
                  (topProperty.costBreakdown?.water || 500) +
                  (topProperty.costBreakdown?.internet || 1000)
              )}
              sub="Estimated consumption"
            />
            <CostRow
              label="Daily commute expense"
              amount={money(topProperty.costBreakdown?.transport || 2000)}
              sub={topProperty.commute || 'Workplace commute'}
            />
            <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-sm font-bold text-gray-900 dark:border-gray-700 dark:text-white">
              <span>True monthly commitment</span>
              <span className="text-tabular text-emerald-600 dark:text-emerald-400">
                ≈ {money(monthlyEst)} / mo
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Decision Workspace Quick Links */}
      <div>
        <h2 className="mb-3 text-overline">
          Decision Intelligence Tools
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            title="Discover Homes"
            desc="Filter by budget & location"
            icon={SearchIcon}
            href="/discover"
          />
          <QuickAction
            title="Compare Shortlist"
            desc="Side-by-side trade-offs"
            icon={CompareIcon}
            href="/compare"
          />
          <QuickAction
            title="Lease Intelligence"
            desc="Upload & inspect agreements"
            icon={DocumentIcon}
            href="/agreements"
          />
          <QuickAction
            title="Roommate Fit"
            desc="Evaluate lifestyle match"
            icon={UsersIcon}
            href="/roommates"
          />
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  color,
}: {
  label: string;
  value: string;
  detail: string;
  color: 'emerald' | 'blue' | 'amber' | 'red';
}) {
  const dotColor =
    color === 'emerald'
      ? 'bg-emerald-500'
      : color === 'blue'
      ? 'bg-blue-500'
      : color === 'amber'
      ? 'bg-amber-500'
      : 'bg-red-500';

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <span className={`h-2 w-2 rounded-full ${dotColor}`} />
      </div>
      <p className="mt-1 text-2xl font-extrabold tracking-tight text-tabular text-gray-900 dark:text-white">
        {value}
      </p>
      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{detail}</p>
    </Card>
  );
}


function CostRow({
  label,
  amount,
  sub,
}: {
  label: string;
  amount: string;
  sub: string;
}) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <div>
        <p className="font-medium text-gray-700 dark:text-gray-300">{label}</p>
        <p className="text-[11px] text-gray-400">{sub}</p>
      </div>
      <p className="text-tabular font-semibold text-gray-900 dark:text-white">{amount}</p>
    </div>
  );
}

function QuickAction({
  title,
  desc,
  icon: Icon,
  href,
}: {
  title: string;
  desc: string;
  icon: any;
  href: string;
}) {
  return (
    <Link href={href} className="group">
      <Card className="flex items-center justify-between p-4 transition hover:border-emerald-300 hover:shadow-sm dark:hover:border-emerald-600">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition group-hover:bg-emerald-50 group-hover:text-emerald-700 dark:bg-gray-800 dark:text-gray-400 dark:group-hover:bg-emerald-950 dark:group-hover:text-emerald-400">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
            <p className="text-xs text-gray-400">{desc}</p>
          </div>
        </div>
        <ChevronRightIcon className="h-4 w-4 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-600" />
      </Card>
    </Link>
  );
}
