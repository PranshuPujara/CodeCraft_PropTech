'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';

const preferenceDimensions = [
  { key: 'budget', label: 'Budget (₹/month)', type: 'input', placeholder: '18000' },
  {
    key: 'sleepSchedule',
    label: 'Sleep schedule',
    type: 'select',
    options: ['Early bird (10 PM – 6 AM)', 'Night owl (12 AM – 8 AM)', 'Flexible'],
  },
  {
    key: 'workSchedule',
    label: 'Work/study schedule',
    type: 'select',
    options: ['9 to 5 Office', 'Remote/WFH', 'Shift work', 'Student schedule'],
  },
  {
    key: 'cleanliness',
    label: 'Cleanliness',
    type: 'select',
    options: ['Very neat', 'Average', 'Relaxed'],
  },
  {
    key: 'noiseTolerance',
    label: 'Noise tolerance',
    type: 'select',
    options: ['Low — need quiet', 'Medium', 'High — music/calls fine'],
  },
  {
    key: 'guests',
    label: 'Guest preferences',
    type: 'select',
    options: ['No guests', 'Occasional weekends', 'Frequent guests welcome'],
  },
  {
    key: 'smoking',
    label: 'Smoking',
    type: 'select',
    options: ['Non-smoker', 'Smoker — outside only', 'Smoker'],
  },
  {
    key: 'food',
    label: 'Food preferences',
    type: 'select',
    options: ['Vegetarian', 'Non-vegetarian', 'Vegan', 'No preference'],
  },
  {
    key: 'pets',
    label: 'Pets',
    type: 'select',
    options: ['No pets', 'Has pet(s)', 'Pet-friendly'],
  },
  {
    key: 'social',
    label: 'Social preferences',
    type: 'select',
    options: ['Very social', 'Friendly but private', 'Mostly keep to myself'],
  },
];

const defaultProfile = {
  budget: '18000',
  sleepSchedule: 'Night owl (12 AM – 8 AM)',
  workSchedule: '9 to 5 Office',
  cleanliness: 'Very neat',
  noiseTolerance: 'Low — need quiet',
  guests: 'Occasional weekends',
  smoking: 'Non-smoker',
  food: 'Vegetarian',
  pets: 'No pets',
  social: 'Friendly but private',
};

const demoResult = {
  score: 82,
  explanation:
    'You align on budget, a quiet weeknight routine, cleanliness expectations and non-smoking. The main point to discuss is how often friends visit on weekends and cooking preferences.',
  common: [
    'Shared budget range (₹18,000 each)',
    'Similar sleep schedules',
    'Both prefer a tidy home',
    'Both are non-smokers',
    'Similar social preferences',
  ],
  conflicts: [
    'Guest frequency — one prefers occasional, the other more frequent',
    'Cooking preferences — vegetarian vs. non-vegetarian kitchen',
  ],
};

export default function RoommatesPage() {
  const [showResult, setShowResult] = useState(false);
  const [profileA] = useState(defaultProfile);
  const [profileB] = useState({
    ...defaultProfile,
    sleepSchedule: 'Early bird (10 PM – 6 AM)',
    guests: 'Frequent guests welcome',
    food: 'Non-vegetarian',
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Roommate compatibility
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Practical fit, explained clearly.
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Based on the preferences you both share — not a personality score.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile A */}
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">
            Your preferences
          </h2>
          <div className="space-y-3">
            {preferenceDimensions.map((dim) => (
              <div key={dim.key}>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  {dim.label}
                </label>
                {dim.type === 'input' ? (
                  <input
                    defaultValue={(profileA as Record<string, string>)[dim.key]}
                    className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    placeholder={dim.placeholder}
                  />
                ) : (
                  <select
                    defaultValue={(profileA as Record<string, string>)[dim.key]}
                    className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  >
                    {dim.options?.map((opt) => (
                      <option key={opt}>{opt}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Profile B */}
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">
            Roommate{"'"}s preferences
          </h2>
          <div className="space-y-3">
            {preferenceDimensions.map((dim) => (
              <div key={dim.key}>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  {dim.label}
                </label>
                {dim.type === 'input' ? (
                  <input
                    defaultValue={(profileB as Record<string, string>)[dim.key]}
                    className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    placeholder={dim.placeholder}
                  />
                ) : (
                  <select
                    defaultValue={(profileB as Record<string, string>)[dim.key]}
                    className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  >
                    {dim.options?.map((opt) => (
                      <option key={opt}>{opt}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <button
        onClick={() => setShowResult(true)}
        className="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 sm:w-auto sm:px-8 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
      >
        Check compatibility
      </button>

      {/* Results */}
      {showResult && (
        <Card className="animate-slide-up p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Compatibility overview
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                A practical {demoResult.score}/100 fit
              </p>
            </div>
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xl font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              {demoResult.score}
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-400">
            {demoResult.explanation}
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                Areas of alignment
              </p>
              <ul className="mt-2 space-y-2">
                {demoResult.common.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <span className="mt-0.5 text-emerald-500">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Potential friction
              </p>
              <ul className="mt-2 space-y-2">
                {demoResult.conflicts.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <span className="mt-0.5 text-amber-500">!</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
