'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { demoAgreement } from '@/lib/demo-data';
import {
  UploadIcon,
  DocumentIcon,
  SparklesIcon,
  ChevronDownIcon,
} from '@/components/icons';

const formatCompactCurrency = (v: any) => {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'number') {
    if (v >= 100000) {
      const lakhs = v / 100000;
      return `₹${lakhs % 1 === 0 ? lakhs : lakhs.toFixed(1)}L`;
    }
    if (v >= 1000) {
      const k = v / 1000;
      return `₹${k % 1 === 0 ? k : k.toFixed(0)}K`;
    }
    return `₹${v.toLocaleString('en-IN')}`;
  }
  return String(v);
};

const formatFullCurrency = (v: any) => {
  if (v === null || v === undefined || v === '') return 'Not found';
  if (typeof v === 'number') {
    return `₹${new Intl.NumberFormat('en-IN').format(v)}`;
  }
  return String(v);
};

const formatCompactDuration = (v: any, fallback = 'None') => {
  if (v === null || v === undefined || v === '') return fallback;
  const str = String(v).trim();
  return str
    .replace(/months?/i, 'mo')
    .replace(/years?/i, 'yr')
    .replace(/days?/i, 'd');
};

const cleanFirstSentence = (text: string): string => {
  if (!text) return '';
  const match = text.match(/^.*?[.!?](?:\s|$)/);
  return (match ? match[0] : text).trim();
};

