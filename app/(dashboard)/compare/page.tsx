'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { demoProperties } from '@/lib/demo-data';

const money = (v: number) => `₹${new Intl.NumberFormat('en-IN').format(v)}`;

export default function ComparePage() {
  // Default to first two properties for demo
  const comparable = demoProperties.slice(0, 2);
  const lowest = [...comparable].sort(
    (a, b) => a.cost.estimatedMonthlyCost - b.cost.estimatedMonthlyCost
  )[0];
  const fastest = [...comparable].sort(
    (a, b) => parseInt(a.commute ?? '99') - parseInt(b.commute ?? '99')
  )[0];
  const costDiff = Math.abs(
    comparable[0].cost.estimatedMonthlyCost - comparable[1].cost.estimatedMonthlyCost
  );

  const rows = [
    { label: 'Rent', values: comparable.map((p) => `${money(p.rent)} / mo`) },
    { label: 'True monthly cost', values: comparable.map((p) => `≈ ${money(p.cost.estimatedMonthlyCost)}`) },
    { label: 'Move-in cost', values: comparable.map((p) => money(p.cost.initialMoveInCost)) },
    { label: 'Deposit', values: comparable.map((p) => money(p.deposit)) },
    { label: 'Commute', values: comparable.map((p) => p.commute ?? '—') },
    { label: 'Furnishing', values: comparable.map((p) => p.furnishing) },
    { label: 'Bedrooms', values: comparable.map((p) => `${p.bedrooms} BHK`) },
    { label: 'Amenities', values: comparable.map((p) => p.amenities.slice(0, 4).join(', ')) },
    {
      label: 'Affordability',
      values: comparable.map((p) => p.cost.affordability.formattedSignal),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Property comparison
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          See the trade-offs, not just the columns.
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Compare your shortlist against what matters: budget, commute, and move-in
          cash.
        </p>
      </div>

      {/* Comparison table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[640px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Decision factor
                </th>
                {comparable.map((p) => (
                  <th className="px-5 py-4" key={p.id}>
                    <Link
                      href={`/properties/${p.id}`}
                      className="font-semibold text-gray-900 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400"
                    >
                      {p.title}
                    </Link>
                    <p className="mt-0.5 text-xs font-normal text-gray-500 dark:text-gray-400">
                      {p.location}
                    </p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr
                  key={row.label}
                  className={`border-b border-gray-100 last:border-0 dark:border-gray-800 ${
                    ri % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-800/20'
                  }`}
                >
                  <td className="px-5 py-3.5 font-medium text-gray-500 dark:text-gray-400">
                    {row.label}
                  </td>
                  {row.values.map((val, vi) => {
                    // Highlight the better value for cost rows
                    const highlight =
                      row.label === 'True monthly cost' || row.label === 'Rent'
                        ? comparable[vi].cost.estimatedMonthlyCost ===
                          lowest.cost.estimatedMonthlyCost
                        : false;
                    return (
                      <td
                        key={vi}
                        className={`px-5 py-3.5 ${
                          highlight
                            ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                            : 'text-gray-800 dark:text-gray-200'
                        }`}
                      >
                        {val}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Trade-off cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-emerald-200 bg-emerald-50/50 p-5 dark:border-emerald-800/50 dark:bg-emerald-900/10">
          <Badge tone="green" className="mb-3">
            Lower monthly cost
          </Badge>
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">
            {lowest.title}
          </p>
          <p className="mt-2 text-sm leading-6 text-emerald-800 dark:text-emerald-200">
            <strong>{money(costDiff)}/month lower</strong> in estimated monthly cost
            than {comparable.find((p) => p.id !== lowest.id)?.title}. That{"'"}s{' '}
            {money(costDiff * 12)}/year in savings.
          </p>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50 p-5 dark:border-blue-800/50 dark:bg-blue-900/10">
          <Badge tone="blue" className="mb-3">
            Closer commute
          </Badge>
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">
            {fastest.title}
          </p>
          <p className="mt-2 text-sm leading-6 text-blue-800 dark:text-blue-200">
            At <strong>{fastest.commute}</strong>, this has the shorter commute.
            The convenience comes with a{' '}
            {fastest.cost.estimatedMonthlyCost > lowest.cost.estimatedMonthlyCost
              ? 'higher monthly total'
              : 'lower monthly total'}
            .
          </p>
        </Card>
      </div>

      {/* CTA */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/assistant"
          className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
        >
          Get decision assistant analysis →
        </Link>
        <Link
          href="/discover"
          className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        >
          Add more properties
        </Link>
      </div>
    </div>
  );
}
