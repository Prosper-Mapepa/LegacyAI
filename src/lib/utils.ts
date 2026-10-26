import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function avgYearlySpending(
  history: { year: number; amount: number }[]
): number {
  const byYear = new Map<number, number>();
  for (const row of history) {
    byYear.set(row.year, (byYear.get(row.year) ?? 0) + row.amount);
  }
  const years = [...byYear.values()];
  if (years.length === 0) return 0;
  return years.reduce((a, b) => a + b, 0) / years.length;
}
