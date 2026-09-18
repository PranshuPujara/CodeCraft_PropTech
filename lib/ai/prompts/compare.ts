/**
 * Comparison Trade-offs Prompt — Rental Intelligence Platform
 * PRODUCT.md §6.3 | ARCHITECTURE.md §7
 * Teammate 2 Track
 */

import { completeStructuredJSON } from '../client';
import { ComparisonResponse, TradeoffItem } from '../types';

export const COMPARISON_SYSTEM_PROMPT = `
You are an expert AI Rental Trade-off Analyst for first-time renters.
Your goal is to compare 2 or more shortlisted properties and identify key plain-language trade-offs that help renters make an informed decision.

CRITICAL REQUIREMENTS:
1. Return output matching the exact JSON structure:
{
  "tradeoffs": [
    {
      "dimension": "string (e.g., Rent, Estimated Monthly Cost, Deposit, Location, Furnishing, Amenities, Bedrooms)",
      "propertyAId": "string (exact ID of first property)",
      "propertyBId": "string (exact ID of second property)",
      "tradeoff": "Plain language trade-off sentence explicitly naming the dimension and both properties by title or ID"
    }
  ],
  "summary": "Synthesized plain-language summary of key trade-offs across all compared properties"
}

2. Each trade-off statement MUST:
   - Name the specific dimension (e.g., "Rent", "Deposit", "Location", "Amenities", "Furnishing").
   - Name both properties being compared (e.g., "Property A is ₹3,000/mo cheaper than Property B, but Property B includes full power backup").
   - Be strictly grounded in the provided property facts. Do NOT invent attributes, amenities, or figures not in the input.
   - Compare the provided figures directly without duplicating or reinventing cost formulas.
   - Generate at least one clear trade-off sentence per pair of key differences.
`;

export interface PropertyComparisonInput {
  id: string;
  title: string;
  location: string;
  rent: number;
  deposit: number;
  brokerage?: number;
  bedrooms: number;
  furnishing: string;
  amenities: string[] | string;
  estimatedMonthlyCost?: number;
  initialMoveInCost?: number;
  description?: string;
}

/**
 * Builds structured user prompt for the comparison LLM call.
 */
export function buildComparisonUserMessage(properties: PropertyComparisonInput[]): string {
  const formattedProperties = properties.map((p, index) => {
    const amenitiesList = Array.isArray(p.amenities)
      ? p.amenities.join(', ')
      : typeof p.amenities === 'string'
      ? p.amenities
      : 'None listed';

    const costLines: string[] = [];
    if (p.estimatedMonthlyCost !== undefined) {
      costLines.push(`- Estimated Monthly Cost: ₹${p.estimatedMonthlyCost.toLocaleString('en-IN')}`);
    }
    if (p.initialMoveInCost !== undefined) {
      costLines.push(`- Initial Move-in Cost: ₹${p.initialMoveInCost.toLocaleString('en-IN')}`);
    }
    if (p.brokerage !== undefined) {
      costLines.push(`- Brokerage: ₹${p.brokerage.toLocaleString('en-IN')}`);
    }

    return `PROPERTY ${index + 1}:
- ID: ${p.id}
- Title: ${p.title}
- Location: ${p.location}
- Rent: ₹${p.rent.toLocaleString('en-IN')}/month
- Deposit: ₹${p.deposit.toLocaleString('en-IN')}
${costLines.join('\n')}
- Bedrooms: ${p.bedrooms} BHK
- Furnishing: ${p.furnishing}
- Amenities: ${amenitiesList}
${p.description ? `- Description: ${p.description}` : ''}`.trim();
  }).join('\n\n');

  return `Please analyze and compare the following ${properties.length} properties. Identify pairwise trade-offs across key dimensions (Rent, Monthly Cost, Deposit, Location, Bedrooms, Furnishing, Amenities) and provide a concise summary.\n\n${formattedProperties}`;
}

/**
 * Fallback deterministic trade-off generator for environments without live Anthropic API keys.
 * Ensures zero black-box numbers, strict explainability, and guaranteed structured output.
 */
