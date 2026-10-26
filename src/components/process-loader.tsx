"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type LoaderStage = {
  label: string;
  detail: string;
};

type ProcessLoaderProps = {
  stages: LoaderStage[];
  /** ms per stage before advancing */
  stageMs?: number;
  title?: string;
  onDone?: () => void;
  className?: string;
  /** full overlay vs inline card */
  variant?: "overlay" | "card";
};

/**
 * Attractive multi-stage loader with plain-language status text.
 */
export function ProcessLoader({
  stages,
  stageMs = 900,
  title = "Working…",
  onDone,
  className,
  variant = "overlay",
}: ProcessLoaderProps) {
  const [index, setIndex] = useState(0);
  const current = stages[Math.min(index, stages.length - 1)];
  const progress = ((index + 1) / stages.length) * 100;

  useEffect(() => {
    if (index >= stages.length - 1) {
      const done = window.setTimeout(() => onDone?.(), stageMs * 0.65);
      return () => window.clearTimeout(done);
    }
    const t = window.setTimeout(() => setIndex((i) => i + 1), stageMs);
    return () => window.clearTimeout(t);
  }, [index, onDone, stageMs, stages.length]);

  const body = (
    <div
      className={cn(
        "w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-xl sm:p-8",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-3">
        <span className="process-spinner shrink-0" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-bold uppercase tracking-wide text-blue">{title}</p>
          <p className="mt-1 font-display text-2xl tracking-tight text-ink">{current.label}</p>
        </div>
      </div>
      <p className="mt-3 text-base leading-7 text-muted">{current.detail}</p>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-mist">
        <div
          className="process-bar h-full rounded-full bg-orange transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ol className="mt-5 grid gap-2">
        {stages.map((stage, i) => {
          const done = i < index;
          const active = i === index;
          return (
            <li
              key={stage.label}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm",
                active && "bg-orange-soft font-semibold text-ink",
                done && "text-muted",
                !done && !active && "text-faint",
              )}
            >
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold",
                  done && "bg-blue text-white",
                  active && "bg-orange text-ink",
                  !done && !active && "bg-mist text-muted",
                )}
              >
                {done ? "✓" : i + 1}
              </span>
              <span className="truncate">{stage.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );

  if (variant === "card") return body;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/50 p-4 backdrop-blur-[2px]">
      {body}
    </div>
  );
}

export const OUTREACH_LOADER: LoaderStage[] = [
  {
    label: "Reading the book signal",
    detail: "Matching this customer to continuity priority for Pilot family.",
  },
  {
    label: "Scoring idle cash & spending",
    detail: "AI ranks deposit balance and five-year spending for outreach.",
  },
  {
    label: "Ready for your decision",
    detail: "You approve outreach. Nothing is sent until you do.",
  },
];

export const PLAN_BUILD_LOADER: LoaderStage[] = [
  {
    label: "Reading spending history",
    detail: "Sizing the emergency buffer from monthly cash needs.",
  },
  {
    label: "Checking idle cash",
    detail: "Seeing what sits on deposit that could be put to work.",
  },
  {
    label: "Balancing income & expenses",
    detail: "Income, household size, and planned costs shape the split.",
  },
  {
    label: "Applying risk & future plans",
    detail: "Growth is sized to risk. Near-term needs stay in Safe.",
  },
  {
    label: "Suggesting Emergency · Safe · Growth",
    detail: "AI proposes a split. You and the customer still decide.",
  },
];

export const INTAKE_FINISH_LOADER: LoaderStage[] = [
  {
    label: "Confirming your answers",
    detail: "Saving intake for Heir Pilot — health only if you consented.",
  },
  {
    label: "AI analyzing your profile",
    detail: "Spending, cash, income, risk, medical needs, and future plans.",
  },
  {
    label: "Building your draft plan",
    detail: "Emergency fund, Safe, and Growth — ready for Advisor review.",
  },
];
