/**
 * Shared Cost Engine — Rental Intelligence Platform
 * ARCHITECTURE.md §5 calculation logic
 */

export interface CostInput {
  rent: number;
  deposit: number;
  brokerage?: number;
  maintenance?: number;
  electricity?: number;
  water?: number;
  internet?: number;
  transport?: number;
  otherRecurring?: number;
}

export interface ItemizedCostComponent {
  value: number;
  isEstimated: boolean;
  label: string;
}

export interface CostCalculationResult {
  rent: ItemizedCostComponent;
  maintenance: ItemizedCostComponent;
  electricity: ItemizedCostComponent;
  water: ItemizedCostComponent;
  internet: ItemizedCostComponent;
  transport: ItemizedCostComponent;
  otherRecurring: ItemizedCostComponent;
  estimatedMonthlyCost: number;
  deposit: ItemizedCostComponent;
  brokerage: ItemizedCostComponent;
  firstMonthRent: ItemizedCostComponent;
  initialMoveInCost: number;
  isAnyEstimated: boolean;
}

export interface AffordabilityResult {
  ratio: number;         // e.g. 0.38 for 38%
  percentage: number;    // e.g. 38
  formattedSignal: string; // e.g. "~38% of your stated budget"
  status: 'affordable' | 'stretch' | 'over_budget';
  explanation: string;
}

// City-average utility default estimates when inputs are omitted
export const CITY_DEFAULT_ESTIMATES = {
  maintenance: 2000,
  electricity: 1500,
  water: 500,
  internet: 1000,
  transport: 1500,
  otherRecurring: 0,
};

/**
 * Calculates estimated monthly cost:
 * estimatedMonthlyCost = rent + maintenance + electricity + water + internet + transport + otherRecurring
 */
export function calculateEstimatedMonthlyCost(input: CostInput): {
  estimatedMonthlyCost: number;
  isEstimated: boolean;
} {
  const maintenance = input.maintenance ?? CITY_DEFAULT_ESTIMATES.maintenance;
  const electricity = input.electricity ?? CITY_DEFAULT_ESTIMATES.electricity;
  const water = input.water ?? CITY_DEFAULT_ESTIMATES.water;
  const internet = input.internet ?? CITY_DEFAULT_ESTIMATES.internet;
  const transport = input.transport ?? CITY_DEFAULT_ESTIMATES.transport;
  const otherRecurring = input.otherRecurring ?? CITY_DEFAULT_ESTIMATES.otherRecurring;

  const isEstimated =
    input.maintenance === undefined ||
    input.electricity === undefined ||
    input.water === undefined ||
    input.internet === undefined ||
    input.transport === undefined;

  const estimatedMonthlyCost =
    input.rent +
    maintenance +
    electricity +
    water +
    internet +
    transport +
    otherRecurring;

  return { estimatedMonthlyCost, isEstimated };
}

/**
 * Calculates initial move-in cost:
 * initialMoveInCost = deposit + brokerage + rent (first month)
 */
export function calculateInitialMoveInCost(input: CostInput): {
  initialMoveInCost: number;
  isEstimated: boolean;
} {
  const brokerage = input.brokerage ?? 0;
  const isEstimated = input.brokerage === undefined;
  const initialMoveInCost = input.deposit + brokerage + input.rent;

  return { initialMoveInCost, isEstimated };
}

/**
 * Calculates affordability ratio relative to user budget:
 * affordabilityRatio = estimatedMonthlyCost / user.budget
 */
