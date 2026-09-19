import type {
  AgreementExtractionResponse,
  AgreementFlagsResponse,
  ComparisonResponse,
  CopilotResponse,
  DecisionAssistantResponse,
  FrictionPoint,
  RecommendationResponse,
  RoommateCompatibilityResponse,
} from './ai/types';
import type { AffordabilityResult, CostCalculationResult } from './cost';

export type { FrictionPoint };

export interface PropertyRecord {
  id: string;
  title: string;
  location: string;
  rent: number;
  deposit: number;
  brokerage: number;
  furnishing: string;
  amenities: string[];
  bedrooms: number;
  bathrooms?: number;
  description: string;
  commute?: string;
  image?: string;
}

export interface SavedPropertyRecord {
  id: string;
  property: PropertyRecord;
  isShortlisted: boolean;
}

export interface AgreementRecord {
  id: string;
  fileName: string;
  uploadedAt: string;
  propertyId: string | null;
  extractedFields: AgreementExtractionResponse;
  flaggedClauses: AgreementFlagsResponse['flaggedClauses'];
}

export interface PropertyCostResponse extends CostCalculationResult {
  affordability: AffordabilityResult;
}

export interface PropertiesResponse {
  properties: PropertyRecord[];
}

export interface SavedPropertiesResponse {
  savedProperties: SavedPropertyRecord[];
}

export interface CompareResponse extends ComparisonResponse {
  properties: Array<PropertyRecord & { cost: PropertyCostResponse }>;
}

export interface RecommendationsApiResponse extends RecommendationResponse {
  properties: PropertyRecord[];
}

export type AgreementApiResponse = AgreementRecord;
export type RoommateCompatibilityApiResponse = RoommateCompatibilityResponse;
export type DecisionAssistantApiResponse = DecisionAssistantResponse;
export type CopilotApiResponse = CopilotResponse;
