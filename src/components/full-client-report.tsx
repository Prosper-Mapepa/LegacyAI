"use client";

import { useMemo } from "react";
import { AiDecisionFlow } from "@/components/ai-decision-flow";
import { Badge } from "@/components/ui/badge";
import { StepLink } from "@/components/step-briefing";
import { FEATURED_CUSTOMER_ID } from "@/data/story";
import { buildClientReport } from "@/lib/client-report";
import { formatCurrency } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";

/** Step 4 — post-intake full report for the Advisor. */
export function FullClientReport() {
  const customers = useDemoStore((s) => s.customers);
  const plan = useDemoStore((s) => s.planSnapshot);
  const heirChoice = useDemoStore((s) => s.heirChoice);
  const intake = useDemoStore((s) => s.intake);

  const customer = useMemo(() => {
    const id = plan?.customerId ?? FEATURED_CUSTOMER_ID;
    return (
      customers.find((c) => c.id === id) ??
      customers.find((c) => c.featured) ??
      null
    );
  }, [customers, plan?.customerId]);

  if (!customer || !plan || !intake.completed || !heirChoice) {
    return (
      <div className="rounded-xl border border-line border-l-4 border-l-orange bg-white p-6">
        <p className="text-base font-semibold text-ink">Report not ready</p>
        <p className="mt-2 text-sm leading-6 text-muted">
          The Heir must finish intake and choose Save or Reinvest before the full
          report appears here.
        </p>
        <StepLink
          href="/customer"
          stepId="intake"
          className="mt-4 inline-flex h-10 items-center rounded-lg bg-orange px-4 text-sm font-bold text-ink hover:bg-orange-deep"
        >
          Continue intake →
        </StepLink>
      </div>
    );
  }

  const report = buildClientReport(customer);
  const alloc = plan.allocation;
  const clientName = `${customer.firstName} ${customer.lastName}`;
  const preference =
    heirChoice === "save" ? "Save" : "Reinvest with LegacyAI";

  const analysisSignals = [
    {
      id: "intake",
      label: "Intake answers",
      finding: "Guided questions sized Safe and Growth for stated goals.",
    },
    {
      id: "spend",
      label: "Spending history",
      finding: "Five-year spend pattern sets the emergency buffer floor.",
    },
    {
      id: "cash",
      label: "Deposit capacity",
      finding: "Balance on file flagged as put-to-work capacity.",
    },
    {
      id: "cashflow",
      label: "Income & expenses",
      finding: "Monthly cash flow shapes near-term Safe share.",
    },
    {
      id: "exposure",
      label: "Emergency exposure",
      finding: `Qualitative band: ${plan.exposureLabel}. Raw health notes stay private.`,
    },
    {
      id: "preference",
      label: "Heir preference",
      finding: `Recorded choice: ${preference}. Advisor still confirms next steps.`,
    },
  ];

  const analysisBuckets = [
    {
      id: "emergency",
      title: "Emergency",
      body: "Liquid buffer from monthly spending.",
      pct: Math.round(alloc.liquidity),
      amount: alloc.amounts.liquidity,
    },
    {
      id: "safe",
      title: "Safe",
      body: "Near-term needs, low volatility.",
      pct: Math.round(alloc.safe),
      amount: alloc.amounts.safe,
    },
    {
      id: "growth",
      title: "Growth",
      body: "Long-term compounding at stated risk.",
      pct: Math.round(alloc.growth),
      amount: alloc.amounts.growth,
    },
  ];

  return (
    <div className="grid gap-5">
      <section className="rounded-xl border border-line border-l-4 border-l-orange bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue">
              Full report · post-intake
            </p>
            <h2 className="font-display mt-1 text-3xl tracking-tight text-ink">
              {clientName}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Intake complete · preference recorded
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="orange">{customer.status}</Badge>
            <span className="rounded-lg bg-navy px-2.5 py-1 text-sm font-bold text-white">
              Priority {report.score}
            </span>
            <span className="rounded-lg bg-blue-soft px-2.5 py-1 text-sm font-semibold text-blue">
              Exposure {plan.exposureLabel}
            </span>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Deposit balance", value: formatCurrency(customer.balance) },
            {
              label: "Plan fund",
              value: formatCurrency(plan.totalFund),
            },
            {
              label: "Monthly salary",
              value: formatCurrency(plan.monthlySalary),
            },
            {
              label: "Monthly expenses",
              value: formatCurrency(plan.monthlyExpenses),
            },
            { label: "Age", value: String(plan.age) },
            {
              label: "Household",
              value: String(plan.householdMembers),
            },
            {
              label: "Planned loans",
              value: plan.plannedLoans.length
                ? plan.plannedLoans.join(", ")
                : "None",
            },
            {
              label: "Heir preference",
              value: preference,
            },
          ].map((fig) => (
            <div key={fig.label} className="min-w-0 rounded-lg bg-mist px-3 py-2.5">
              <dt className="text-xs text-muted">{fig.label}</dt>
              <dd className="mt-0.5 truncate text-base font-bold text-ink">
                {fig.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="grid gap-3">
        <div>
          <h3 className="text-lg font-bold text-ink">AI Analysis</h3>
          <p className="mt-1 text-sm text-muted">
            LegacyAI model pass on {clientName} after intake — you still decide.
          </p>
        </div>
        <AiDecisionFlow
          key={`${customer.id}-${heirChoice}`}
          animate
          defaultCollapsed={false}
          collapsible
          subject={clientName}
          signals={analysisSignals}
          buckets={analysisBuckets}
          report={{
            name: clientName,
            figures: [
              {
                label: "Plan fund",
                value: formatCurrency(plan.totalFund),
              },
              {
                label: "Exposure",
                value: plan.exposureLabel,
              },
              {
                label: "Priority score",
                value: String(report.score),
              },
              {
                label: "Heir preference",
                value: preference,
              },
            ],
            reasons: [
              ...plan.drivers,
              ...alloc.reasons,
              `Heir preference recorded: ${preference}.`,
            ],
            exposureLabel: plan.exposureLabel,
            score: report.score,
            status: customer.status,
          }}
        />
      </section>

      <section className="rounded-xl border border-line bg-white p-5 sm:p-6">
        <h3 className="text-lg font-bold text-ink">Suggested split</h3>
        <p className="mt-1 text-sm text-muted">
          Model proposal after intake. Advisor and customer still decide.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            {
              title: "Emergency",
              pct: Math.round(alloc.liquidity),
              amount: alloc.amounts.liquidity,
            },
            {
              title: "Safe",
              pct: Math.round(alloc.safe),
              amount: alloc.amounts.safe,
            },
            {
              title: "Growth",
              pct: Math.round(alloc.growth),
              amount: alloc.amounts.growth,
            },
          ].map((bucket) => (
            <div
              key={bucket.title}
              className="rounded-xl border border-line bg-mist p-4"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-display font-bold text-navy">{bucket.title}</p>
                <p className="text-sm font-bold text-blue">{bucket.pct}%</p>
              </div>
              <p className="mt-1 text-base font-semibold text-ink">
                {formatCurrency(bucket.amount)}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-orange"
                  style={{ width: `${bucket.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {(plan.drivers.length > 0 || alloc.reasons.length > 0) && (
        <section className="rounded-xl border border-line bg-white p-5 sm:p-6">
          <h3 className="text-lg font-bold text-ink">Why this split</h3>
          <ul className="mt-3 space-y-2">
            {[...plan.drivers, ...alloc.reasons].map((line) => (
              <li
                key={line}
                className="text-sm leading-6 text-ink before:mr-2 before:text-orange before:content-['•']"
              >
                {line}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">
            Lesson answers and raw health notes stay private. This report shows
            only consented, qualitative factors.
          </p>
        </section>
      )}

      {(plan.preferredContact || plan.preferredTime) && (
        <section className="rounded-xl border border-line bg-white px-5 py-4">
          <p className="text-sm text-ink">
            Preferred contact:{" "}
            <strong>{plan.preferredContact ?? "—"}</strong>
            {plan.preferredTime ? (
              <>
                {" "}
                · <strong>{plan.preferredTime}</strong>
              </>
            ) : null}
          </p>
        </section>
      )}
    </div>
  );
}
