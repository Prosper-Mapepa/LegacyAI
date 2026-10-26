/**
 * Deterministic "AI" helpers for LegacyAI.
 * All weights are configurable defaults a bank's advisors would calibrate.
 * Internal numeric scores are never shown in the UI — only qualitative labels.
 */

import { clamp } from "@/lib/utils";
import type {
  AllocationResult,
  ConditionBand,
  Customer,
  EmergencyExposure,
  ExposureLabel,
  GrowthProjectionPoint,
  Habit,
  PlannerInput,
} from "@/lib/types";

function hasKeyword(text: string, keyword: string): boolean {
  // Phrase / longer tokens: substring match is fine
  if (keyword.length > 3 || keyword.includes(" ") || keyword.includes("/")) {
    return text.includes(keyword);
  }
  // Short tokens ("no", "na"): whole-word only to avoid "managed" matching "na"
  const re = new RegExp(`(?:^|[^a-z0-9])${keyword}(?:[^a-z0-9]|$)`, "i");
  return re.test(text);
}

/** Coarse condition band from free text. Raw text must be discarded after mapping. */
export function mapConditionsText(text: string | undefined | null): {
  band: ConditionBand;
  unclassified: boolean;
} {
  if (text == null || text.trim() === "") {
    return { band: "none", unclassified: false };
  }

  const t = text.toLowerCase().trim();

  const noneKeywords = [
    "none",
    "n/a",
    "na",
    "no",
    "nothing",
    "healthy",
    "no conditions",
    "no disease",
    "no diseases",
  ];
  if (noneKeywords.some((k) => t === k || hasKeyword(t, k))) {
    return { band: "none", unclassified: false };
  }

  const seriousKeywords = [
    "serious",
    "severe",
    "chronic serious",
    "hospital",
    "surgery",
    "cancer",
    "heart",
    "stroke",
    "dialysis",
    "transplant",
    "terminal",
    "critical",
  ];
  if (seriousKeywords.some((k) => hasKeyword(t, k))) {
    return { band: "serious_ongoing", unclassified: false };
  }

  const manageableKeywords = [
    "manageable",
    "mild",
    "controlled",
    "ongoing",
    "managed",
    "stable",
    "routine",
    "allerg",
    "asthma",
    "diabetes",
    "hypertension",
    "blood pressure",
    "thyroid",
    "arthritis",
  ];
  if (manageableKeywords.some((k) => hasKeyword(t, k))) {
    return { band: "manageable_ongoing", unclassified: false };
  }

  // Unrecognized → default manageable_ongoing
  return { band: "manageable_ongoing", unclassified: true };
}

function conditionBandFromInput(input: PlannerInput): {
  band: ConditionBand;
  unclassified: boolean;
  provided: boolean;
} {
  if (input.conditionsText == null || input.conditionsText.trim() === "") {
    return { band: "none", unclassified: false, provided: false };
  }
  const mapped = mapConditionsText(input.conditionsText);
  return { ...mapped, provided: true };
}

function medicationBurden(
  expense: number | undefined,
  monthlySalary: number
): number {
  if (expense == null || expense <= 0 || monthlySalary <= 0) return 0;
  return Math.min(15, (expense / monthlySalary) * 150);
}

/**
 * Assess emergency exposure. riskScore and emergencyFrequencyPerYear are
 * internal only — UI must show only label + drivers.
 */
export function assessEmergencyExposure(
  input: PlannerInput
): EmergencyExposure {
  let riskScore = 20;
  const drivers: string[] = [];

  // Age
  if (input.age < 30) {
    // +0
  } else if (input.age <= 44) {
    riskScore += 5;
    drivers.push("Your life stage suggests planning a solid emergency cushion.");
  } else if (input.age <= 59) {
    riskScore += 12;
    drivers.push(
      "Mid-career responsibilities support a larger liquid buffer."
    );
  } else {
    riskScore += 20;
    drivers.push(
      "Later-career years often call for more readily available reserves."
    );
  }

  // Condition band
  const { band, provided } = conditionBandFromInput(input);
  if (provided) {
    if (band === "manageable_ongoing") {
      riskScore += 12;
      drivers.push("Ongoing healthcare costs add to your buffer.");
    } else if (band === "serious_ongoing") {
      riskScore += 25;
      drivers.push(
        "Ongoing healthcare needs support a stronger emergency reserve."
      );
    }
    // none: +0
  }

  // Habits
  const habits = input.habits ?? [];
  if (habits.length > 0) {
    const habitAdd = Math.min(12, habits.length * 4);
    riskScore += habitAdd;
    drivers.push(
      "Lifestyle factors suggest keeping more funds easy to reach."
    );
  }

  // Medication burden
  const medAdd = medicationBurden(
    input.medicationMonthlyExpense,
    input.monthlySalary
  );
  if (medAdd > 0) {
    riskScore += medAdd;
    drivers.push("Recurring medication costs are reflected in your buffer.");
  }

  // Household beyond the user
  const dependents = Math.max(0, input.householdMembers - 1);
  if (dependents > 0) {
    const hhAdd = Math.min(12, dependents * 3);
    riskScore += hhAdd;
    drivers.push("Several people depend on your income.");
  }

  // Stability credit
  if (input.monthlySalary > 0) {
    const margin =
      (input.monthlySalary - input.monthlyExpenses) / input.monthlySalary;
    if (margin > 0.3) {
      riskScore -= 5;
      drivers.push(
        "Healthy income-to-expense margin gives you a little more flexibility."
      );
    }
  }

  riskScore = clamp(riskScore, 0, 100);

  const emergencyFrequencyPerYear = 0.15 + (riskScore / 100) * 1.35;

  let label: ExposureLabel;
  if (riskScore < 25) label = "Low";
  else if (riskScore < 45) label = "Moderate";
  else if (riskScore < 65) label = "Elevated";
  else label = "High";

  if (drivers.length === 0) {
    drivers.push(
      "Based on the basics you shared, your emergency exposure looks manageable."
    );
  }

  return { riskScore, emergencyFrequencyPerYear, label, drivers };
}

