"use client";

import { useEffect, useMemo, useState } from "react";
import { AiDecisionFlow } from "@/components/ai-decision-flow";
import { IntakeGate } from "@/components/intake-gate";
import {
  INTAKE_PHONE_CLASS,
  IntakeChecklist,
  IntakeStage,
} from "@/components/intake-stage";
import { PhoneFrame } from "@/components/phone-frame";
import { PlannerApp } from "@/components/planner/planner-app";
import { PLAN_BUILD_LOADER, ProcessLoader } from "@/components/process-loader";
import { FEATURED_CUSTOMER_ID } from "@/data/story";
import { useLegacy } from "@/domain/store";
import { useIsMobileLg } from "@/hooks/use-media-query";
import { markDemoCompleted } from "@/lib/demo-completion";
import { useDemoStore } from "@/store/demo-store";
import { cn } from "@/lib/utils";

export default function CustomerPlanPage() {
  const { dispatch } = useLegacy();
  const plan = useDemoStore((s) => s.planSnapshot);
  const heirChoice = useDemoStore((s) => s.heirChoice);
  const intakeDone = useDemoStore((s) => s.intake.completed);
  const customers = useDemoStore((s) => s.customers);
  const isMobile = useIsMobileLg();
  // Intake chat already ran build + AI analysis once — skip the repeat here
  const [phase, setPhase] = useState<"loading" | "diagram" | "ready">(() =>
    plan ? "ready" : "loading",
  );
  const planReviewDone = phase === "ready" && Boolean(heirChoice);
  const canLeave = intakeDone && planReviewDone;

  const client = useMemo(() => {
    const id = plan?.customerId ?? FEATURED_CUSTOMER_ID;
    return (
      customers.find((c) => c.id === id) ??
      customers.find((c) => c.featured) ??
      null
    );
  }, [customers, plan?.customerId]);

  useEffect(() => {
    if (plan && phase !== "ready") setPhase("ready");
  }, [plan, phase]);

  useEffect(() => {
    if (!canLeave || !client) return;
    dispatch({
      type: "intakeComplete",
      clientName: `${client.firstName} ${client.lastName}`,
      customerId: client.id,
    });
    markDemoCompleted();
  }, [canLeave, client, dispatch]);

  const buckets = useMemo(() => {
    const liq = plan?.allocation.liquidity ?? 28;
    const safe = plan?.allocation.safe ?? 37;
    const growth = plan?.allocation.growth ?? 35;
    return [
      {
        id: "emergency",
        title: "Emergency",
        body: "Liquid buffer from monthly spending.",
        pct: liq,
      },
      {
        id: "safe",
        title: "Safe",
        body: "Near-term needs, low volatility.",
        pct: safe,
      },
      {
        id: "growth",
        title: "Growth",
        body: "Long-term compounding at stated risk.",
        pct: growth,
      },
    ];
  }, [plan]);

  return (
    <IntakeGate>
      <IntakeStage
        title="Your plan"
        body="Review the draft split — then choose Save or Reinvest."
        ariaLabel="Diversification plan"
        nextHref="/dashboard"
        nextStepId="signal"
        nextLabel="Back to AI Analysis →"
        nextDisabled={!canLeave}
        nextDisabledHint="Choose Save or Reinvest in the plan before leaving"
        aside={
          <IntakeChecklist
            items={[
              {
                n: 1,
                label: "AI built your draft",
                done: Boolean(plan) || phase !== "loading",
                active: phase === "loading",
              },
              {
                n: 2,
                label: "You review the plan",
                done: planReviewDone,
                active: phase === "ready" && !planReviewDone,
              },
            ]}
          />
        }
        phone={
          <PhoneFrame
            title={
              phase === "loading"
                ? "Building plan"
                : phase === "diagram"
                  ? "AI analysis"
                  : "Your Plan"
            }
            className={cn(isMobile ? "h-full max-w-none" : INTAKE_PHONE_CLASS)}
            fillHeight
            chrome={!isMobile}
          >
            {phase === "loading" ? (
              <div className="flex h-full min-h-0 flex-1 flex-col justify-center overflow-y-auto bg-[#f7f9fc] p-3">
                <ProcessLoader
                  variant="card"
                  title="Building the plan"
                  stages={PLAN_BUILD_LOADER}
                  stageMs={750}
                  className="max-w-none border-0 p-3 shadow-none sm:p-3"
                  onDone={() => setPhase("diagram")}
                />
              </div>
            ) : phase === "diagram" ? (
              <AiDecisionFlow
                phone
                animate
                subject="Heir Whitfield's intake"
                buckets={buckets}
                onComplete={() => setPhase("ready")}
              />
            ) : (
              <div className="h-full min-h-0 flex-1 overflow-y-auto p-3">
                <PlannerApp title="Your Plan" stacked />
              </div>
            )}
          </PhoneFrame>
        }
      />
    </IntakeGate>
  );
}
