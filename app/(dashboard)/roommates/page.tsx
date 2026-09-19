'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { validateRoommatePair } from '@/lib/validations/roommate';
import { FrictionPoint } from '@/lib/ai/types';

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
  explanation?: string;
  commonPreferences: string[];
  potentialConflicts: string[];
  frictionPoints: FrictionPoint[];
  breakdown?: Record<string, number>;
}

// ----------------------------------------------------------------------
// HELPER COMPONENTS FOR ANIMATION
// ----------------------------------------------------------------------
function AnimatedNumber({ value, duration = 1000, delay = 0 }: { value: number; duration?: number; delay?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(easeOut * value));
      if (progress < 1) {
        if (typeof window !== 'undefined') {
          animationFrameId = window.requestAnimationFrame(step);
        }
      } else {
        setDisplayValue(value);
      }
    };

    const timeoutId = setTimeout(() => {
      animationFrameId = window.requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration, delay]);

  return <span>{displayValue}</span>;
}

function ScoreRing({ score, delay = 0 }: { score: number; delay?: number }) {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = show ? circumference - (score / 100) * circumference : circumference;

  return (
    <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/20 shadow-sm border border-emerald-100 dark:border-emerald-900/40">
      <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 120 120">
        <circle
          className="text-emerald-100 dark:text-emerald-900/40"
          strokeWidth="8"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
        />
        <circle
          className="text-emerald-500 transition-all ease-out"
          style={{ 
            transitionDuration: '1000ms',
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset 
          }}
          strokeWidth="8"
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
        />
      </svg>
      <div className="relative text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 flex items-baseline">
        <AnimatedNumber value={score} duration={1000} delay={delay} />
        <span className="text-xl">%</span>
      </div>
    </div>
  );
}
// ----------------------------------------------------------------------