export function calculateAffordabilityRatio(
  estimatedMonthlyCost: number,
  userBudget: number
): AffordabilityResult {
  if (!userBudget || userBudget <= 0) {
    return {
      ratio: 0,
      percentage: 0,
      formattedSignal: 'Budget not set',
      status: 'affordable',
      explanation: 'User budget has not been defined.',
    };
  }

  const ratio = estimatedMonthlyCost / userBudget;
  const percentage = Math.round(ratio * 100);
  const formattedSignal = `~${percentage}% of your stated budget`;

  let status: 'affordable' | 'stretch' | 'over_budget';
  let explanation: string;

  if (ratio <= 0.35) {
    status = 'affordable';
    explanation = `This property's total monthly cost accounts for ${percentage}% of your stated budget, well within comfortable financial limits (<= 35%).`;
  } else if (ratio <= 0.5) {
    status = 'stretch';
    explanation = `This property's total monthly cost accounts for ${percentage}% of your stated budget. It is manageable but represents a stretch (35%–50%).`;
  } else {
    status = 'over_budget';
    explanation = `This property's total monthly cost accounts for ${percentage}% of your stated budget, exceeding standard recommended limits (> 50%).`;
  }

  return {
    ratio,
    percentage,
    formattedSignal,
    status,
    explanation,
  };
}

/**
 * Full itemized cost breakdown with estimates flag per item
 */
export function calculateFullCostBreakdown(
  input: CostInput,
  userBudget?: number
): CostCalculationResult & { affordability?: AffordabilityResult } {
  const rentComp: ItemizedCostComponent = {
    value: input.rent,
    isEstimated: false,
    label: 'Base Rent',
  };

  const maintComp: ItemizedCostComponent = {
    value: input.maintenance ?? CITY_DEFAULT_ESTIMATES.maintenance,
    isEstimated: input.maintenance === undefined,
    label: 'Maintenance',
  };

  const elecComp: ItemizedCostComponent = {
    value: input.electricity ?? CITY_DEFAULT_ESTIMATES.electricity,
    isEstimated: input.electricity === undefined,
    label: 'Electricity',
  };

  const waterComp: ItemizedCostComponent = {
    value: input.water ?? CITY_DEFAULT_ESTIMATES.water,
    isEstimated: input.water === undefined,
    label: 'Water',
  };

  const netComp: ItemizedCostComponent = {
    value: input.internet ?? CITY_DEFAULT_ESTIMATES.internet,
    isEstimated: input.internet === undefined,
    label: 'Internet',
  };

  const transComp: ItemizedCostComponent = {
    value: input.transport ?? CITY_DEFAULT_ESTIMATES.transport,
    isEstimated: input.transport === undefined,
    label: 'Transportation',
  };

  const otherComp: ItemizedCostComponent = {
    value: input.otherRecurring ?? CITY_DEFAULT_ESTIMATES.otherRecurring,
    isEstimated: false,
    label: 'Other Recurring',
  };

  const { estimatedMonthlyCost, isEstimated: monthlyIsEst } =
    calculateEstimatedMonthlyCost(input);

  const depComp: ItemizedCostComponent = {
    value: input.deposit,
    isEstimated: false,
    label: 'Security Deposit',
  };

  const brokComp: ItemizedCostComponent = {
    value: input.brokerage ?? 0,
    isEstimated: input.brokerage === undefined,
    label: 'Brokerage Fee',
  };

  const firstRentComp: ItemizedCostComponent = {
    value: input.rent,
    isEstimated: false,
    label: 'First Month Rent',
  };

  const { initialMoveInCost, isEstimated: moveInIsEst } =
    calculateInitialMoveInCost(input);

  const result: CostCalculationResult & { affordability?: AffordabilityResult } = {
    rent: rentComp,
    maintenance: maintComp,
    electricity: elecComp,
    water: waterComp,
    internet: netComp,
    transport: transComp,
    otherRecurring: otherComp,
    estimatedMonthlyCost,
    deposit: depComp,
    brokerage: brokComp,
    firstMonthRent: firstRentComp,
    initialMoveInCost,
    isAnyEstimated: monthlyIsEst || moveInIsEst,
  };

  if (userBudget) {
    result.affordability = calculateAffordabilityRatio(
      estimatedMonthlyCost,
      userBudget
    );
  }

  return result;
}
