'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Disclaimer } from '@/components/ui/disclaimer';
import { demoAgreement } from '@/lib/demo-data';
import { UploadIcon, DocumentIcon } from '@/components/icons';

const money = (v: number) => `₹${new Intl.NumberFormat('en-IN').format(v)}`;

export default function AgreementsPage() {
  const [showAnalysis, setShowAnalysis] = useState(true);
  const fields = demoAgreement.extractedFields;

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
          Upload a rental agreement PDF to extract key terms and flag items worth
          your attention.
        </p>
      </div>

      <Disclaimer />

      {/* Upload area */}
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-12 text-center transition hover:border-emerald-300 hover:bg-emerald-50/30 dark:border-gray-700 dark:bg-gray-800/30 dark:hover:border-emerald-700">
          <UploadIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            Drag & drop your agreement PDF here
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            or click to browse · PDF only, up to 10MB
          </p>
          <button
            onClick={() => setShowAnalysis(true)}
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Select file
          </button>
        </div>

        {/* Analyzed file indicator */}
        {showAnalysis && (
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <DocumentIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {demoAgreement.fileName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Analysed {demoAgreement.uploadedAt}
              </p>
            </div>
            <Badge tone="green">Analyzed</Badge>
          </div>
        )}
      </Card>

      {/* Analysis results */}
      {showAnalysis && (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          {/* Left — summary + extracted fields */}
          <Card className="p-5 sm:p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Agreement summary
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
              {fields.summary}
            </p>

            <h3 className="mt-6 text-sm font-semibold text-gray-900 dark:text-white">
              Extracted information
            </h3>
            <div className="mt-3 divide-y divide-gray-100 dark:divide-gray-800">
              {Object.entries(fields)
                .filter(([key]) => key !== 'summary')
                .map(([key, field]) => (
                  <div
                    className="flex gap-4 py-3 text-sm"
                    key={key}
                  >
                    <span className="w-44 shrink-0 capitalize text-gray-500 dark:text-gray-400">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {field.found ? (
                        typeof field.value === 'number' ? (
                          money(field.value)
                        ) : (
                          String(field.value)
                        )
                      ) : (
                        <span className="font-normal text-gray-400 dark:text-gray-500">
                          Not found in agreement
                        </span>
                      )}
                    </span>
                  </div>
                ))}
            </div>
          </Card>

          {/* Right — flagged clauses + explanation */}
          <div className="space-y-5">
            <Card className="p-5 sm:p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Worth your attention
              </h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Items that may be important to review or clarify
              </p>
              <div className="mt-4 space-y-4">
                {demoAgreement.flaggedClauses.map((flag) => (
                  <div
                    className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-800/50 dark:bg-amber-900/10"
                    key={flag.clause}
                  >
                    <Badge tone="amber" className="mb-2">
                      {flag.attentionLevel} attention
                    </Badge>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {flag.clause}
                    </p>
                    <p className="mt-1 text-sm leading-5 text-gray-600 dark:text-gray-400">
                      {flag.reason}
                    </p>
                    <p className="mt-2 text-[11px] italic text-gray-400 dark:text-gray-500">
                      Informational only — not legal advice.
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Clause explanation
              </h2>
              <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
                The agreement states that you may end the tenancy after the
                lock-in period by giving two months{"'"} written notice. Consider
                confirming the expected process and timing with the landlord.
              </p>
              <p className="mt-3 text-[11px] italic text-gray-400 dark:text-gray-500">
                This explanation summarises what the clause states. It is not a
                legal interpretation.
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