export default function RoommatesPage() {
  const [profileA, setProfileA] = useState<Record<string, string>>(defaultProfileA);
  const [profileB, setProfileB] = useState<Record<string, string>>(defaultProfileB);
  const [result, setResult] = useState<CompatibilityData | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);

  // Trigger animations shortly after result mounts
  useEffect(() => {
    if (result) {
      setShowAnimation(false);
      const frame1 = typeof window !== 'undefined' ? window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setShowAnimation(true);
        });
      }) : 0;
      return () => {
        if (typeof window !== 'undefined' && frame1) window.cancelAnimationFrame(frame1);
      };
    } else {
      setShowAnimation(false);
    }
  }, [result]);

  const handleEvaluate = async () => {
    setErrorMsg(null);
    setResult(null); // Clear to trigger loading state and reset animations

    // Validate both profiles client-side using shared validation rules
    const validation = validateRoommatePair(profileA, profileB);
    if (!validation.isValid) {
      setErrorMsg(validation.error || "Profiles are incomplete. They must contain all required preferences.");
      return;
    }

    setIsEvaluating(true);

    try {
      const res = await fetch("/api/roommates/compatibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        throw new Error(err?.error || "Failed to evaluate roommate compatibility");
      }

      const data = await res.json();
      setResult({
        score: data.score,
        explanation: data.explanation || "",
        commonPreferences: data.commonPreferences || [],
        potentialConflicts: data.potentialConflicts || [],
        frictionPoints: data.frictionPoints || [],
        breakdown: data.breakdown,
      });
    } catch (err: any) {
      console.error("Roommate compatibility call failed:", err);
      // Removed the static demo fallback to ensure no 82% demo results are shown
      setResult(null);
      setErrorMsg(err.message || "Unable to evaluate compatibility. Please try again.");
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
        <h1 className="mt-1 text-xl font-bold tracking-tight text-gray-900 dark:text-white">
          Practical fit, explained clearly.
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-gray-500 dark:text-gray-400">
          Evaluates lifestyle friction points and alignments across 10 concrete dimensions.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile A */}
        <Card className="p-5 sm:p-6 shadow-sm border-gray-100 dark:border-gray-800/60 transition-colors">
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
            Your preferences (Profile A)
          </h2>
          <div className="space-y-3">
            {preferenceDimensions.map((dim) => (
              <div key={dim.key}>
                <label className="mb-1 block text-[13px] font-medium text-gray-500 dark:text-gray-400">
                  {dim.label}
                </label>
                {dim.type === "input" ? (
                  <input
                    type={dim.key === "budget" ? "number" : "text"}
                    min={dim.key === "budget" ? "1000" : undefined}
                    max={dim.key === "budget" ? "10000000" : undefined}
                    step={dim.key === "budget" ? "500" : undefined}
                    value={profileA[dim.key] || ""}
                    onChange={(e) =>
                      setProfileA((p) => ({ ...p, [dim.key]: e.target.value }))
                    }
                    className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm transition-colors hover:border-emerald-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-emerald-700 dark:focus:border-emerald-500"
                    placeholder={dim.placeholder}
                  />
                ) : (
                  <select
                    value={profileA[dim.key] || ""}
                    onChange={(e) =>
                      setProfileA((p) => ({ ...p, [dim.key]: e.target.value }))
                    }
                    className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm transition-colors hover:border-emerald-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-emerald-700 dark:focus:border-emerald-500"
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
        <Card className="p-5 sm:p-6 shadow-sm border-gray-100 dark:border-gray-800/60 transition-colors">
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
            Potential roommate (Profile B)
          </h2>
          <div className="space-y-3">
            {preferenceDimensions.map((dim) => (
              <div key={dim.key}>
                <label className="mb-1 block text-[13px] font-medium text-gray-500 dark:text-gray-400">
                  {dim.label}
                </label>
                {dim.type === "input" ? (
                  <input
                    type={dim.key === "budget" ? "number" : "text"}
                    min={dim.key === "budget" ? "1000" : undefined}
                    max={dim.key === "budget" ? "10000000" : undefined}
                    step={dim.key === "budget" ? "500" : undefined}
                    value={profileB[dim.key] || ""}
                    onChange={(e) =>
                      setProfileB((p) => ({ ...p, [dim.key]: e.target.value }))
                    }
                    className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm transition-colors hover:border-emerald-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-emerald-700 dark:focus:border-emerald-500"
                    placeholder={dim.placeholder}
                  />
                ) : (
                  <select
                    value={profileB[dim.key] || ""}
                    onChange={(e) =>
                      setProfileB((p) => ({ ...p, [dim.key]: e.target.value }))
                    }
                    className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm transition-colors hover:border-emerald-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-emerald-700 dark:focus:border-emerald-500"
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
          className="rounded-xl bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-emerald-700 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none"
        >
          {isEvaluating ? "Evaluating with Backend Intelligence..." : "Evaluate compatibility →"}
        </button>
      </div>

      {errorMsg && (
        <p className="text-center text-xs text-rose-500 font-medium bg-rose-50 dark:bg-rose-950/30 py-2 rounded-lg transition-all">{errorMsg}</p>
      )}

      {/* Loading Skeleton */}
      {isEvaluating && (
        <Card className="p-5 sm:p-7 border-emerald-100 dark:border-emerald-900/30 shadow-sm animate-pulse">
          <div className="h-5 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-8"></div>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            <div className="h-28 w-28 bg-gray-200 dark:bg-gray-800 rounded-full shrink-0"></div>
            <div className="flex-1 w-full space-y-4 mt-2 sm:mt-0">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-3 w-28 bg-gray-200 dark:bg-gray-800 rounded"></div>
                  <div className="h-2 flex-1 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Compatibility Result */}
      {result && !isEvaluating && (
        <Card className={`p-5 sm:p-7 border-emerald-200/60 dark:border-emerald-800/40 shadow-md transition-all duration-500 ease-out transform ${showAnimation ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]"}`}>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Compatibility evaluation
          </h2>

          <div className="mt-6 flex flex-col sm:flex-row items-center sm:items-start gap-8">
            {/* Score circle */}
            <div className="flex flex-col items-center justify-center sm:min-w-[140px] shrink-0">
              <ScoreRing score={result.score} delay={200} />
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Fit Score
              </p>
            </div>

            {/* Compatibility by category graph */}
            {result.breakdown && (
              <div className="flex-1 w-full rounded-xl bg-gray-50/50 p-4 sm:p-5 border border-gray-100 dark:bg-gray-800/30 dark:border-gray-800/60 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-4">
                  Compatibility by category
                </p>
                <div className="space-y-2">
                  {[
                    { key: "budget", label: "Budget" },
                    { key: "sleepSchedule", label: "Sleep schedule" },
                    { key: "workStudySchedule", label: "Work/study schedule" },
                    { key: "cleanliness", label: "Cleanliness" },
                    { key: "noiseTolerance", label: "Noise tolerance" },
                    { key: "guestPreferences", label: "Guest preferences" },
                    { key: "smoking", label: "Smoking" },
                    { key: "foodPreferences", label: "Food preferences" },
                    { key: "pets", label: "Pets" },
                    { key: "socialPreferences", label: "Social preferences" },
                  ].map((cat, idx) => {
                    const score = result.breakdown![cat.key] ?? 0;
                    const delayMs = 150 + idx * 50;
                    return (
                      <div key={cat.key} className="group flex items-center text-[13px] px-2 py-1.5 -mx-2 rounded-md transition-colors hover:bg-white dark:hover:bg-gray-700/40 hover:shadow-sm cursor-default" title={`${cat.label} Compatibility: ${score}%`}>
                        <div className="w-36 font-medium text-gray-600 dark:text-gray-400 truncate pr-3 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                          {cat.label}
                        </div>
                        <div className="flex-1 flex items-center gap-3">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                            <div 
                              className={`h-full rounded-full transition-all ease-out ${score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-rose-500"}`}
                              style={{ 
                                width: showAnimation ? `${score}%` : "0%", 
                                transitionDuration: "800ms",
                                transitionDelay: `${delayMs}ms`
                              }}
                            />
                          </div>
                          <div className="w-9 text-right font-medium text-gray-700 dark:text-gray-300">
                            {showAnimation ? <AnimatedNumber value={score} duration={800} delay={delayMs} /> : 0}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Structured Alignments (compact, no narrative) */}
          {result.commonPreferences && result.commonPreferences.length > 0 && (
            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-3">
                Areas of Alignment ({result.commonPreferences.length})
              </p>
              <div className="flex flex-wrap gap-2.5">
                {result.commonPreferences.map((align, idx) => {
                  const delayMs = 300 + idx * 50;
                  return (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[13px] font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 shadow-sm transition-all ease-out hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 ${
                        showAnimation ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                      }`}
                      style={{ transitionDuration: "400ms", transitionDelay: `${delayMs}ms` }}
                    >
                      <span className="text-emerald-500 font-bold">✓</span> {align}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Potential Friction Points Section */}
          <div className="mt-8 border-t border-gray-100 pt-6 dark:border-gray-800/60">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-400 mb-4">
              Potential Friction Points {result.frictionPoints && result.frictionPoints.length > 0 ? `(${result.frictionPoints.length})` : ""}
            </h3>

            {result.frictionPoints && result.frictionPoints.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {result.frictionPoints.map((fp, idx) => {
                  const delayMs = 400 + idx * 75;
                  return (
                    <div
                      key={idx}
                      className={`rounded-xl border border-amber-200/70 bg-amber-50/30 p-4 dark:border-amber-900/40 dark:bg-amber-950/20 shadow-sm transition-all ease-out hover:-translate-y-1 hover:shadow-md hover:border-amber-300 dark:hover:border-amber-800 ${
                        showAnimation ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                      }`}
                      style={{ transitionDuration: "500ms", transitionDelay: `${delayMs}ms` }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[13px] text-gray-900 dark:text-white flex items-center gap-1.5">
                          <span className="text-amber-500">⚠</span> {fp.category}
                        </span>
                        {fp.severity && (
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm ${
                            fp.severity === "HIGH" 
                              ? "bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900"
                              : "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900"
                          }`}>
                            {fp.severity}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 space-y-1.5 text-[13px] text-gray-700 dark:text-gray-300">
                        <div className="flex items-start gap-1.5">
                          <span className="font-medium text-gray-500 dark:text-gray-400 min-w-[70px]">Person A:</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{fp.personA}</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="font-medium text-gray-500 dark:text-gray-400 min-w-[70px]">Person B:</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{fp.personB}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 transition-all duration-500 ease-out ${showAnimation ? "opacity-100" : "opacity-0"}`}>
                <span>✓</span>
                <span className="font-medium">No major friction points identified.</span>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
