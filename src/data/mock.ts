import type { Customer, Heir, MonthlySpend } from "@/lib/types";

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
  years = 5
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
 * Featured customer: balance $100K, yearly spending $25K (~$2,083/mo),
 * other yearly earnings $150K.
 */
const FEATURED_ID = "cust-001";

export const FEATURED_CUSTOMER_ID = FEATURED_ID;

export const customers: Customer[] = [
  {
    id: FEATURED_ID,
    firstName: "Jordan",
    lastName: "Whitfield",
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
    id: "cust-002",
    firstName: "Aisha",
    lastName: "Okonkwo",
    age: 38,
    balance: 245_000,
    monthlySalary: 14_200,
    monthlyExpenses: 4_800,
    householdMembers: 4,
    otherYearlyEarnings: 32_000,
    spendingHistory: generateSpendingHistory(102, 4_800),
    status: "New",
  },
  {
    id: "cust-003",
    firstName: "Marcus",
    lastName: "Chen",
    age: 55,
    balance: 520_000,
    monthlySalary: 18_000,
    monthlyExpenses: 6_200,
    householdMembers: 2,
    otherYearlyEarnings: 45_000,
    spendingHistory: generateSpendingHistory(103, 6_200),
    status: "New",
  },
  {
    id: "cust-004",
    firstName: "Elena",
    lastName: "Vasquez",
    age: 31,
    balance: 112_500,
    monthlySalary: 9_800,
    monthlyExpenses: 3_400,
    householdMembers: 2,
    otherYearlyEarnings: 8_000,
    spendingHistory: generateSpendingHistory(104, 3_400),
    status: "New",
  },
  {
    id: "cust-005",
    firstName: "David",
    lastName: "Nguyen",
    age: 47,
    balance: 187_000,
    monthlySalary: 11_500,
    monthlyExpenses: 5_100,
    householdMembers: 5,
    otherYearlyEarnings: 22_000,
    spendingHistory: generateSpendingHistory(105, 5_100),
    status: "New",
  },
  {
    id: "cust-006",
    firstName: "Priya",
    lastName: "Sharma",
    age: 29,
    balance: 98_000,
    monthlySalary: 8_200,
    monthlyExpenses: 2_900,
    householdMembers: 1,
    otherYearlyEarnings: 5_000,
    spendingHistory: generateSpendingHistory(106, 2_900),
    status: "New",
  },
  {
    id: "cust-007",
    firstName: "Robert",
    lastName: "Sullivan",
    age: 62,
    balance: 890_000,
    monthlySalary: 22_000,
    monthlyExpenses: 7_500,
    householdMembers: 2,
    otherYearlyEarnings: 60_000,
    spendingHistory: generateSpendingHistory(107, 7_500),
    status: "New",
  },
  {
    id: "cust-008",
    firstName: "Fatima",
    lastName: "Al-Rashid",
    age: 44,
    balance: 156_000,
    monthlySalary: 10_800,
    monthlyExpenses: 4_200,
    householdMembers: 3,
    otherYearlyEarnings: 15_000,
    spendingHistory: generateSpendingHistory(108, 4_200),
    status: "New",
  },
  {
    id: "cust-009",
    firstName: "James",
    lastName: "Okafor",
    age: 36,
    balance: 75_000,
    monthlySalary: 7_500,
    monthlyExpenses: 3_100,
    householdMembers: 2,
    otherYearlyEarnings: 4_000,
    spendingHistory: generateSpendingHistory(109, 3_100),
    status: "New",
  },
  {
    id: "cust-010",
    firstName: "Sophie",
    lastName: "Bergman",
    age: 51,
    balance: 310_000,
    monthlySalary: 15_600,
    monthlyExpenses: 5_800,
    householdMembers: 3,
    otherYearlyEarnings: 28_000,
    spendingHistory: generateSpendingHistory(110, 5_800),
    status: "New",
  },
  {
    id: "cust-011",
    firstName: "Carlos",
    lastName: "Mendez",
    age: 40,
    balance: 134_000,
    monthlySalary: 9_200,
    monthlyExpenses: 3_700,
    householdMembers: 4,
    otherYearlyEarnings: 12_000,
    spendingHistory: generateSpendingHistory(111, 3_700),
    status: "New",
  },
  {
    id: "cust-012",
    firstName: "Amelia",
    lastName: "Foster",
    age: 27,
    balance: 105_000,
    monthlySalary: 8_900,
    monthlyExpenses: 2_600,
    householdMembers: 1,
    otherYearlyEarnings: 6_500,
    spendingHistory: generateSpendingHistory(112, 2_600),
    status: "New",
  },
  {
    id: "cust-013",
    firstName: "Kevin",
    lastName: "Park",
    age: 58,
    balance: 445_000,
    monthlySalary: 16_800,
    monthlyExpenses: 6_000,
    householdMembers: 2,
    otherYearlyEarnings: 40_000,
    spendingHistory: generateSpendingHistory(113, 6_000),
    status: "New",
  },
  {
    id: "cust-014",
    firstName: "Nina",
    lastName: "Patel",
    age: 33,
    balance: 128_000,
    monthlySalary: 10_100,
    monthlyExpenses: 3_500,
    householdMembers: 3,
    otherYearlyEarnings: 9_000,
    spendingHistory: generateSpendingHistory(114, 3_500),
    status: "New",
  },
  {
    id: "cust-015",
    firstName: "Thomas",
    lastName: "Wright",
    age: 49,
    balance: 88_500,
    monthlySalary: 9_500,
    monthlyExpenses: 4_000,
    householdMembers: 2,
    otherYearlyEarnings: 11_000,
    spendingHistory: generateSpendingHistory(115, 4_000),
    status: "New",
  },
];

export const heirs: Heir[] = [
  {
    id: "heir-001",
    customerId: FEATURED_ID,
    name: "Maya Whitfield",
    relationship: "Daughter",
  },
];

export function getFeaturedCustomer(): Customer {
  return customers.find((c) => c.featured)!;
}

export function getHeirForCustomer(customerId: string): Heir | undefined {
  return heirs.find((h) => h.customerId === customerId);
}
