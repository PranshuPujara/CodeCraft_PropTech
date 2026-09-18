'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { demoProperties, demoSaved, demoAgreement } from '@/lib/demo-data';
import {
  SearchIcon,
  CompareIcon,
  DocumentIcon,
  UsersIcon,
  ChatIcon,
  SparklesIcon,
  ChevronRightIcon,
  HomeIcon,
} from '@/components/icons';

const money = (v: number) => `₹${new Intl.NumberFormat('en-IN').format(v)}`;

const topProperty = demoProperties[0];
const shortlisted = demoSaved.filter((s) => s.isShortlisted);

export default function DashboardOverview() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Welcome back
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Make your next rental decision clearer.
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            See the complete cost, compare trade-offs, and understand the terms
            before you commit.
          </p>
        </div>
        <Link
          href="/discover"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <SearchIcon className="h-4 w-4" /> Browse properties
        </Link>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Saved homes"
          value={String(demoSaved.length)}
          detail={`${shortlisted.length} ready to compare`}
          color="emerald"
        />
        <MetricCard
          label="Monthly estimate"
          value={money(topProperty.cost.estimatedMonthlyCost)}
          detail="For your first choice"
          color="blue"
        />
        <MetricCard
          label="Move-in to plan"
          value={money(topProperty.cost.initialMoveInCost)}
          detail="Deposit + brokerage + rent"
          color="amber"
        />
        <MetricCard
          label="Agreement alerts"
          value={`${demoAgreement.flaggedClauses.length} items`}
          detail="Worth your attention"
          color="red"
        />
      </div>

      {/* Shortlist + Cost breakdown */}
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        {/* Shortlist */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Your shortlist
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {shortlisted.length} homes, ready to compare.
              </p>
            </div>
            <Link
              href="/compare"
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              Compare →
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {shortlisted.map((saved) => {
              const prop = saved.property as typeof demoProperties[number];
              return (
                <Link
                  href={`/properties/${prop.id}`}
                  key={saved.id}
                  className="flex items-center gap-4 rounded-xl border border-gray-100 p-3 transition hover:border-emerald-200 hover:bg-emerald-50/50 dark:border-gray-700 dark:hover:border-emerald-800 dark:hover:bg-emerald-900/10"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                    <HomeIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {prop.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {prop.commute}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      ≈ {money(prop.cost.estimatedMonthlyCost)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      / month
                    </p>
                  </div>
                  <Badge tone="green" className="hidden sm:inline-flex">
                    Shortlisted
                  </Badge>
                  <ChevronRightIcon className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                </Link>
              );
            })}
          </div>
        </Card>

        {/* Cost breakdown */}
        <Card className="p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                True monthly cost
              </h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {topProperty.title}
              </p>
            </div>
            <Badge tone="blue">Estimated</Badge>
          </div>

          <div className="space-y-2.5">
            {[
              topProperty.cost.rent,
              topProperty.cost.maintenance,
              topProperty.cost.electricity,
              topProperty.cost.water,
              topProperty.cost.internet,
              topProperty.cost.transport,
              topProperty.cost.otherRecurring,
            ].map((item) => (
              <div
                className="flex justify-between text-sm"
                key={item.label}
              >
                <span className="text-gray-600 dark:text-gray-400">
                  {item.label}
                  {item.isEstimated && (
                    <span className="ml-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                      est.
                    </span>
                  )}
                </span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {money(item.value)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-900 dark:text-white">
                Estimated total
              </span>
              <span className="font-bold text-gray-900 dark:text-white">
                {money(topProperty.cost.estimatedMonthlyCost)}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
              {topProperty.cost.affordability.formattedSignal}.{' '}
              {topProperty.cost.affordability.explanation}
            </p>
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="p-5 sm:p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          Decision workspace
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Continue from the insight you need most.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <ActionCard
            title="Compare properties"
            detail="Side-by-side trade-offs"
            href="/compare"
            icon={<CompareIcon className="h-5 w-5" />}
          />
          <ActionCard
            title="Review agreement"
            detail={`${demoAgreement.flaggedClauses.length} clauses worth attention`}
            href="/agreements"
            icon={<DocumentIcon className="h-5 w-5" />}
          />
          <ActionCard
            title="Check roommate fit"
            detail="Practical preferences, explained"
            href="/roommates"
            icon={<UsersIcon className="h-5 w-5" />}
          />
          <ActionCard
            title="Get recommendations"
            detail="Properties matched to your needs"
            href="/recommendations"
            icon={<SparklesIcon className="h-5 w-5" />}
          />
          <ActionCard
            title="Decision assistant"
            detail="Synthesized shortlist analysis"
            href="/assistant"
            icon={<CompareIcon className="h-5 w-5" />}
          />
          <ActionCard
            title="Ask Rental Copilot"
            detail="Grounded in your rental data"
            href="/copilot"
            icon={<ChatIcon className="h-5 w-5" />}
          />
        </div>
      </Card>
    </div>
  );
}

/* ──── Sub-components ──── */

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
  const iconBg: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',
  };

  return (
    <Card className="p-4 sm:p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg[color]}`}>
        <span className="text-lg font-bold">{value.charAt(0) === '₹' ? '₹' : '#'}</span>
      </div>
      <p className="mt-4 text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{detail}</p>
    </Card>
  );
}

function ActionCard({
  title,
  detail,
  href,
  icon,
}: {
  title: string;
  detail: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-gray-700 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/10"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition group-hover:bg-emerald-100 group-hover:text-emerald-600 dark:bg-gray-800 dark:text-gray-400 dark:group-hover:bg-emerald-900/40 dark:group-hover:text-emerald-300">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-gray-900 dark:text-white">
          {title}
          <span className="ml-1 text-emerald-600 opacity-0 transition group-hover:opacity-100 dark:text-emerald-400">
            →
          </span>
        </p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {detail}
        </p>
      </div>
    </Link>
  );
}