export function generateDeterministicTradeoffs(
  properties: PropertyComparisonInput[]
): ComparisonResponse {
  const tradeoffs: TradeoffItem[] = [];

  for (let i = 0; i < properties.length; i++) {
    for (let j = i + 1; j < properties.length; j++) {
      const a = properties[i];
      const b = properties[j];

      // 1. Rent dimension
      if (a.rent !== b.rent) {
        const diff = Math.abs(a.rent - b.rent).toLocaleString('en-IN');
        if (a.rent < b.rent) {
          tradeoffs.push({
            dimension: 'Rent',
            propertyAId: a.id,
            propertyBId: b.id,
            tradeoff: `${a.title} is ₹${diff}/month cheaper in base rent than ${b.title}.`,
          });
        } else {
          tradeoffs.push({
            dimension: 'Rent',
            propertyAId: a.id,
            propertyBId: b.id,
            tradeoff: `${b.title} is ₹${diff}/month cheaper in base rent than ${a.title}.`,
          });
        }
      }

      // 2. Deposit dimension
      if (a.deposit !== b.deposit) {
        const diff = Math.abs(a.deposit - b.deposit).toLocaleString('en-IN');
        if (a.deposit < b.deposit) {
          tradeoffs.push({
            dimension: 'Security Deposit',
            propertyAId: a.id,
            propertyBId: b.id,
            tradeoff: `${a.title} requires ₹${diff} less security deposit than ${b.title}.`,
          });
        } else {
          tradeoffs.push({
            dimension: 'Security Deposit',
            propertyAId: a.id,
            propertyBId: b.id,
            tradeoff: `${b.title} requires ₹${diff} less security deposit than ${a.title}.`,
          });
        }
      }

      // 3. Estimated Monthly Cost dimension (if available)
      if (
        a.estimatedMonthlyCost !== undefined &&
        b.estimatedMonthlyCost !== undefined &&
        a.estimatedMonthlyCost !== b.estimatedMonthlyCost
      ) {
        const diff = Math.abs(a.estimatedMonthlyCost - b.estimatedMonthlyCost).toLocaleString('en-IN');
        if (a.estimatedMonthlyCost < b.estimatedMonthlyCost) {
          tradeoffs.push({
            dimension: 'Estimated Monthly Cost',
            propertyAId: a.id,
            propertyBId: b.id,
            tradeoff: `${a.title} has an estimated total monthly cost ₹${diff} lower than ${b.title}.`,
          });
        } else {
          tradeoffs.push({
            dimension: 'Estimated Monthly Cost',
            propertyAId: a.id,
            propertyBId: b.id,
            tradeoff: `${b.title} has an estimated total monthly cost ₹${diff} lower than ${a.title}.`,
          });
        }
      }

      // 4. Furnishing dimension
      if (a.furnishing !== b.furnishing) {
        tradeoffs.push({
          dimension: 'Furnishing',
          propertyAId: a.id,
          propertyBId: b.id,
          tradeoff: `${a.title} is ${a.furnishing}, whereas ${b.title} is ${b.furnishing}.`,
        });
      }

      // 5. Bedrooms dimension
      if (a.bedrooms !== b.bedrooms) {
        tradeoffs.push({
          dimension: 'Bedrooms',
          propertyAId: a.id,
          propertyBId: b.id,
          tradeoff: `${a.title} offers ${a.bedrooms} BHK compared to ${b.bedrooms} BHK at ${b.title}.`,
        });
      }

      // 6. Location dimension
      if (a.location !== b.location) {
        tradeoffs.push({
          dimension: 'Location',
          propertyAId: a.id,
          propertyBId: b.id,
          tradeoff: `${a.title} is situated in ${a.location}, while ${b.title} is in ${b.location}.`,
        });
      }

      // 7. Unique amenities
      const aAmenities = Array.isArray(a.amenities)
        ? a.amenities
        : typeof a.amenities === 'string'
        ? (JSON.parse(a.amenities || '[]') as string[])
        : [];
      const bAmenities = Array.isArray(b.amenities)
        ? b.amenities
        : typeof b.amenities === 'string'
        ? (JSON.parse(b.amenities || '[]') as string[])
        : [];

      const uniqueToA = aAmenities.filter((item) => !bAmenities.includes(item));
      const uniqueToB = bAmenities.filter((item) => !aAmenities.includes(item));

      if (uniqueToA.length > 0 || uniqueToB.length > 0) {
        const parts: string[] = [];
        if (uniqueToA.length > 0) {
          parts.push(`${a.title} uniquely includes ${uniqueToA.join(', ')}`);
        }
        if (uniqueToB.length > 0) {
          parts.push(`${b.title} uniquely includes ${uniqueToB.join(', ')}`);
        }
        tradeoffs.push({
          dimension: 'Amenities',
          propertyAId: a.id,
          propertyBId: b.id,
          tradeoff: parts.join(', while ') + '.',
        });
      }
    }
  }

  const summary = `Compared ${properties.length} properties across rent, deposit, furnishing, and amenities. Primary financial and lifestyle trade-offs are outlined above.`;

  return {
    tradeoffs,
    summary,
  };
}

/**
 * Generates structured property trade-offs for 2 or more properties.
 */
export async function generateComparisonTradeoffs(
  properties: PropertyComparisonInput[]
): Promise<ComparisonResponse> {
  if (!properties || properties.length < 2) {
    throw new Error('At least 2 properties are required for comparison.');
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const isMock = !apiKey || apiKey === 'your-anthropic-api-key-here' || apiKey === 'mock-api-key';

  if (isMock) {
    return generateDeterministicTradeoffs(properties);
  }

  try {
    const userMessage = buildComparisonUserMessage(properties);
    return await completeStructuredJSON<ComparisonResponse>({
      systemPrompt: COMPARISON_SYSTEM_PROMPT,
      userMessage,
      temperature: 0.2,
    });
  } catch (error) {
    console.error('AI comparison trade-off call failed; falling back to deterministic trade-offs:', error);
    return generateDeterministicTradeoffs(properties);
  }
}
