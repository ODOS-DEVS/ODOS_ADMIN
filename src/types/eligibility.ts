/**
 * User eligibility targeting rules for promotions and campaigns.
 * These allow you to show deals only to specific types of shoppers.
 */

export interface EligibilityRules {
  minLifetimeOrderCount?: number;
  maxLifetimeOrderCount?: number;
  minLifetimeSpend?: number;
  dormantDaysSinceLastOrder?: number;
}

export const EMPTY_ELIGIBILITY_RULES: EligibilityRules = {};

export const ELIGIBILITY_PRESETS = {
  firstTimeOnly: {
    maxLifetimeOrderCount: 0,
    label: "First-time buyers only",
    description: "Only show to customers who haven't purchased yet",
  },
  winBackDormant: {
    dormantDaysSinceLastOrder: 30,
    label: "Win back dormant customers",
    description: "Only show to customers who haven't ordered in 30+ days",
  },
  highValue: {
    minLifetimeSpend: 500,
    label: "High-value shoppers",
    description: "Only show to customers who've spent ₵500+",
  },
  frequentBuyers: {
    minLifetimeOrderCount: 3,
    label: "Frequent buyers",
    description: "Only show to customers with 3+ orders",
  },
};
