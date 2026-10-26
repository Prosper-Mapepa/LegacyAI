import type { Customer, Heir, MonthlySpend } from "@/lib/types";
import {
  FAMILY_LAST_NAME,
  FEATURED_CUSTOMER_ID,
  FEATURED_HEIR_ID,
  PILOT_HOUSEHOLD_ID,
} from "./story";

export { FEATURED_CUSTOMER_ID, FEATURED_HEIR_ID, PILOT_HOUSEHOLD_ID };

/** Deterministic pseudo-random from seed (mulberry32) */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateSpendingHistory(
  seed: number,
  baseMonthly: number,
  years = 5,
): MonthlySpend[] {
  const rand = mulberry32(seed);
  const currentYear = 2025;
  const startYear = currentYear - years + 1;
  const history: MonthlySpend[] = [];

  for (let y = startYear; y <= currentYear; y++) {
    const yearDrift = 1 + (y - startYear) * 0.02;
    for (let m = 1; m <= 12; m++) {
      const seasonal = 1 + 0.08 * Math.sin((m / 12) * Math.PI * 2);
      const noise = 0.85 + rand() * 0.3;
      history.push({
        year: y,
        month: m,
        amount: Math.round(baseMonthly * yearDrift * seasonal * noise),
      });
    }
  }
  return history;
}

/**
 * Same people as the continuity book. Featured row = Pilot Heir ($100K+).
 * firstName/lastName are role labels so the whole system reads the same way.
 */
export const customers: Customer[] = [
  {
    id: FEATURED_CUSTOMER_ID,
    firstName: "Heir",
    lastName: FAMILY_LAST_NAME,
    age: 42,
    balance: 100_000,
    monthlySalary: 12_500,
    monthlyExpenses: 2_083,
    householdMembers: 3,
    otherYearlyEarnings: 150_000,
    spendingHistory: generateSpendingHistory(101, 2_083),
    status: "New",
    featured: true,
  },
  {
    id: "cust-ready",
    firstName: "Heir",
    lastName: "Ready",
    age: 36,
    balance: 245_000,
    monthlySalary: 14_200,
    monthlyExpenses: 4_800,
    householdMembers: 4,
    otherYearlyEarnings: 32_000,
    spendingHistory: generateSpendingHistory(102, 4_800),
    status: "New",
  },
  {
    id: "cust-watch",
    firstName: "Heir",
    lastName: "Watch",
    age: 29,
    balance: 112_500,
    monthlySalary: 9_800,
    monthlyExpenses: 3_400,
    householdMembers: 2,
    otherYearlyEarnings: 8_000,
    spendingHistory: generateSpendingHistory(104, 3_400),
    status: "New",
  },
  {
    id: "cust-hold",
    firstName: "Heir",
    lastName: "Hold",
    age: 45,
    balance: 520_000,
    monthlySalary: 18_000,
    monthlyExpenses: 6_200,
    householdMembers: 2,
    otherYearlyEarnings: 45_000,
    spendingHistory: generateSpendingHistory(103, 6_200),
    status: "New",
  },
  {
    id: "cust-sibling",
    firstName: "Sibling",
    lastName: FAMILY_LAST_NAME,
    age: 38,
    balance: 156_000,
    monthlySalary: 10_800,
    monthlyExpenses: 4_200,
    householdMembers: 3,
    otherYearlyEarnings: 15_000,
    spendingHistory: generateSpendingHistory(108, 4_200),
    status: "New",
  },
];

export const heirs: Heir[] = [
  {
    id: "heir-link",
    customerId: FEATURED_CUSTOMER_ID,
    name: "Heir Pilot",
    relationship: "Adult child",
  },
];

export function getFeaturedCustomer(): Customer {
  return customers.find((c) => c.featured)!;
}

export function getHeirForCustomer(customerId: string): Heir | undefined {
  return heirs.find((h) => h.customerId === customerId);
}
