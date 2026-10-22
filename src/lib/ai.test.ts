import { describe, expect, it } from "vitest";
import {
  assessEmergencyExposure,
  deriveSensitiveFactors,
  mapConditionsText,
  projectGrowth,
  recommendAllocation,
  scoreCustomer,
} from "@/lib/ai";
import { customers } from "@/data/mock";
import type { PlannerInput } from "@/lib/types";

const youngHealthy: PlannerInput = {
  totalFund: 100_000,
  age: 25,
  monthlySalary: 8_000,
  monthlyExpenses: 2_000,
  householdMembers: 1,
  plannedLoans: [],
};

const olderHigh: PlannerInput = {
  totalFund: 100_000,
  age: 65,
  monthlySalary: 6_000,
  monthlyExpenses: 4_500,
  householdMembers: 5,
  plannedLoans: ["car", "education"],
  conditionsText: "serious chronic heart condition needing hospital care",
  habits: ["smoking", "sedentary", "poor_sleep"],
  medicationMonthlyExpense: 800,
};

describe("assessEmergencyExposure", () => {
  it("baseline young healthy profile returns Low", () => {
    const result = assessEmergencyExposure(youngHealthy);
    expect(result.label).toBe("Low");
    expect(result.riskScore).toBeLessThan(25);
  });

  it("older age plus serious condition plus dependents returns High", () => {
    const result = assessEmergencyExposure(olderHigh);
    expect(result.label).toBe("High");
    expect(result.riskScore).toBeGreaterThanOrEqual(65);
  });

  it("sensitive fields not provided leave the score unchanged", () => {
    const base = assessEmergencyExposure(youngHealthy);
    const withEmptySensitive = assessEmergencyExposure({
      ...youngHealthy,
      habits: [],
      medicationMonthlyExpense: undefined,
      conditionsText: undefined,
    });
    expect(withEmptySensitive.riskScore).toBe(base.riskScore);
  });

  it("score is always within 0-100", () => {
    const samples: PlannerInput[] = [
      youngHealthy,
      olderHigh,
      {
        ...youngHealthy,
        age: 90,
        householdMembers: 10,
        conditionsText: "critical terminal cancer dialysis transplant",
        habits: ["smoking", "heavy_alcohol", "sedentary", "poor_sleep", "other"],
        medicationMonthlyExpense: 50_000,
      },
    ];
    for (const s of samples) {
      const r = assessEmergencyExposure(s);
      expect(r.riskScore).toBeGreaterThanOrEqual(0);
      expect(r.riskScore).toBeLessThanOrEqual(100);
    }
  });
});

describe("recommendAllocation", () => {
  it("output always sums to exactly 100", () => {
    const exposure = assessEmergencyExposure(youngHealthy);
    const result = recommendAllocation(youngHealthy, exposure);
    expect(result.liquidity + result.safe + result.growth).toBe(100);
  });

  it("liquidity respects the 5-40 clamp", () => {
    const highExpense: PlannerInput = {
      ...youngHealthy,
      monthlyExpenses: 20_000,
      totalFund: 50_000,
    };
    const lowExpense: PlannerInput = {
      ...youngHealthy,
      monthlyExpenses: 100,
      totalFund: 500_000,
    };
    for (const input of [highExpense, lowExpense, youngHealthy, olderHigh]) {
      const exposure = assessEmergencyExposure(input);
      const result = recommendAllocation(input, exposure);
      expect(result.liquidity).toBeGreaterThanOrEqual(5);
      expect(result.liquidity).toBeLessThanOrEqual(40);
      expect(result.liquidity + result.safe + result.growth).toBe(100);
    }
  });

  it("higher exposure never reduces liquidity or safe", () => {
    const lowExp = assessEmergencyExposure(youngHealthy);
    const lowAlloc = recommendAllocation(youngHealthy, lowExp);

    const sameFinancesHigh: PlannerInput = {
      totalFund: youngHealthy.totalFund,
      age: youngHealthy.age,
      monthlySalary: youngHealthy.monthlySalary,
      monthlyExpenses: youngHealthy.monthlyExpenses,
      householdMembers: youngHealthy.householdMembers,
      plannedLoans: [],
      conditionsText: "serious chronic heart hospital",
      habits: ["smoking", "sedentary", "poor_sleep"],
      medicationMonthlyExpense: 600,
    };
    const highExpSame = assessEmergencyExposure(sameFinancesHigh);
    expect(highExpSame.riskScore).toBeGreaterThan(lowExp.riskScore);
    const highAlloc = recommendAllocation(sameFinancesHigh, highExpSame);
    expect(highAlloc.liquidity).toBeGreaterThanOrEqual(lowAlloc.liquidity);
    expect(highAlloc.safe).toBeGreaterThanOrEqual(lowAlloc.safe);
  });

  it("changing only a sensitive field changes only buffer-driven buckets", () => {
    const base = youngHealthy;
    const baseExp = assessEmergencyExposure(base);
    const baseAlloc = recommendAllocation(base, baseExp);

    const withHealth: PlannerInput = {
      ...base,
      conditionsText: "serious hospital heart",
      medicationMonthlyExpense: 500,
    };
    const healthExp = assessEmergencyExposure(withHealth);
    const healthAlloc = recommendAllocation(withHealth, healthExp);

    expect(healthExp.riskScore).toBeGreaterThan(baseExp.riskScore);
    // Liquidity and/or safe should move with buffer; growth is residual
    expect(
      healthAlloc.liquidity !== baseAlloc.liquidity ||
        healthAlloc.safe !== baseAlloc.safe
    ).toBe(true);
    // Total still 100
    expect(healthAlloc.liquidity + healthAlloc.safe + healthAlloc.growth).toBe(
      100
    );
  });
});

describe("conditions mapper", () => {
  it("unrecognized text returns the default band", () => {
    const mapped = mapConditionsText("xyzzy unexplained phrase");
    expect(mapped.band).toBe("manageable_ongoing");
    expect(mapped.unclassified).toBe(true);
  });

  it("raw text is never present in persisted state factors", () => {
    const factors = deriveSensitiveFactors({
      conditionsText: "I have mild asthma that is managed",
      monthlySalary: 8000,
      medicationMonthlyExpense: 100,
      habits: ["sedentary"],
    });
    const serialized = JSON.stringify(factors);
    expect(serialized).not.toContain("asthma");
    expect(serialized).not.toContain("mild");
    expect(factors.conditionBand).toBe("manageable_ongoing");
  });
});

describe("scoreCustomer", () => {
  it("returns a score between 0 and 100", () => {
    for (const c of customers.slice(0, 5)) {
      const s = scoreCustomer(c);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(100);
    }
  });

  it("featured high-balance customer scores higher than low-balance", () => {
    const featured = customers.find((c) => c.featured)!;
    const low = customers.find((c) => c.balance < 100_000)!;
    expect(scoreCustomer(featured)).toBeGreaterThan(scoreCustomer(low));
  });
});

describe("projectGrowth", () => {
  it("starts at principal and grows with positive return", () => {
    const points = projectGrowth(100_000, 10, 0.06);
    expect(points[0]).toEqual({ year: 0, value: 100_000 });
    expect(points).toHaveLength(11);
    expect(points[10].value).toBeGreaterThan(100_000);
  });

  it("is deterministic", () => {
    const a = projectGrowth(50_000, 5, 0.05);
    const b = projectGrowth(50_000, 5, 0.05);
    expect(a).toEqual(b);
  });
});
