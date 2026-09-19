/**
 * Shared AI Types — Rental Intelligence Platform
 * ARCHITECTURE.md §7 structured JSON output definitions
 */

// 1. Property Recommendations (§PRODUCT 6.4)
export interface RecommendedPropertyItem {
  propertyId: string;
  rank: number;
  matchScore: number; // 0-100
  reason: string;     // Must reference specific matched attributes (e.g. budget, amenities)
}

export interface RecommendationResponse {
  recommendations: RecommendedPropertyItem[];
  summaryExplanation: string;
}

// 2. Property Comparison (§PRODUCT 6.3)
export interface TradeoffItem {
  dimension: string;     // e.g. "Rent", "Commute Distance", "Deposit"
  propertyAId: string;
  propertyBId: string;
  tradeoff: string;      // Plain language trade-off sentence naming specific dimension & both properties
}

export interface ComparisonResponse {
  tradeoffs: TradeoffItem[];
  summary: string;
}

// 3. Agreement Extraction (§PRODUCT 6.5)
export interface ExtractedField<T = string | number> {
  value: T | null;
  found: boolean;
  clauseSnippet?: string | null;
}

export interface AgreementExtractionResponse {
  rent: ExtractedField<number>;
  deposit: ExtractedField<number>;
  leaseDuration: ExtractedField<string>;
  lockInPeriod: ExtractedField<string>;
  noticePeriod: ExtractedField<string>;
  rentEscalation: ExtractedField<string>;
  maintenanceResponsibility: ExtractedField<string>;
  utilityResponsibility: ExtractedField<string>;
  penalties: ExtractedField<string>;
  terminationConditions: ExtractedField<string>;
  summary: string;
}

// 4. Agreement Clause Flags (§PRODUCT 6.6)
export interface FlaggedClauseItem {
  clause: string;
  reason: string; // Plain-language explanation of why it deserves attention (strictly informational)
  attentionLevel: 'high' | 'medium' | 'low';
}

export interface AgreementFlagsResponse {
  flaggedClauses: FlaggedClauseItem[];
  disclaimer: string; // Mandatory legal advice guardrail disclaimer
}

export interface FrictionPoint {
  category: string;
  personA: string;
  personB: string;
  severity?: 'HIGH' | 'MEDIUM' | 'LOW';
}

// 5. Roommate Compatibility (§PRODUCT 6.7)
export interface RoommateCompatibilityResponse {
  commonPreferences: string[];
  potentialConflicts: string[];
  frictionPoints?: FrictionPoint[];
  breakdown?: Record<string, number>; // Category-level scores (0-100)
  explanation: string; // Score is never returned without explanation (Principle 2)
  score: number;       // 0 - 100
}

// 6. Decision Assistant (§PRODUCT 6.8)
export interface PropertyProCon {
  propertyId: string;
  propertyName?: string;
  pros: string[];
  cons: string[];
  preferenceAlignment?: string[];
  tradeoffs?: string[];
}

export interface DecisionAssistantPropertyAnalysis {
  propertyId: string;
  propertyName: string;
  pros: string[];
  cons: string[];
  preferenceAlignment: string[];
  tradeoffs: string[];
}

export interface DecisionAssistantResponse {
  summary: string;
  narrative?: string;
  properties: DecisionAssistantPropertyAnalysis[];
  propertyProsCons?: PropertyProCon[];
  keyTradeoffs: string[];
}


// 7. AI Rental Copilot (§PRODUCT 6.9)
export interface ContextRef {
  type: 'property' | 'agreement' | 'cost' | 'roommate';
  id: string;
  name: string;
}

export interface CopilotResponse {
  answer: string;
  contextRefs: ContextRef[];
  missingDataNotice?: string;
}

/**
 * Legal Advice Guardrail Constant (PRODUCT.md §7)
 */
export const LEGAL_GUARDRAIL_DISCLAIMER =
  'This agreement analysis provides informational summary and clause explanations only, not legal advice. It does not evaluate enforceability or make legal determinations.';
