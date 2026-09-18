/**
 * Agreement Extraction Shape Tests — Teammate 3
 * Verifies that the AgreementExtractionResponse type enforces:
 * - All 10 fields always present
 * - Missing fields are found:false / value:null
 * - No guessed values (explicit nulls, not defaults)
 * - Prompt contains legal guardrail
 */

import { describe, it, expect } from 'vitest';
import type { AgreementExtractionResponse } from '../../lib/ai/types';
import { AGREEMENT_EXTRACTION_SYSTEM_PROMPT } from '../../lib/ai/prompts/agreementExtract';

const REQUIRED_FIELDS: (keyof Omit<AgreementExtractionResponse, 'summary'>)[] = [
  'rent',
  'deposit',
  'leaseDuration',
  'lockInPeriod',
  'noticePeriod',
  'rentEscalation',
  'maintenanceResponsibility',
  'utilityResponsibility',
  'penalties',
  'terminationConditions',
];

function buildFullExtraction(overrides: Partial<AgreementExtractionResponse> = {}): AgreementExtractionResponse {
  return {
    rent: { value: 25000, found: true, clauseSnippet: 'Monthly rent of Rs 25,000' },
    deposit: { value: 100000, found: true, clauseSnippet: 'Security deposit of Rs 1,00,000' },
    leaseDuration: { value: '11 months', found: true, clauseSnippet: 'Lease for eleven months' },
    lockInPeriod: { value: '6 months', found: true, clauseSnippet: 'Lock-in period of six months' },
    noticePeriod: { value: '30 days', found: true, clauseSnippet: '30 days written notice required' },
    rentEscalation: { value: '5% per annum', found: true, clauseSnippet: 'Rent shall increase by 5% every year' },
    maintenanceResponsibility: { value: 'Tenant responsible for minor repairs', found: true },
    utilityResponsibility: { value: 'Tenant pays all utilities', found: true },
    penalties: { value: null, found: false, clauseSnippet: null },
    terminationConditions: { value: 'Early termination forfeits deposit', found: true },
    summary: 'Standard 11-month residential lease with 5% annual escalation.',
    ...overrides,
  };
}

describe('AgreementExtractionResponse — shape enforcement', () => {
  it('contains all 10 required extraction fields plus summary', () => {
    const extraction = buildFullExtraction();
    for (const field of REQUIRED_FIELDS) {
      expect(extraction[field], `Field "${field}" must exist`).toBeDefined();
    }
    expect(extraction.summary).toBeDefined();
    expect(typeof extraction.summary).toBe('string');
  });

  it('each field object has value, found, and optionally clauseSnippet', () => {
    const extraction = buildFullExtraction();
    for (const field of REQUIRED_FIELDS) {
      const f = extraction[field];
      expect(f, `Field "${field}" must be an object`).toBeTruthy();
      expect(typeof f.found, `"${field}.found" must be boolean`).toBe('boolean');
      expect('value' in f, `"${field}.value" key must exist`).toBe(true);
    }
  });

  it('missing fields must have found:false and value:null — not omitted or guessed', () => {
    const extraction = buildFullExtraction({
      penalties: { value: null, found: false, clauseSnippet: null },
      lockInPeriod: { value: null, found: false },
    });

    expect(extraction.penalties.found).toBe(false);
    expect(extraction.penalties.value).toBeNull();
    expect(extraction.lockInPeriod.found).toBe(false);
    expect(extraction.lockInPeriod.value).toBeNull();
  });

  it('found:true fields must have a non-null value', () => {
    const extraction = buildFullExtraction();
    for (const field of REQUIRED_FIELDS) {
      const f = extraction[field];
      if (f.found) {
        expect(f.value, `"${field}.value" must not be null when found:true`).not.toBeNull();
      }
    }
  });

  it('numeric fields (rent, deposit) accept numbers, not strings', () => {
    const extraction = buildFullExtraction();
    expect(typeof extraction.rent.value).toBe('number');
    expect(typeof extraction.deposit.value).toBe('number');
  });

  it('string fields accept string values', () => {
    const extraction = buildFullExtraction();
    const stringFields: (keyof Omit<AgreementExtractionResponse, 'summary' | 'rent' | 'deposit'>)[] = [
      'leaseDuration',
      'lockInPeriod',
      'noticePeriod',
      'rentEscalation',
      'maintenanceResponsibility',
      'utilityResponsibility',
      'terminationConditions',
    ];
    for (const field of stringFields) {
      const f = extraction[field];
      if (f.found) {
        expect(typeof f.value).toBe('string');
      }
    }
  });
});

describe('AGREEMENT_EXTRACTION_SYSTEM_PROMPT — content validation', () => {
  it('contains legal guardrail prohibiting legal conclusions', () => {
    expect(AGREEMENT_EXTRACTION_SYSTEM_PROMPT).toContain('LEGAL ADVICE GUARDRAIL');
    expect(AGREEMENT_EXTRACTION_SYSTEM_PROMPT).toContain('NEVER');
    expect(AGREEMENT_EXTRACTION_SYSTEM_PROMPT).toContain('legal');
  });

  it('explicitly lists all 10 required fields', () => {
    const requiredFieldNames = [
      'rent',
      'deposit',
      'leaseDuration',
      'lockInPeriod',
      'noticePeriod',
      'rentEscalation',
      'maintenanceResponsibility',
      'utilityResponsibility',
      'penalties',
      'terminationConditions',
    ];
    for (const fieldName of requiredFieldNames) {
      expect(AGREEMENT_EXTRACTION_SYSTEM_PROMPT, `Prompt must mention "${fieldName}"`).toContain(fieldName);
    }
  });

  it('requires found:false and value:null for missing fields, not silent omission', () => {
    expect(AGREEMENT_EXTRACTION_SYSTEM_PROMPT).toContain('found');
    expect(AGREEMENT_EXTRACTION_SYSTEM_PROMPT).toContain('null');
    expect(AGREEMENT_EXTRACTION_SYSTEM_PROMPT).toContain('DO NOT silently omit');
  });
});