export default function AgreementsPage() {
  const [agreement, setAgreement] = useState<any>(demoAgreement);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [showAllAttention, setShowAllAttention] = useState(false);
  const [showExtractedDetails, setShowExtractedDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadLatestAgreement() {
      try {
        const res = await fetch('/api/agreements');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.agreements) && data.agreements.length > 0) {
            setAgreement(data.agreements[0]);
          }
        }
      } catch {
        // Keep demoAgreement as fallback
      }
    }
    loadLatestAgreement();
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Invalid file type. Please upload a PDF document (.pdf).');
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size <= 0) {
      setUploadError('The selected file is empty. Please choose a valid PDF.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setUploadError('File size exceeds 5MB limit. Please choose a smaller file.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/agreements', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to process agreement PDF');
      }

      const newAgreement = await res.json();
      let extracted = newAgreement.extractedFields;
      let flagged = newAgreement.flaggedClauses;
      if (typeof extracted === 'string') extracted = JSON.parse(extracted);
      if (typeof flagged === 'string') flagged = JSON.parse(flagged);

      setAgreement({
        id: newAgreement.id,
        fileName: newAgreement.fileName,
        uploadedAt: new Date(newAgreement.uploadedAt || Date.now()).toLocaleDateString(),
        extractedFields: extracted,
        summary: newAgreement.summary,
        flaggedClauses: flagged,
      });
      setShowUploadZone(false);
    } catch (err: any) {
      console.error('Error uploading agreement:', err);
      setUploadError(err.message || 'Error parsing agreement PDF');
    } finally {
      setIsUploading(false);
    }
  };

  const fields = agreement?.extractedFields || demoAgreement.extractedFields;
  const flaggedClauses = agreement?.flaggedClauses || demoAgreement.flaggedClauses || [];

  // Sort flagged clauses: high -> medium -> low
  const priorityMap: Record<string, number> = { high: 1, medium: 2, low: 3 };
  const sortedFlags = [...flaggedClauses].sort((a: any, b: any) => {
    const pA = priorityMap[a.attentionLevel?.toLowerCase()] || 4;
    const pB = priorityMap[b.attentionLevel?.toLowerCase()] || 4;
    return pA - pB;
  });

  const displayedFlags = showAllAttention ? sortedFlags : sortedFlags.slice(0, 3);
  const plainSummary = agreement?.summary || fields?.summary || null;

  // Key-value terms for grid
  const keyTerms = [
    {
      label: 'Monthly rent',
      value: fields?.rent?.found ? formatFullCurrency(fields.rent.value) : 'Not found',
      found: fields?.rent?.found,
      snippet: fields?.rent?.clauseSnippet,
    },
    {
      label: 'Security deposit',
      value: fields?.deposit?.found ? formatFullCurrency(fields.deposit.value) : 'Not found',
      found: fields?.deposit?.found,
      snippet: fields?.deposit?.clauseSnippet,
    },
    {
      label: 'Lease duration',
      value: fields?.leaseDuration?.found ? String(fields.leaseDuration.value) : 'Not found',
      found: fields?.leaseDuration?.found,
      snippet: fields?.leaseDuration?.clauseSnippet,
    },
    {
      label: 'Lock-in period',
      value: fields?.lockInPeriod?.found ? String(fields.lockInPeriod.value) : 'None stated',
      found: fields?.lockInPeriod?.found,
      snippet: fields?.lockInPeriod?.clauseSnippet,
    },
    {
      label: 'Notice period',
      value: fields?.noticePeriod?.found ? String(fields.noticePeriod.value) : 'Not found',
      found: fields?.noticePeriod?.found,
      snippet: fields?.noticePeriod?.clauseSnippet,
    },
    {
      label: 'Rent escalation',
      value: fields?.rentEscalation?.found ? String(fields.rentEscalation.value) : 'None stated',
      found: fields?.rentEscalation?.found,
      snippet: fields?.rentEscalation?.clauseSnippet,
    },
    {
      label: 'Maintenance',
      value: fields?.maintenanceResponsibility?.found ? String(fields.maintenanceResponsibility.value) : 'Not found',
      found: fields?.maintenanceResponsibility?.found,
      snippet: fields?.maintenanceResponsibility?.clauseSnippet,
    },
    {
      label: 'Utilities',
      value: fields?.utilityResponsibility?.found ? String(fields.utilityResponsibility.value) : 'Not found',
      found: fields?.utilityResponsibility?.found,
      snippet: fields?.utilityResponsibility?.clauseSnippet,
    },
    {
      label: 'Penalties',
      value: fields?.penalties?.found ? String(fields.penalties.value) : 'None specified',
      found: fields?.penalties?.found,
      snippet: fields?.penalties?.clauseSnippet,
    },
    {
      label: 'Termination conditions',
      value: fields?.terminationConditions?.found ? String(fields.terminationConditions.value) : 'Standard notice',
      found: fields?.terminationConditions?.found,
      snippet: fields?.terminationConditions?.clauseSnippet,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* 1. HEADER */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Agreement Intelligence
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Understand what your agreement states.
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Essential lease terms and potential attention points extracted from your PDF.
            </p>
          </div>

          <button
            onClick={() => setShowUploadZone(!showUploadZone)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750"
          >
            <UploadIcon className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
            {showUploadZone ? 'Close upload' : 'Upload different PDF'}
          </button>
        </div>

        {/* Compact Legal Disclaimer */}
        <div className="flex items-center gap-2 rounded-lg border border-amber-200/70 bg-amber-50/50 px-3 py-2 text-xs leading-normal text-amber-900 dark:border-amber-800/30 dark:bg-amber-950/20 dark:text-amber-300">
          <span className="font-semibold shrink-0">Informational only:</span>
          <span>
            Not legal advice. This analysis explains what the agreement states; it does not assess enforceability or predict legal outcomes.
          </span>
        </div>
      </div>

      {/* UPLOAD / RE-UPLOAD ZONE (Toggled or if no agreement) */}
      {(showUploadZone || !agreement) && (
        <Card className="p-5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
            }}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
            }}
            className="cursor-pointer flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50/70 py-8 text-center transition hover:border-emerald-500 hover:bg-emerald-50/20 dark:border-gray-700 dark:bg-gray-800/40 dark:hover:border-emerald-500"
          >
            <UploadIcon className="h-7 w-7 text-gray-400 dark:text-gray-500" />
            <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {isUploading ? 'Extracting and analyzing clauses...' : 'Drop your agreement PDF here or click to browse'}
            </p>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              PDF format only · up to 5MB
            </p>
          </div>

          {uploadError && (
            <p className="mt-2 text-center text-xs font-medium text-rose-600 dark:text-rose-400">
              {uploadError}
            </p>
          )}
        </Card>
      )}

      {/* ACTIVE FILE INDICATOR */}
      {agreement && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200/80 bg-gray-50/60 px-4 py-2.5 dark:border-gray-800 dark:bg-gray-900/40">
          <div className="flex items-center gap-2.5 truncate">
            <DocumentIcon className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="truncate text-xs font-medium text-gray-900 dark:text-white">
              {agreement.fileName || 'Rental Agreement'}
            </span>
            <span className="hidden text-xs text-gray-400 sm:inline">·</span>
            <span className="hidden text-xs text-gray-500 dark:text-gray-400 sm:inline">
              Analyzed {agreement.uploadedAt || 'Recently'}
            </span>
          </div>
          <Badge tone="green" className="shrink-0 text-[10px]">
            Verified Analysis
          </Badge>
        </div>
      )}

      {/* 2. AGREEMENT SUMMARY / HERO METRICS */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Monthly rent
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {fields?.rent?.found ? formatCompactCurrency(fields.rent.value) : '—'}
          </p>
          <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
            {fields?.rent?.found ? 'Base rent / mo' : 'Not stated'}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Security deposit
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {fields?.deposit?.found ? formatCompactCurrency(fields.deposit.value) : '—'}
          </p>
          <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
            {fields?.deposit?.found ? 'Refundable deposit' : 'Not stated'}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Lease
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {fields?.leaseDuration?.found ? formatCompactDuration(fields.leaseDuration.value) : '—'}
          </p>
          <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
            Tenancy period
          </p>
        </div>

        <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Lock-in
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {fields?.lockInPeriod?.found ? formatCompactDuration(fields.lockInPeriod.value) : 'None'}
          </p>
          <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
            Minimum commitment
          </p>
        </div>

        <div className="col-span-2 rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm sm:col-span-1 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Notice
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {fields?.noticePeriod?.found ? formatCompactDuration(fields.noticePeriod.value) : '—'}
          </p>
          <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
            Prior to vacate
          </p>
        </div>
      </div>

      {/* 3. WORTH YOUR ATTENTION (Visual Focal Point) */}
      {sortedFlags.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white">
                Worth your attention
              </h2>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                {sortedFlags.length} points
              </span>
            </div>
            {sortedFlags.length > 3 && (
              <button
                onClick={() => setShowAllAttention(!showAllAttention)}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                {showAllAttention
                  ? 'Show fewer attention points ↑'
                  : `View all attention points (${sortedFlags.length}) →`}
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {displayedFlags.map((flag: any, idx: number) => {
              const level = flag.attentionLevel?.toLowerCase() || 'medium';
              const tone = level === 'high' ? 'red' : level === 'medium' ? 'amber' : 'neutral';
              return (
                <div
                  key={idx}
                  className="flex flex-col gap-1 rounded-xl border border-gray-200/80 bg-white p-3.5 shadow-sm transition hover:border-gray-300 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Badge tone={tone} className="shrink-0 uppercase font-bold text-[10px] tracking-wide">
                      {level}
                    </Badge>
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {flag.clause}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 sm:max-w-md sm:text-right">
                    {cleanFirstSentence(flag.reason)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. AI SUMMARY */}
      {plainSummary && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 dark:border-emerald-950/50 dark:bg-emerald-950/15">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
            <SparklesIcon className="h-4 w-4 shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              AI Summary
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            {plainSummary}
          </p>
        </div>
      )}

      {/* 5. KEY TERMS (Compact Grid of Key-Value Cards) */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white">
          Key terms overview
        </h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {keyTerms.map((term, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-gray-200/80 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 truncate">
                {term.label}
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-gray-900 dark:text-white">
                {term.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 6. DETAILED TERMS (Expandable Accordion) */}
      <div className="rounded-xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <button
          onClick={() => setShowExtractedDetails(!showExtractedDetails)}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800/40 rounded-xl"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-900 dark:text-white">
              View extracted details
            </span>
            <span className="text-xs text-gray-400">
              ({keyTerms.length} clauses analyzed)
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <span>{showExtractedDetails ? 'Hide details' : 'Show details'}</span>
            <ChevronDownIcon
              className={`h-4 w-4 transition-transform duration-200 ${
                showExtractedDetails ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {showExtractedDetails && (
          <div className="border-t border-gray-100 divide-y divide-gray-100 px-4 dark:border-gray-800 dark:divide-gray-800">
            {keyTerms.map((term, idx) => (
              <div key={idx} className="py-3 sm:flex sm:items-start sm:justify-between sm:gap-4">
                <div className="sm:w-1/3">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">
                    {term.label}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {term.value}
                  </p>
                </div>
                <div className="mt-1 sm:mt-0 sm:w-2/3 sm:text-right">
                  {term.snippet ? (
                    <p className="text-xs italic text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg sm:inline-block text-left">
                      &quot;{term.snippet}&quot;
                    </p>
                  ) : (
                    <span className="text-xs text-gray-400 italic">
                      No verbatim snippet matched
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
