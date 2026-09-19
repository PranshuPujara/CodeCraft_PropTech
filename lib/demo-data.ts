import { calculateFullCostBreakdown } from './cost';
import type {
  AgreementRecord,
  PropertyCostResponse,
  PropertyRecord,
  SavedPropertyRecord,
} from './api-types';

export const demoProperties: Array<PropertyRecord & { cost: PropertyCostResponse }> = [
  {
    id: 'indiranagar-2bhk', title: 'Modern 2BHK in Heart of Indiranagar', location: 'Indiranagar, Bangalore', rent: 32000, deposit: 150000, brokerage: 16000, furnishing: 'Semi-Furnished', bedrooms: 2, bathrooms: 2, commute: '22 min to Koramangala Tech Park', amenities: ['Power Backup', 'Security', 'Parking', 'Balcony', 'Wi-fi'], description: 'A well-ventilated 2BHK close to 100ft Road with a modular kitchen and covered parking.',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80',
    cost: calculateFullCostBreakdown({ rent: 32000, deposit: 150000, brokerage: 16000, maintenance: 3000, electricity: 1500, water: 500, internet: 1000, transport: 2000, otherRecurring: 500 }, 35000) as PropertyCostResponse,
  },
  {
    id: 'koramangala-loft', title: 'Stylish 2BHK Loft with Workstations', location: 'Koramangala 1st Block, Bangalore', rent: 38000, deposit: 190000, brokerage: 19000, furnishing: 'Furnished', bedrooms: 2, bathrooms: 2, commute: '9 min to Koramangala Tech Park', amenities: ['Wi-fi', 'Power Backup', 'Security', 'Parking', 'Gym'], description: 'Designed for remote professionals with dual workstations and fibre internet.',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80',
    cost: calculateFullCostBreakdown({ rent: 38000, deposit: 190000, brokerage: 19000, maintenance: 3200, electricity: 2200, water: 600, internet: 1500, transport: 1200, otherRecurring: 500 }, 35000) as PropertyCostResponse,
  },
  {
    id: 'jayanagar-2bhk', title: 'Sunny 2BHK Apartment near Metro', location: 'Jayanagar 4th Block, Bangalore', rent: 30000, deposit: 150000, brokerage: 15000, furnishing: 'Semi-Furnished', bedrooms: 2, bathrooms: 2, commute: '31 min to Koramangala Tech Park', amenities: ['Security', 'Parking', 'Balcony', 'Power Backup'], description: 'Bright east-facing apartment, five minutes from Jayanagar Metro.',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80',
    cost: calculateFullCostBreakdown({ rent: 30000, deposit: 150000, brokerage: 15000, maintenance: 2200, electricity: 1300, water: 500, internet: 1000, transport: 1000, otherRecurring: 400 }, 35000) as PropertyCostResponse,
  },
  {
    id: 'hsr-studio', title: 'Cozy 1BHK Studio near HSR Layout', location: 'HSR Layout, Bangalore', rent: 22000, deposit: 80000, brokerage: 11000, furnishing: 'Furnished', bedrooms: 1, bathrooms: 1, commute: '18 min to Koramangala Tech Park', amenities: ['Wi-fi', 'Power Backup', 'Security', 'Balcony'], description: 'A compact furnished 1BHK with a work desk and high-speed fibre internet.',
    image: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=1000&q=80',
    cost: calculateFullCostBreakdown({ rent: 22000, deposit: 80000, brokerage: 11000, maintenance: 1500, electricity: 1000, water: 400, internet: 800, transport: 1200, otherRecurring: 300 }, 35000) as PropertyCostResponse,
  },
];

export const demoSaved: SavedPropertyRecord[] = demoProperties.slice(0, 3).map((property, index) => ({
  id: `saved-${property.id}`,
  property,
  isShortlisted: index < 2,
}));

export const demoAgreement: AgreementRecord = {
  id: 'agreement-1', fileName: 'Indiranagar-rental-agreement.pdf', uploadedAt: '2026-09-18', propertyId: 'indiranagar-2bhk',
  extractedFields: {
    rent: { value: 32000, found: true, clauseSnippet: 'Monthly rent shall be INR 32,000.' }, deposit: { value: 150000, found: true, clauseSnippet: 'Refundable security deposit of INR 1,50,000.' }, leaseDuration: { value: '11 months', found: true }, lockInPeriod: { value: '6 months', found: true }, noticePeriod: { value: '2 months', found: true }, rentEscalation: { value: '5% at renewal', found: true }, maintenanceResponsibility: { value: 'Tenant pays monthly society maintenance', found: true }, utilityResponsibility: { value: 'Tenant pays electricity, water and internet', found: true }, penalties: { value: null, found: false }, terminationConditions: { value: 'Written notice after lock-in period', found: true }, summary: 'The agreement states an 11-month tenancy with a six-month lock-in. Rent is ₹32,000 per month, with a refundable ₹1,50,000 deposit. Utilities and society maintenance are paid by the tenant.',
  },
  flaggedClauses: [
    { clause: 'Six-month lock-in period', attentionLevel: 'high', reason: 'Leaving before six months may have a financial implication. Consider clarifying what happens if your plans change.' },
    { clause: '5% rent escalation at renewal', attentionLevel: 'medium', reason: 'This sets an expected increase if you renew; factor it into a longer-term budget.' },
  ],
};
