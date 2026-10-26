"use client";

import { useMemo, useState } from "react";
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { explainAllocation, projectGrowth } from "@/lib/ai";
import type {
  AllocationResult,
  EmergencyExposure,
  Heir,
  PlannerInput,
} from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

const COLORS = {
  liquidity: "#003da5",
  safe: "#5a6a7a",
  growth: "#f57c00",
};

const LABEL_VARIANT: Record<
  EmergencyExposure["label"],
  "success" | "muted" | "warning" | "orange"
> = {
  Low: "success",
  Moderate: "muted",
  Elevated: "warning",
  High: "orange",
};

export function PlannerResults({
  input,
  exposure,
  allocation,
  unclassifiedNote,
  heir,
  heirChoice,
  onHeirChoice,
  compact = false,
}: {
  input: PlannerInput;
  exposure: EmergencyExposure;
  allocation: AllocationResult;
  unclassifiedNote?: boolean;
  heir?: Heir;
  heirChoice?: "save" | "reinvest" | null;
  onHeirChoice?: (c: "save" | "reinvest") => void;
  compact?: boolean;
}) {
  const explanations = explainAllocation(allocation);
  const [years, setYears] = useState(15);
  const [assumedReturn, setAssumedReturn] = useState(0.06);
  const totalFund = input.totalFund;

  const pieData = [
    {
      name: "Liquidity",
      value: allocation.liquidity,
      amount: allocation.amounts.liquidity,
      key: "liquidity" as const,
    },
    {
      name: "Safe Investment",
      value: allocation.safe,
      amount: allocation.amounts.safe,
      key: "safe" as const,
    },
    {
      name: "Growth",
      value: allocation.growth,
      amount: allocation.amounts.growth,
      key: "growth" as const,
    },
  ];

  const growthSeries = useMemo(
    () => projectGrowth(allocation.amounts.growth, years, assumedReturn),
    [allocation.amounts.growth, years, assumedReturn]
  );
  const growthStart = allocation.amounts.growth;
  const growthEnd = growthSeries[growthSeries.length - 1]?.value ?? growthStart;
  const compoundInterestEarned = Math.max(0, growthEnd - growthStart);

  const dependents = Math.max(0, input.householdMembers - 1);
  const monthlySurplus = input.monthlySalary - input.monthlyExpenses;

  const pad = compact ? "p-4" : undefined;

  return (
    <div
      className={cn(
        "space-y-4 text-sm leading-relaxed text-pnc-navy",
        compact && "space-y-3"
      )}
    >
      <div
        role="status"
        className="rounded-md border border-pnc-blue/30 bg-blue-50 px-3 py-2.5 text-sm font-medium text-pnc-navy"
      >
        Guidance only — reviewed by your RM before you act. Not financial
        advice.
      </div>

      <Card className="overflow-hidden border-pnc-blue/30">
        <CardHeader className={cn("pb-2", pad && `${pad} pb-2`)}>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <CardTitle className="text-base font-bold text-pnc-navy sm:text-lg">
              Your personalized plan
            </CardTitle>
            <Badge
              variant={LABEL_VARIANT[exposure.label]}
              className="w-fit shrink-0"
            >
              Exposure: {exposure.label}
            </Badge>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-pnc-navy">
            Built from your {formatCurrency(totalFund)} fund, age {input.age},{" "}
            {formatCurrency(input.monthlyExpenses)}/mo expenses
            {dependents > 0
              ? `, and ${input.householdMembers} people at home`
              : ""}
            {input.plannedLoans.length > 0
              ? `, plus planned ${input.plannedLoans.join(", ")} expenses`
              : ""}
            . Monthly surplus about {formatCurrency(monthlySurplus)}.
          </p>
        </CardHeader>
        <CardContent className={cn(pad && `${pad} pt-0`)}>
          <div className="relative mx-auto h-44 w-full max-w-xs">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={2}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.key} fill={COLORS[entry.key]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value, name, props) => [
                    `${value}% (${formatCurrency(Number(props.payload.amount))})`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 grid grid-cols-1 gap-2">
            <div className="flex items-center justify-between gap-2 rounded-md border border-pnc-blue/30 bg-blue-50 px-3 py-3">
              <div>
                <p className="text-sm font-bold text-pnc-blue">
                  Emergency fund · Liquidity
                </p>
                <p className="text-sm text-pnc-navy">Cash you can reach fast</p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-pnc-navy">
                  {allocation.liquidity}%
                </p>
                <p className="text-sm font-semibold text-pnc-navy">
                  {formatCurrency(allocation.amounts.liquidity)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-md border border-pnc-border bg-slate-50 px-3 py-3">
              <div>
                <p className="text-sm font-bold text-pnc-navy">
                  Safe investment
                </p>
                <p className="text-sm text-pnc-navy">Stability near-term</p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-pnc-navy">
                  {allocation.safe}%
                </p>
                <p className="text-sm font-semibold text-pnc-navy">
                  {formatCurrency(allocation.amounts.safe)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-md border border-pnc-orange/30 bg-orange-50 px-3 py-3">
              <div>
                <p className="text-sm font-bold text-pnc-orange-dark">
                  Long-term growth
                </p>
                <p className="text-sm text-pnc-navy">Compound over years</p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-pnc-navy">
                  {allocation.growth}%
                </p>
                <p className="text-sm font-semibold text-pnc-navy">
                  {formatCurrency(allocation.amounts.growth)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className={cn("pb-2", pad && `${pad} pb-2`)}>
          <CardTitle className="text-base font-bold text-pnc-navy">
            Why this fits you
          </CardTitle>
        </CardHeader>
        <CardContent className={cn("space-y-2", pad && `${pad} pt-0`)}>
          <ul className="space-y-2 text-sm leading-relaxed text-pnc-navy">
            {exposure.drivers.map((d) => (
              <li key={d} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-pnc-orange" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
          {unclassifiedNote && (
            <p className="text-sm text-pnc-warning">
              We couldn&apos;t classify one optional detail; an advisor can
              refine it.
            </p>
          )}
          <details className="pt-1 text-sm text-pnc-navy">
            <summary className="cursor-pointer font-semibold text-pnc-navy">
              What each bucket means
            </summary>
            <div className="mt-2 space-y-2 leading-relaxed">
              <p>{explanations.liquidity}</p>
              <p>{explanations.safe}</p>
              <p>{explanations.growth}</p>
            </div>
          </details>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className={cn(pad && `${pad} pb-2`)}>
          <CardTitle className="text-base font-bold text-pnc-navy">
            Growth over time
          </CardTitle>
          <p className="mt-1 text-sm text-pnc-navy">
            Illustrative compound interest on your Growth bucket (annual
            compounding) — not a guarantee.
          </p>
        </CardHeader>
        <CardContent className={cn("space-y-3", pad && `${pad} pt-0`)}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="years" className="text-sm font-medium">
                Years ({years})
              </Label>
              <input
                id="years"
                type="range"
                min={5}
                max={30}
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-pnc-orange"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ret" className="text-sm font-medium">
                Annual return ({(assumedReturn * 100).toFixed(0)}%, compounded)
              </Label>
              <input
                id="ret"
                type="range"
                min={2}
                max={10}
                step={1}
                value={assumedReturn * 100}
                onChange={(e) =>
                  setAssumedReturn(Number(e.target.value) / 100)
                }
                className="w-full accent-pnc-blue"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-lg border border-pnc-border bg-pnc-bg/60 px-3 py-2.5 text-center">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-pnc-slate">
                Start
              </p>
              <p className="mt-0.5 text-sm font-semibold text-pnc-navy">
                {formatCurrency(growthStart)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-pnc-slate">
                After {years} yrs
              </p>
              <p className="mt-0.5 text-sm font-semibold text-pnc-navy">
                {formatCurrency(growthEnd)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-pnc-slate">
                Interest earned
              </p>
              <p className="mt-0.5 text-sm font-semibold text-pnc-orange">
                +{formatCurrency(compoundInterestEarned)}
              </p>
            </div>
          </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d8e0ea" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(v) => formatCurrency(v, true)}
                  width={52}
                  tick={{ fontSize: 12 }}
                />
                <RechartsTooltip
                  formatter={(v: number) => formatCurrency(v)}
                  labelFormatter={(l) => `Year ${l}`}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#f57c00"
                  strokeWidth={2}
                  dot={false}
                  name="Compounded value"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        <Card>
          <CardHeader className={cn("pb-2", pad && `${pad} pb-2`)}>
            <CardTitle className="text-base font-bold text-pnc-navy">
              Healthcare readiness
            </CardTitle>
          </CardHeader>
          <CardContent
            className={cn("text-sm leading-relaxed text-pnc-navy", pad && `${pad} pt-0`)}
          >
            Your Liquidity slice (
            {formatCurrency(allocation.amounts.liquidity)}) is sized from your{" "}
            {formatCurrency(input.monthlyExpenses)} monthly expenses so
            short-term care or household shocks need not force selling long-term
            investments.
          </CardContent>
        </Card>

        {heir && (
          <Card>
            <CardHeader className={cn("pb-2", pad && `${pad} pb-2`)}>
              <CardTitle className="text-base font-bold text-pnc-navy">
                Heir transfer
              </CardTitle>
              <p className="mt-1 text-sm text-pnc-navy">
                {heir.name} ({heir.relationship}) — Growth portion
              </p>
            </CardHeader>
            <CardContent className={cn("space-y-2", pad && `${pad} pt-0`)}>
              <p className="text-xl font-bold text-pnc-navy">
                {formatCurrency(allocation.amounts.growth)}
              </p>
              <p className="text-sm text-pnc-navy">
                If this Growth amount were designated for {heir.name}, they
                could save or reinvest with an advisor.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={heirChoice === "save" ? "default" : "outline"}
                  onClick={() => onHeirChoice?.("save")}
                >
                  Save
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={heirChoice === "reinvest" ? "secondary" : "outline"}
                  onClick={() => onHeirChoice?.("reinvest")}
                >
                  Reinvest with LegacyAI
                </Button>
              </div>
              {heirChoice && (
                <p className="text-sm font-medium text-pnc-success" role="status">
                  Preference recorded:{" "}
                  {heirChoice === "save" ? "Save" : "Reinvest with LegacyAI"}.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
