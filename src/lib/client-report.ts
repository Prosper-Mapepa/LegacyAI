import {
  assessEmergencyExposure,
  recommendAllocation,
  scoreCustomer,
} from "@/lib/ai";
import type { Customer } from "@/lib/types";
import { avgYearlySpending, formatCurrency } from "@/lib/utils";

/** Calculated figures + model split for Advisor-facing client reports. */
export function buildClientReport(customer: Customer) {
  const yearlySpend = avgYearlySpending(customer.spendingHistory);
  const input = {
    totalFund: customer.balance,
    age: customer.age,
    monthlySalary: customer.monthlySalary,
    monthlyExpenses: customer.monthlyExpenses,
    householdMembers: customer.householdMembers,
    plannedLoans: [],
  };
  const exposure = assessEmergencyExposure(input);
  const allocation = recommendAllocation(input, exposure);
  const score = scoreCustomer(customer);
  const name = `${customer.firstName} ${customer.lastName}`;

  return {
    name,
    customerId: customer.id,
    featured: Boolean(customer.featured),
    status: customer.status,
    score,
    exposureLabel: exposure.label,
    drivers: exposure.drivers,
    figures: [
      { label: "Deposit balance", value: formatCurrency(customer.balance) },
      { label: "Monthly salary", value: formatCurrency(customer.monthlySalary) },
      { label: "Monthly expenses", value: formatCurrency(customer.monthlyExpenses) },
      { label: "Yearly spend (avg)", value: formatCurrency(yearlySpend) },
      { label: "Other yearly earnings", value: formatCurrency(customer.otherYearlyEarnings) },
      { label: "Age", value: String(customer.age) },
      { label: "Household size", value: String(customer.householdMembers) },
      { label: "Priority score", value: String(score) },
      { label: "Emergency exposure", value: exposure.label },
    ],
    buckets: [
      {
        id: "emergency",
        title: "Emergency",
        body: "Liquid buffer from monthly spending.",
        pct: Math.round(allocation.liquidity),
        amount: allocation.amounts.liquidity,
      },
      {
        id: "safe",
        title: "Safe",
        body: "Near-term needs, low volatility.",
        pct: Math.round(allocation.safe),
        amount: allocation.amounts.safe,
      },
      {
        id: "growth",
        title: "Growth",
        body: "Long-term compounding at stated risk.",
        pct: Math.round(allocation.growth),
        amount: allocation.amounts.growth,
      },
    ],
    reasons: allocation.reasons,
  };
}

export type ClientReport = ReturnType<typeof buildClientReport>;
