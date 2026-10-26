"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { scoreCustomer, summarizeSpending } from "@/lib/ai";
import type { Customer, CustomerPlanSnapshot } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

type Period = "monthly" | "quarterly" | "half" | "yearly";

function aggregateSpending(customer: Customer, period: Period) {
  const history = customer.spendingHistory;
  if (period === "monthly") {
    return history.slice(-24).map((r) => ({
      label: `${r.year}-${String(r.month).padStart(2, "0")}`,
      amount: r.amount,
    }));
  }
  if (period === "yearly") {
    const byYear = new Map<number, number>();
    for (const r of history) {
      byYear.set(r.year, (byYear.get(r.year) ?? 0) + r.amount);
    }
    return [...byYear.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([year, amount]) => ({ label: String(year), amount }));
  }
  // quarterly / half
  const buckets = new Map<string, number>();
  for (const r of history) {
    const key =
      period === "quarterly"
        ? `${r.year}-Q${Math.ceil(r.month / 3)}`
        : `${r.year}-H${r.month <= 6 ? 1 : 2}`;
    buckets.set(key, (buckets.get(key) ?? 0) + r.amount);
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-16)
    .map(([label, amount]) => ({ label, amount }));
}

export function CustomerPanel({
  customer,
  plan,
  mode = "outreach",
  onApprove,
  onNotify,
  onBook,
  onClose,
}: {
  customer: Customer;
  plan: CustomerPlanSnapshot | null;
  /** analysis = Step 1 report only; outreach = approve / notify actions */
  mode?: "analysis" | "outreach";
  onApprove?: () => void;
  onNotify?: () => void;
  onBook?: () => void;
  onClose?: () => void;
}) {
  const [period, setPeriod] = useState<Period>("yearly");
  const chartData = useMemo(
    () => aggregateSpending(customer, period),
    [customer, period]
  );
  const why = summarizeSpending(customer);
  const score = scoreCustomer(customer);
  const showPlan =
    mode === "outreach" &&
    plan &&
    plan.customerId === customer.id &&
    (customer.status === "Engaged" || customer.status === "Meeting booked");
  const showActions = mode === "outreach";

  return (
    <aside
      className="flex h-full max-h-[100dvh] flex-col border-pnc-border bg-white lg:border-l"
      aria-label="Customer detail panel"
    >
      <div className="flex items-start justify-between gap-2 border-b border-pnc-border p-4">
        <div>
          <h2 className="text-lg font-bold text-pnc-navy">
            {customer.firstName} {customer.lastName}
          </h2>
          <p className="text-sm text-pnc-slate">
            {formatCurrency(customer.balance)} · Priority {score}
          </p>
          <Badge className="mt-2" variant="outline">
            {customer.status}
          </Badge>
        </div>
        {onClose && (
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <section>
          <h3 className="text-sm font-semibold text-pnc-navy">
            Why this customer
          </h3>
          <p className="mt-1 text-sm text-pnc-slate">{why}</p>
        </section>

        <section>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-pnc-navy">Spending</h3>
            <div
              role="group"
              aria-label="Spending period"
              className="flex flex-wrap gap-1"
            >
              {(
                [
                  ["monthly", "Monthly"],
                  ["quarterly", "Quarterly"],
                  ["half", "Half-year"],
                  ["yearly", "Yearly"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPeriod(value)}
                  className={
                    period === value
                      ? "rounded bg-pnc-blue px-2 py-0.5 text-[11px] font-semibold text-white"
                      : "rounded px-2 py-0.5 text-[11px] text-pnc-slate hover:bg-pnc-bg"
                  }
                  aria-pressed={period === value}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d8e0ea" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis
                  tickFormatter={(v) => formatCurrency(v, true)}
                  width={48}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="amount" fill="#003da5" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {showPlan && plan && (
          <section className="rounded-lg border border-pnc-border bg-pnc-bg/50 p-3">
            <h3 className="text-sm font-semibold text-pnc-navy">
              Intake summary
            </h3>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-pnc-slate">Age</dt>
                <dd className="font-medium">{plan.age}</dd>
              </div>
              <div>
                <dt className="text-pnc-slate">Household</dt>
                <dd className="font-medium">{plan.householdMembers}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-pnc-slate">Planned expenses</dt>
                <dd className="font-medium">
                  {plan.plannedLoans.length
                    ? plan.plannedLoans.join(", ")
                    : "None"}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-pnc-slate">Emergency exposure</dt>
                <dd className="font-medium">{plan.exposureLabel}</dd>
              </div>
            </dl>
            <p className="mt-3 text-sm text-pnc-navy">
              Recommended plan: Liquidity {plan.allocation.liquidity}% · Safe{" "}
              {plan.allocation.safe}% · Growth {plan.allocation.growth}%
            </p>
            <p className="mt-1 text-xs text-pnc-slate">
              RM view shows only the qualitative exposure label and plan — never
              raw health or habit inputs.
            </p>
            {(plan.preferredContact || plan.preferredTime) && (
              <p className="mt-3 text-sm">
                Preferred: {plan.preferredContact ?? "—"} ·{" "}
                {plan.preferredTime ?? "—"}
              </p>
            )}
          </section>
        )}
      </div>

      {showActions ? (
        <div className="flex flex-col gap-2 border-t border-pnc-border p-4">
          <div className="flex flex-wrap gap-2">
            {customer.status === "New" && onApprove && (
              <Button type="button" onClick={onApprove}>
                Approve outreach
              </Button>
            )}
            {(customer.status === "New" || customer.status === "Approved") &&
              onNotify && (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={customer.status !== "Approved"}
                  title={
                    customer.status !== "Approved"
                      ? "Approve outreach first"
                      : undefined
                  }
                  onClick={onNotify}
                >
                  Send notification
                </Button>
              )}
            {customer.status === "Engaged" && onBook && (
              <Button type="button" onClick={onBook}>
                Book meeting
              </Button>
            )}
            {customer.status === "Meeting booked" && (
              <Badge variant="success">Meeting booked</Badge>
            )}
          </div>
          {customer.status === "New" && (
            <p className="text-xs text-pnc-slate">
              Approve first — then Send notification unlocks Intake.
            </p>
          )}
          {customer.status === "Approved" && (
            <p className="text-xs font-semibold text-pnc-navy">
              Approved. Send the notification to unlock Intake.
            </p>
          )}
          {customer.status === "Notified" && (
            <p className="text-xs text-pnc-slate">
              Notification sent. Continue to Intake (Heir view).
            </p>
          )}
        </div>
      ) : (
        <div className="border-t border-pnc-border p-4">
          <p className="text-xs leading-5 text-pnc-slate">
            Full report for analysis. Approve and notify happen later on
            Outreach, after the Principal allows a call.
          </p>
        </div>
      )}
    </aside>
  );
}
