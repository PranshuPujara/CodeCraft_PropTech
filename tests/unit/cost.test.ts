import { describe, it, expect } from 'vitest';
import {
  calculateEstimatedMonthlyCost,
  calculateInitialMoveInCost,
  calculateAffordabilityRatio,
  calculateFullCostBreakdown,
  CITY_DEFAULT_ESTIMATES,
  CostInput,
} from '../../lib/cost';

describe('Shared Cost Engine (lib/cost.ts)', () => {
  describe('calculateEstimatedMonthlyCost', () => {
    it('calculates monthly cost correctly with all explicit values', () => {
      const input: CostInput = {
        rent: 30000,
        deposit: 150000,
        maintenance: 3000,
        electricity: 1500,
        water: 500,
        internet: 1000,
        transport: 2000,
        otherRecurring: 500,
      };

      const result = calculateEstimatedMonthlyCost(input);
      // rent + maintenance + electricity + water + internet + transport + otherRecurring
      // 30000 + 3000 + 1500 + 500 + 1000 + 2000 + 500 = 38500
      expect(result.estimatedMonthlyCost).toBe(38500);
      expect(result.isEstimated).toBe(false);
    });

    it('uses city default estimates when optional utilities are missing and sets isEstimated to true', () => {
      const input: CostInput = {
        rent: 25000,
        deposit: 100000,
      };

      const result = calculateEstimatedMonthlyCost(input);
      const expectedTotal =
        25000 +
        CITY_DEFAULT_ESTIMATES.maintenance +
        CITY_DEFAULT_ESTIMATES.electricity +
        CITY_DEFAULT_ESTIMATES.water +
        CITY_DEFAULT_ESTIMATES.internet +
        CITY_DEFAULT_ESTIMATES.transport;

      expect(result.estimatedMonthlyCost).toBe(expectedTotal);
      expect(result.isEstimated).toBe(true);
    });
  });

  describe('calculateInitialMoveInCost', () => {
    it('calculates move-in cost correctly (deposit + brokerage + 1st month rent)', () => {
      const input: CostInput = {
        rent: 32000,
        deposit: 150000,
        brokerage: 16000,
      };

      const result = calculateInitialMoveInCost(input);
      // 150000 + 16000 + 32000 = 198000
      expect(result.initialMoveInCost).toBe(198000);
      expect(result.isEstimated).toBe(false);
    });

    it('defaults brokerage to 0 when omitted and marks isEstimated appropriately', () => {
      const input: CostInput = {
        rent: 20000,
        deposit: 80000,
      };

      const result = calculateInitialMoveInCost(input);
      // 80000 + 0 + 20000 = 100000
      expect(result.initialMoveInCost).toBe(100000);
      expect(result.isEstimated).toBe(true);
    });
  });

  describe('calculateAffordabilityRatio', () => {
    it('calculates exact ratio and formatted percentage signal for budget', () => {
      const monthlyCost = 38000;
      const budget = 100000;

      const result = calculateAffordabilityRatio(monthlyCost, budget);
      expect(result.ratio).toBe(0.38);
      expect(result.percentage).toBe(38);
      expect(result.formattedSignal).toBe('~38% of your stated budget');
      expect(result.status).toBe('stretch'); // 38% falls between 35% and 50%
      expect(result.explanation).toContain('accounts for 38% of your stated budget');
    });

    it('categorizes affordable status for <= 35%', () => {
      const result = calculateAffordabilityRatio(30000, 100000);
      expect(result.status).toBe('affordable');
      expect(result.percentage).toBe(30);
    });

    it('categorizes over_budget status for > 50%', () => {
      const result = calculateAffordabilityRatio(60000, 100000);
      expect(result.status).toBe('over_budget');
      expect(result.percentage).toBe(60);
    });
  });

  describe('calculateFullCostBreakdown', () => {
    it('produces complete itemized breakdown with explicit isEstimated tags per component', () => {
      const input: CostInput = {
        rent: 30000,
        deposit: 150000,
        maintenance: 3000,
        // missing electricity, water, internet, transport
      };

      const result = calculateFullCostBreakdown(input, 50000);

      expect(result.rent.isEstimated).toBe(false);
      expect(result.maintenance.isEstimated).toBe(false);
      expect(result.electricity.isEstimated).toBe(true);
      expect(result.water.isEstimated).toBe(true);
      expect(result.isAnyEstimated).toBe(true);
      expect(result.affordability).toBeDefined();
      expect(result.affordability?.percentage).toBeDefined();
    });
  });
});
