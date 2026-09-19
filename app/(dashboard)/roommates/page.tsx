'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { validateRoommatePair } from '@/lib/validations/roommate';

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
    key: 'foodPreferences',
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
    key: 'socialPreferences',
    label: 'Social preferences',
    type: 'select',
    options: ['Very social', 'Friendly but private', 'Mostly keep to myself'],
  },
];

const defaultProfileA = {
  budget: '18000',
  sleepSchedule: 'Night owl (12 AM – 8 AM)',
  workSchedule: '9 to 5 Office',
  cleanliness: 'Very neat',
  noiseTolerance: 'Low — need quiet',
  guests: 'Occasional weekends',
  smoking: 'Non-smoker',
  foodPreferences: 'Vegetarian',
  food: 'Vegetarian',
  pets: 'No pets',
  socialPreferences: 'Friendly but private',
  social: 'Friendly but private',
};

const defaultProfileB = {
  budget: '18000',
  sleepSchedule: 'Early bird (10 PM – 6 AM)',
  workSchedule: 'Remote/WFH',
  cleanliness: 'Very neat',
  noiseTolerance: 'Medium',
  guests: 'Frequent guests welcome',
  smoking: 'Non-smoker',
  foodPreferences: 'Non-vegetarian',
  food: 'Non-vegetarian',
  pets: 'No pets',
  socialPreferences: 'Friendly but private',
  social: 'Friendly but private',
};

interface CompatibilityData {
  score: number;
  explanation: string;
  commonPreferences: string[];
  potentialConflicts: string[];
}

export default function RoommatesPage() {
  const [profileA, setProfileA] = useState<Record<string, string>>(defaultProfileA);
  const [profileB, setProfileB] = useState<Record<string, string>>(defaultProfileB);
  const [result, setResult] = useState<CompatibilityData | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleEvaluate = async () => {
    setErrorMsg(null);

    // Validate both profiles client-side using shared validation rules
    const validation = validateRoommatePair(profileA, profileB);
    if (!validation.isValid) {
      setErrorMsg(validation.error || 'Profiles are incomplete. They must contain all required preferences.');
      return;
    }

    setIsEvaluating(true);

    try {
      const res = await fetch('/api/roommates/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileA: {
            ...validation.profileA,
            // also include common aliases for seamless compatibility
            workStudySchedule: validation.profileA?.workSchedule,
            guestPreferences: validation.profileA?.guests,
            food: validation.profileA?.foodPreferences,
            social: validation.profileA?.socialPreferences,
          },
          profileB: {
            ...validation.profileB,
            // also include common aliases for seamless compatibility
            workStudySchedule: validation.profileB?.workSchedule,
            guestPreferences: validation.profileB?.guests,
            food: validation.profileB?.foodPreferences,
            social: validation.profileB?.socialPreferences,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Failed to evaluate roommate compatibility');
      }

      const data = await res.json();
      setResult({
        score: data.score,
        explanation: data.explanation,
        commonPreferences: data.commonPreferences || [],
        potentialConflicts: data.potentialConflicts || [],
      });
    } catch (err: any) {
      console.error('Roommate compatibility call failed:', err);
      // Removed the static demo fallback to ensure no 82% demo results are shown
      setResult(null);
      setErrorMsg(err.message || 'Unable to evaluate compatibility. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

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
          Evaluates lifestyle friction points and alignments across 10 concrete dimensions.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile A */}
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">
            Your preferences (Profile A)
          </h2>
          <div className="space-y-3">
            {preferenceDimensions.map((dim) => (
              <div key={dim.key}>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  {dim.label}
                </label>
                {dim.type === 'input' ? (
                  <input
                    type={dim.key === 'budget' ? 'number' : 'text'}
                    min={dim.key === 'budget' ? '1000' : undefined}
                    max={dim.key === 'budget' ? '10000000' : undefined}
                    step={dim.key === 'budget' ? '500' : undefined}
                    value={profileA[dim.key] || ''}
                    onChange={(e) =>
                      setProfileA((p) => ({ ...p, [dim.key]: e.target.value }))
                    }
                    className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    placeholder={dim.placeholder}
                  />
                ) : (
                  <select
                    value={profileA[dim.key] || ''}
                    onChange={(e) =>
                      setProfileA((p) => ({ ...p, [dim.key]: e.target.value }))
                    }
                    className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  >
                    {dim.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
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
            Potential roommate (Profile B)
          </h2>
          <div className="space-y-3">
            {preferenceDimensions.map((dim) => (
              <div key={dim.key}>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  {dim.label}
                </label>
                {dim.type === 'input' ? (
                  <input
                    type={dim.key === 'budget' ? 'number' : 'text'}
                    min={dim.key === 'budget' ? '1000' : undefined}
                    max={dim.key === 'budget' ? '10000000' : undefined}
                    step={dim.key === 'budget' ? '500' : undefined}
                    value={profileB[dim.key] || ''}
                    onChange={(e) =>
                      setProfileB((p) => ({ ...p, [dim.key]: e.target.value }))
                    }
                    className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    placeholder={dim.placeholder}
                  />
                ) : (
                  <select
                    value={profileB[dim.key] || ''}
                    onChange={(e) =>
                      setProfileB((p) => ({ ...p, [dim.key]: e.target.value }))
                    }
                    className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  >
                    {dim.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Evaluate Button */}
      <div className="flex justify-center">
        <button
          onClick={handleEvaluate}
          disabled={isEvaluating}
          className="rounded-xl bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {isEvaluating ? 'Evaluating with Backend Intelligence...' : 'Evaluate compatibility →'}
        </button>
      </div>

      {errorMsg && (
        <p className="text-center text-xs text-red-500">{errorMsg}</p>
      )}

      {/* Compatibility Result */}
      {result && (
        <Card className="p-5 sm:p-6 border-emerald-200 dark:border-emerald-800/40">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Compatibility evaluation
          </h2>

          <div className="mt-5 grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
            {/* Score circle */}
            <div className="flex flex-col items-center">
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-emerald-500 bg-emerald-50 text-3xl font-extrabold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                {result.score}%
              </div>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Fit Score
              </p>
            </div>

            {/* Hard rule: The score is NEVER rendered without its explanation next to it */}
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Narrative Analysis
              </p>
              <p className="mt-1 text-sm leading-6 text-gray-700 dark:text-gray-300">
                {result.explanation}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 border-t border-gray-100 pt-5 dark:border-gray-800 md:grid-cols-2">
            {/* Common */}
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                Key Alignments ({result.commonPreferences.length})
              </p>
              <ul className="mt-2 space-y-1.5">
                {result.commonPreferences.map((c) => (
                  <li
                    key={c}
                    className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <span className="mt-0.5 text-emerald-500">✓</span> {c}
                  </li>
                ))}
              </ul>
            </div>

            {/* Conflicts */}
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Potential Friction Points ({result.potentialConflicts.length})
              </p>
              <ul className="mt-2 space-y-1.5">
                {result.potentialConflicts.map((c) => (
                  <li
                    key={c}
                    className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <span className="mt-0.5 text-amber-500">!</span> {c}
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
