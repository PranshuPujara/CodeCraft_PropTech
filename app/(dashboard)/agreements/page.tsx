'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Disclaimer } from '@/components/ui/disclaimer';
import { demoAgreement } from '@/lib/demo-data';
import { UploadIcon, DocumentIcon } from '@/components/icons';

const money = (v: number) => `₹${new Intl.NumberFormat('en-IN').format(v)}`;

export default function AgreementsPage() {
  const [agreement, setAgreement] = useState<any>(demoAgreement);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
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
    } catch (err: any) {
      console.error('Error uploading agreement:', err);
      setUploadError(err.message || 'Error parsing agreement PDF');
    } finally {
      setIsUploading(false);
    }
  };

  const fields = agreement?.extractedFields || demoAgreement.extractedFields;
  const flaggedClauses = agreement?.flaggedClauses || demoAgreement.flaggedClauses;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Agreement intelligence
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Understand what your agreement states.
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Upload a rental agreement PDF to extract key terms and flag items worth your attention.
        </p>
      </div>

      {/* Mandatory Legal Disclaimer */}
      <Disclaimer />

      {/* Upload area */}
      <Card className="p-6">
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
          className="cursor-pointer flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-12 text-center transition hover:border-emerald-300 hover:bg-emerald-50/30 dark:border-gray-700 dark:bg-gray-800/30 dark:hover:border-emerald-700"
        >
          <UploadIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            {isUploading ? 'Extracting & analyzing agreement clauses...' : 'Drag & drop your agreement PDF here'}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            or click to browse · PDF format only
          </p>
          <button
            type="button"
            disabled={isUploading}
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {isUploading ? 'Analyzing...' : 'Select PDF file'}
          </button>
        </div>

        {uploadError && (
          <div className="mt-3 text-center text-xs text-red-600 dark:text-red-400">
            {uploadError}
          </div>
        )}

        {/* Analyzed file indicator */}
        {agreement && (
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <DocumentIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {agreement.fileName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Analyzed on {agreement.uploadedAt || 'Current Session'} · Stored in database
              </p>
            </div>
            <Badge tone="green">Analyzed</Badge>
          </div>
        )}
      </Card>

      {/* Summary */}
      {agreement?.summary && (
        <Card className="p-5 sm:p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Plain-language summary
          </h2>
          <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
            {agreement.summary}
          </p>
        </Card>
      )}

      {/* Flagged clauses */}
      {flaggedClauses && flaggedClauses.length > 0 && (
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Worth your attention
            </h2>
            <Badge tone="amber">{flaggedClauses.length} items flagged</Badge>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Informational clause breakdowns — not legal advice.
          </p>

          <div className="mt-4 space-y-3">
            {flaggedClauses.map((flag: any, index: number) => (
              <div
                key={index}
                className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800/40 dark:bg-amber-950/20"
              >
                <div className="flex items-center gap-2">
                  <Badge tone={flag.attentionLevel === 'high' ? 'red' : 'amber'}>
                    {flag.attentionLevel.toUpperCase()} ATTENTION
                  </Badge>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {flag.clause}
                  </p>
                </div>
                <p className="mt-2 text-xs leading-5 text-gray-600 dark:text-gray-400">
                  {flag.reason}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Extracted key fields */}
      <Card className="overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-5 py-3 dark:border-gray-700 dark:bg-gray-800/50">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Extracted agreement terms (10 Core Dimensions)
          </h2>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          <FieldRow
            label="Monthly rent"
            value={fields.rent?.found ? money(fields.rent.value) : 'Not found in agreement'}
            snippet={fields.rent?.clauseSnippet}
            found={fields.rent?.found}
          />
          <FieldRow
            label="Security deposit"
            value={fields.deposit?.found ? money(fields.deposit.value) : 'Not found in agreement'}
            snippet={fields.deposit?.clauseSnippet}
            found={fields.deposit?.found}
          />
          <FieldRow
            label="Lease duration"
            value={fields.leaseDuration?.found ? String(fields.leaseDuration.value) : 'Not found in agreement'}
            snippet={fields.leaseDuration?.clauseSnippet}
            found={fields.leaseDuration?.found}
          />
          <FieldRow
            label="Lock-in period"
            value={fields.lockInPeriod?.found ? String(fields.lockInPeriod.value) : 'Not found in agreement'}
            snippet={fields.lockInPeriod?.clauseSnippet}
            found={fields.lockInPeriod?.found}
          />
          <FieldRow
            label="Notice period"
            value={fields.noticePeriod?.found ? String(fields.noticePeriod.value) : 'Not found in agreement'}
            snippet={fields.noticePeriod?.clauseSnippet}
            found={fields.noticePeriod?.found}
          />
          <FieldRow
            label="Rent escalation"
            value={fields.rentEscalation?.found ? String(fields.rentEscalation.value) : 'Not found in agreement'}
            snippet={fields.rentEscalation?.clauseSnippet}
            found={fields.rentEscalation?.found}
          />
          <FieldRow
            label="Maintenance responsibility"
            value={fields.maintenanceResponsibility?.found ? String(fields.maintenanceResponsibility.value) : 'Not found in agreement'}
            snippet={fields.maintenanceResponsibility?.clauseSnippet}
            found={fields.maintenanceResponsibility?.found}
          />
          <FieldRow
            label="Utility responsibility"
            value={fields.utilityResponsibility?.found ? String(fields.utilityResponsibility.value) : 'Not found in agreement'}
            snippet={fields.utilityResponsibility?.clauseSnippet}
            found={fields.utilityResponsibility?.found}
          />
          <FieldRow
            label="Penalties"
            value={fields.penalties?.found ? String(fields.penalties.value) : 'Not found in agreement'}
            snippet={fields.penalties?.clauseSnippet}
            found={fields.penalties?.found}
          />
          <FieldRow
            label="Termination conditions"
            value={fields.terminationConditions?.found ? String(fields.terminationConditions.value) : 'Not found in agreement'}
            snippet={fields.terminationConditions?.clauseSnippet}
            found={fields.terminationConditions?.found}
          />
        </div>
      </Card>
    </div>
  );
}

function FieldRow({
  label,
  value,
  snippet,
  found,
}: {
  label: string;
  value: string;
  snippet?: string;
  found?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-start sm:justify-between">
      <div className="sm:w-1/3">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
        {snippet && (
          <p className="mt-0.5 text-xs italic text-gray-400 dark:text-gray-500">
            &quot;{snippet}&quot;
          </p>
        )}
      </div>
      <div className="sm:w-2/3 sm:text-right">
        {found === false ? (
          <span className="text-sm text-gray-400 italic">Not found in agreement</span>
        ) : (
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {value}
          </span>
        )}
      </div>
    </div>
  );
}