function roundSharesTo100(
  liquidity: number,
  safe: number,
  growth: number
): { liquidity: number; safe: number; growth: number } {
  let l = Math.round(liquidity);
  let s = Math.round(safe);
  let g = Math.round(growth);
  let diff = 100 - (l + s + g);

  // Adjust the largest bucket to fix rounding drift
  while (diff !== 0) {
    const step = diff > 0 ? 1 : -1;
    if (Math.abs(g) >= Math.abs(s) && Math.abs(g) >= Math.abs(l)) {
      g += step;
    } else if (Math.abs(s) >= Math.abs(l)) {
      s += step;
    } else {
      l += step;
    }
    diff = 100 - (l + s + g);
  }
  return { liquidity: l, safe: s, growth: g };
}

/**
 * Recommend Liquidity / Safe / Growth split.
 * Weights are configurable defaults a bank's advisors would calibrate.
 */
export function recommendAllocation(
  input: PlannerInput,
  exposure: EmergencyExposure
): AllocationResult {
  const { riskScore } = exposure;
  const reasons: string[] = [];

  // 1. months buffer 3–9
  const monthsBuffer = 3 + (riskScore / 100) * 6;
  reasons.push(
    `Your emergency cushion targets roughly ${monthsBuffer.toFixed(1)} months of expenses (a configurable default advisors would calibrate).`
  );

  // 2. liquidity %
  let liquidity = clamp(
    ((monthsBuffer * input.monthlyExpenses) / input.totalFund) * 100,
    5,
    40
  );
  if (liquidity <= 5.01) {
    reasons.push(
      "Liquidity is held at the minimum share so cash remains ready without over-concentrating."
    );
  } else if (liquidity >= 39.99) {
    reasons.push(
      "Liquidity is capped so the rest of your fund can still work for you."
    );
  } else {
    reasons.push(
      "Liquidity is sized from your monthly expenses and exposure profile."
    );
  }

  // 3. safe %
  let safe =
    15 +
    riskScore * 0.25 +
    (input.age >= 55 ? 5 : 0) +
    Math.min(6, input.plannedLoans.length * 2);
  safe = clamp(safe, 10, 45);

  if (input.age >= 55) {
    reasons.push(
      "A modest tilt toward safer holdings reflects later-career priorities."
    );
  }
  if (input.plannedLoans.length > 0) {
    reasons.push(
      "Planned loans nudge more toward stable, near-term holdings."
    );
  }
  if (riskScore >= 45) {
    reasons.push(
      "Higher emergency exposure supports a larger safe-investment share."
    );
  }

  // 4. growth remainder with floor of 15
  let growth = 100 - liquidity - safe;
  if (growth < 15) {
    const need = 15 - growth;
    const fromSafe = Math.min(need, Math.max(0, safe - 10));
    safe -= fromSafe;
    growth += fromSafe;
    const stillNeed = 15 - growth;
    if (stillNeed > 0) {
      const fromLiq = Math.min(stillNeed, Math.max(0, liquidity - 5));
      liquidity -= fromLiq;
      growth += fromLiq;
    }
    reasons.push(
      "Growth is kept at least at a minimum share so long-term goals stay funded."
    );
  }

  const rounded = roundSharesTo100(liquidity, safe, growth);
  const amounts = {
    liquidity: Math.round((rounded.liquidity / 100) * input.totalFund),
    safe: Math.round((rounded.safe / 100) * input.totalFund),
    growth: 0,
  };
  amounts.growth = input.totalFund - amounts.liquidity - amounts.safe;

  return {
    ...rounded,
    amounts,
    reasons,
  };
}

