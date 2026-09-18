import { describe, it, expect } from 'vitest';
import { anthropic, DEFAULT_MODEL } from '../../lib/ai/client';
import {
  LEGAL_GUARDRAIL_DISCLAIMER,
  AgreementExtractionResponse,
  AgreementFlagsResponse,
  RoommateCompatibilityResponse,
  RecommendationResponse,
} from '../../lib/ai/types';
import { RECOMMENDATION_SYSTEM_PROMPT } from '../../lib/ai/prompts/recommend';
import { COMPARISON_SYSTEM_PROMPT } from '../../lib/ai/prompts/compare';
import { AGREEMENT_EXTRACTION_SYSTEM_PROMPT } from '../../lib/ai/prompts/agreementExtract';
import { AGREEMENT_FLAGS_SYSTEM_PROMPT } from '../../lib/ai/prompts/agreementFlags';
import { ROOMMATE_COMPATIBILITY_SYSTEM_PROMPT } from '../../lib/ai/prompts/compatibility';
import { DECISION_ASSISTANT_SYSTEM_PROMPT } from '../../lib/ai/prompts/decisionAssistant';
import { COPILOT_SYSTEM_PROMPT } from '../../lib/ai/prompts/copilot';

describe('Shared AI Foundation (lib/ai)', () => {
  it('exports single Anthropic client instance and default model', () => {
    expect(anthropic).toBeDefined();
    expect(DEFAULT_MODEL).toBe('claude-3-5-sonnet-20241022');
  });

  it('contains mandatory legal advice guardrail disclaimer', () => {
    expect(LEGAL_GUARDRAIL_DISCLAIMER).toContain('informational summary and clause explanations only');
    expect(LEGAL_GUARDRAIL_DISCLAIMER).toContain('not legal advice');
  });

  it('enforces legal advice guardrail in agreement prompt templates', () => {
    expect(AGREEMENT_EXTRACTION_SYSTEM_PROMPT).toContain('LEGAL ADVICE GUARDRAIL');
    expect(AGREEMENT_EXTRACTION_SYSTEM_PROMPT).toContain('NEVER state whether a clause is legal, illegal, or enforceable');
    
    expect(AGREEMENT_FLAGS_SYSTEM_PROMPT).toContain('BINDING LEGAL ADVICE GUARDRAIL');
    expect(AGREEMENT_FLAGS_SYSTEM_PROMPT).toContain('NEVER tell the user whether they should or should not sign');
  });

  it('ensures explainability requirement is built into recommendation and compatibility prompts', () => {
    expect(RECOMMENDATION_SYSTEM_PROMPT).toContain('MUST reference specific matched attributes');
    expect(ROOMMATE_COMPATIBILITY_SYSTEM_PROMPT).toContain('score MUST NEVER be returned without an accompanying explanation string');
  });

  it('validates agreement extraction structure includes all 10 required fields', () => {
    const dummyExtraction: AgreementExtractionResponse = {
      rent: { value: 30000, found: true, clauseSnippet: 'Monthly rent shall be Rs 30,000' },
      deposit: { value: 150000, found: true },
      leaseDuration: { value: '11 months', found: true },
      lockInPeriod: { value: '6 months', found: true },
      noticePeriod: { value: '1 month', found: true },
      rentEscalation: { value: '5% annually', found: true },
      maintenanceResponsibility: { value: 'Tenant', found: true },
      utilityResponsibility: { value: 'Tenant', found: true },
      penalties: { value: null, found: false },
      terminationConditions: { value: 'Written notice of 30 days', found: true },
      summary: 'Standard 11-month lease agreement',
    };

    expect(dummyExtraction.rent.found).toBe(true);
    expect(dummyExtraction.penalties.found).toBe(false);
    expect(dummyExtraction.penalties.value).toBeNull();
  });
});
