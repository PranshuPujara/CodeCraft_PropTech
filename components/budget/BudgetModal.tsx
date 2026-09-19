'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { CloseIcon } from '@/components/icons';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESETS = [
  { label: '₹20K', value: 20000 },
  { label: '₹25K', value: 25000 },
  { label: '₹35K', value: 35000 },
  { label: '₹45K', value: 45000 },
  { label: '₹60K', value: 60000 },
  { label: '₹80K', value: 80000 },
  { label: '₹1L', value: 100000 },
];

export default function BudgetModal({ isOpen, onClose }: BudgetModalProps) {
  const { budget, updateBudget } = useUser();
  const [selectedBudget, setSelectedBudget] = useState<number>(budget || 35000);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedBudget(budget || 35000);
    }
  }, [isOpen, budget]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (selectedBudget <= 0 || selectedBudget > 10000000) return;
    setIsSaving(true);
    await updateBudget(selectedBudget);
    setIsSaving(false);
    onClose();
  };

  const adjustBudget = (delta: number) => {
    setSelectedBudget((prev) => {
      const next = Math.max(5000, Math.min(500000, prev + delta));
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          aria-label="Close modal"
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        {/* Header */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Target Budget
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Set your monthly budget
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Rental affordability scores, trade-off comparisons, and recommendations benchmark against this figure.
          </p>
        </div>

        {/* Hero Budget Display with Stepper */}
        <div className="mt-6 flex flex-col items-center rounded-xl border border-gray-100 bg-gray-50/70 p-5 dark:border-gray-800/80 dark:bg-gray-800/40">
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
            Monthly Target
          </span>
          <div className="mt-1 flex items-center gap-3">
            <button
              type="button"
              onClick={() => adjustBudget(-5000)}
              disabled={selectedBudget <= 5000}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-base font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95 disabled:opacity-30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              title="Decrease by ₹5,000"
            >
              −
            </button>

            <span className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              ₹{new Intl.NumberFormat('en-IN').format(selectedBudget)}
            </span>

            <button
              type="button"
              onClick={() => adjustBudget(5000)}
              disabled={selectedBudget >= 500000}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-base font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95 disabled:opacity-30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              title="Increase by ₹5,000"
            >
              +
            </button>
          </div>
          <span className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            Adjust with buttons, slider, or presets below
          </span>
        </div>

        {/* Range Slider */}
        <div className="mt-6 space-y-2">
          <input
            type="range"
            min="10000"
            max="150000"
            step="2500"
            value={Math.min(selectedBudget, 150000)}
            onChange={(e) => setSelectedBudget(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-emerald-600 dark:bg-gray-700"
          />
          <div className="flex justify-between text-[11px] font-medium text-gray-400">
            <span>₹10,000</span>
            <span>₹50,000</span>
            <span>₹1,00,000</span>
            <span>₹1,50,000+</span>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
            Quick presets
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setSelectedBudget(preset.value)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition active:scale-95 ${
                  selectedBudget === preset.value
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Exact Input */}
        <div className="mt-5">
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Or enter exact amount (₹)
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-semibold text-gray-400">
              ₹
            </span>
            <input
              type="number"
              min="5000"
              max="10000000"
              step="500"
              value={selectedBudget}
              onChange={(e) => setSelectedBudget(Math.max(0, Number(e.target.value)))}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-sm font-semibold text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="35000"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || selectedBudget <= 0}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {isSaving ? 'Updating...' : 'Save Budget'}
          </button>
        </div>
      </div>
    </div>
  );
}