/** Customer-friendly guidance per bucket — no personal health details. */
export function explainAllocation(result: AllocationResult): {
  liquidity: string;
  safe: string;
  growth: string;
} {
  return {
    liquidity: `Liquidity (${result.liquidity}%, ${formatAmt(result.amounts.liquidity)}) is cash you can reach quickly for unexpected bills. Think high-yield savings or a money-market account — the "emergency fund" slice of your plan.`,
    safe: `Safe Investment (${result.safe}%, ${formatAmt(result.amounts.safe)}) aims to preserve purchasing power with limited volatility. Short-term Treasuries, CDs, or short-duration bond funds are typical vehicles an advisor might discuss.`,
    growth: `Growth (${result.growth}%, ${formatAmt(result.amounts.growth)}) is for longer horizons — diversified stock or balanced funds that can compound over years. This is the "long-term growth" portion of your plan, reviewed with your relationship manager before you act.`,
  };
}

function formatAmt(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Priority score for RM dashboard (0–100). Higher = more worth outreach.
 * Deterministic from balance, spending, and earnings.
 */
export function scoreCustomer(customer: Customer): number {
  const balanceScore = clamp((customer.balance / 1_000_000) * 50, 0, 50);
  const avgYearly =
    customer.spendingHistory.reduce((s, r) => s + r.amount, 0) /
    Math.max(1, new Set(customer.spendingHistory.map((r) => r.year)).size);
  const spendScore = clamp((avgYearly / 100_000) * 25, 0, 25);
  const earningsScore = clamp(
    (customer.otherYearlyEarnings / 200_000) * 25,
    0,
    25
  );
  return Math.round(clamp(balanceScore + spendScore + earningsScore, 0, 100));
}

/** Plain-English spending summary for RM side panel. */
export function summarizeSpending(customer: Customer): string {
  const byYear = new Map<number, number>();
  for (const row of customer.spendingHistory) {
    byYear.set(row.year, (byYear.get(row.year) ?? 0) + row.amount);
  }
  const years = [...byYear.entries()].sort((a, b) => a[0] - b[0]);
  if (years.length < 2) {
    return `${customer.firstName} has limited spending history on file.`;
  }
  const first = years[0][1];
  const last = years[years.length - 1][1];
  const change = ((last - first) / first) * 100;
  const direction =
    change > 5 ? "risen" : change < -5 ? "declined" : "stayed steady";
  const avg =
    years.reduce((s, [, v]) => s + v, 0) / years.length;

  return `${customer.firstName}'s average yearly spending is about ${formatAmt(avg)}. Over five years, spending has ${direction} (${change >= 0 ? "+" : ""}${change.toFixed(0)}% from first to last year). Combined with ${formatAmt(customer.balance)} on deposit and ${formatAmt(customer.otherYearlyEarnings)} in other yearly earnings, they are a strong candidate for a LegacyAI conversation.`;
}

/**
 * Illustrative compound-interest growth projection.
 * Uses annual compounding: value_t = principal × (1 + r)^t
 * (not simple interest: principal × (1 + r × t)).
 * assumedReturn is the annual rate (e.g. 0.06 = 6%).
 */
export function projectGrowth(
  principal: number,
  years: number,
  assumedReturn: number
): GrowthProjectionPoint[] {
  const points: GrowthProjectionPoint[] = [];
  const r = assumedReturn;
  for (let y = 0; y <= years; y++) {
    const value = principal * Math.pow(1 + r, y);
    points.push({ year: y, value: Math.round(value) });
  }
  return points;
}

/** Coarse factors derived from sensitive inputs for persistence (no raw data). */
export function deriveSensitiveFactors(input: {
  medicationMonthlyExpense?: number;
  monthlySalary: number;
  habits?: Habit[];
  conditionsText?: string;
}): {
  conditionBand: ConditionBand | null;
  conditionUnclassified: boolean;
  medicationBurdenFactor: number;
  habitCount: number;
} {
  const hasConditions =
    input.conditionsText != null && input.conditionsText.trim() !== "";
  const mapped = hasConditions
    ? mapConditionsText(input.conditionsText)
    : { band: "none" as ConditionBand, unclassified: false };

  const med =
    input.medicationMonthlyExpense != null &&
    input.medicationMonthlyExpense > 0 &&
    input.monthlySalary > 0
      ? Math.min(
          1,
          (input.medicationMonthlyExpense / input.monthlySalary) * 10
        )
      : 0;

  return {
    conditionBand: hasConditions ? mapped.band : null,
    conditionUnclassified: mapped.unclassified,
    medicationBurdenFactor: Math.round(med * 100) / 100,
    habitCount: Math.min(3, input.habits?.length ?? 0),
  };
}
