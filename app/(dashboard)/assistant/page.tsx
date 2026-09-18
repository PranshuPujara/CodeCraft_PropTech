'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { demoProperties } from '@/lib/demo-data';
import { LightbulbIcon } from '@/components/icons';

const money = (v: number) => `₹${new Intl.NumberFormat('en-IN').format(v)}`;

const shortlisted = demoProperties.slice(0, 2);

const narrative = `Based on your stated budget of ₹35,000/month and your commute to Koramangala Tech Park, here is a synthesised analysis of your two shortlisted properties.

Both are 2 BHK apartments in Bangalore with similar amenity profiles (power backup, security, parking). The core trade-off is cost versus commute convenience.`;

const propertyAnalysis = [
  {
    property: shortlisted[0],
    pros: [
      'Lower estimated monthly cost (₹40,500 vs ₹47,200)',
      'Annual savings of approximately ₹80,400 compared to the alternative',
      'Well-ventilated with modular kitchen and covered parking',
      'Indiranagar location — vibrant neighbourhood with restaurants and shops',
    ],
    cons: [
      'Longer commute at 22 min vs 9 min',
      'Semi-furnished — you may need to invest in furniture',
      'No gym access on-site',
    ],
  },
  {
    property: shortlisted[1],
    pros: [
      'Much shorter commute at 9 min to your workplace',
      'Fully furnished with dual workstations and fibre internet',
      'On-site gym access',
      'Designed for remote professionals — practical work setup',
    ],
    cons: [
      'Higher estimated monthly cost at ₹47,200',
      'Represents ~135% of your stated budget — a significant stretch',
      'Higher move-in cost (₹2,47,000 vs ₹1,98,000)',
    ],
  },
];

const bottomLine = `If monthly cost discipline is the priority, the Indiranagar property is the stronger fit — it stays closer to your budget and saves approximately ₹80,000 annually. If commute time and a ready-to-work furnished setup matter more, the Koramangala loft delivers, but at a cost that notably exceeds your stated monthly budget. Neither is objectively better — the right choice depends on which trade-off you're more comfortable with.`;

export default function AssistantPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Decision assistant
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Your shortlist, weighed against your priorities.
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          A synthesised analysis — not just a table of numbers.
        </p>
      </div>

      {/* Context */}
      <Card className="flex items-center gap-3 p-4">
        <LightbulbIcon className="h-5 w-5 text-amber-500" />
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Analysing <strong className="text-gray-900 dark:text-white">{shortlisted.length} shortlisted properties</strong> against your budget of{' '}
          <strong className="text-gray-900 dark:text-white">₹35,000/month</strong>
        </div>
      </Card>

      {/* Narrative */}
      <Card className="p-5 sm:p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white">Overview</h2>
        <div className="mt-3 space-y-3">
          {narrative.split('\n\n').map((para, i) => (
            <p key={i} className="text-sm leading-6 text-gray-600 dark:text-gray-400">
              {para}
            </p>
          ))}
        </div>
      </Card>

      {/* Per-property analysis */}
      <div className="grid gap-6 lg:grid-cols-2">
        {propertyAnalysis.map(({ property, pros, cons }) => (
          <Card key={property.id} className="p-5 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <Link
                  href={`/properties/${property.id}`}
                  className="font-semibold text-gray-900 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400"
                >
                  {property.title}
                </Link>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {property.location}
                </p>
              </div>
              <Badge tone="blue">
                ≈ {money(property.cost.estimatedMonthlyCost)}/mo
              </Badge>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  Advantages
                </p>
                <ul className="mt-2 space-y-1.5">
                  {pros.map((p) => (
                    <li
                      key={p}
                      className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                    >
                      <span className="mt-0.5 text-emerald-500">+</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  Considerations
                </p>
                <ul className="mt-2 space-y-1.5">
                  {cons.map((c) => (
                    <li
                      key={c}
                      className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                    >
                      <span className="mt-0.5 text-amber-500">−</span> {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Bottom line */}
      <Card className="border-gray-300 bg-gray-50 p-5 sm:p-6 dark:border-gray-600 dark:bg-gray-800">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          The bottom line
        </h2>
        <p className="mt-3 text-sm leading-6 text-gray-700 dark:text-gray-300">
          {bottomLine}
        </p>
      </Card>

      {/* CTAs */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/copilot"
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          Ask follow-up questions →
        </Link>
        <Link
          href="/compare"
          className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        >
          View side-by-side comparison
        </Link>
      </div>
    </div>
  );
}
