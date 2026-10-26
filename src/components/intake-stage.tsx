"use client";

import { useEffect, type ReactNode } from "react";
import { Logo } from "@/components/logo";
import { StepLink, useStepBriefing } from "@/components/step-briefing";
import { useIsMobileLg } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

type IntakeStageProps = {
  title: string;
  body: string;
  aside?: ReactNode;
  /** Phone frame node (already wrapped) */
  phone: ReactNode;
  ariaLabel?: string;
  nextHref?: string;
  nextStepId?: "intake" | "plan" | "signal" | "report";
  nextLabel?: string;
  /** When true, the orange next/back control cannot navigate */
  nextDisabled?: boolean;
  nextDisabledHint?: string;
};

/**
 * Full-viewport glowing stage for Heir intake — covers app chrome.
 */
export function IntakeStage({
  title,
  body,
  aside,
  phone,
  ariaLabel = "Customer intake",
  nextHref = "/customer/plan",
  nextStepId = "plan",
  nextLabel = "Next: Plan →",
  nextDisabled = false,
  nextDisabledHint = "Finish this step first",
}: IntakeStageProps) {
  const isMobile = useIsMobileLg();
  const { showHelp, helpOpen, hideHelp } = useStepBriefing();

  useEffect(() => {
    if (isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobile]);

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[45] bg-white">{phone}</div>
    );
  }

  return (
    <div
      className="intake-stage-glow fixed inset-0 z-[45] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div className="relative z-[1] flex h-full min-h-0 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3 px-6 py-4 xl:px-10">
          <Logo className="h-8" />
          <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    helpOpen
                      ? hideHelp()
                      : showHelp(nextStepId === "signal" ? "plan" : nextStepId)
                  }
                  className="inline-flex h-10 items-center rounded-lg border border-white/25 bg-white/10 px-3.5 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20"
                >
                  {helpOpen ? "Hide guide" : "Guide"}
                </button>
                {nextDisabled ? (
                  <button
                    type="button"
                    disabled
                    title={nextDisabledHint}
                    className="inline-flex h-10 cursor-not-allowed items-center rounded-lg bg-orange/40 px-4 text-sm font-bold text-ink/50"
                  >
                    {nextLabel}
                  </button>
                ) : (
                  <StepLink
                    href={nextHref}
                    stepId={nextStepId === "signal" ? "signal" : nextStepId}
                    className="inline-flex h-10 items-center rounded-lg bg-orange px-4 text-sm font-bold text-ink hover:bg-orange-deep"
                  >
                    {nextLabel}
                  </StepLink>
                )}
          </div>
        </header>

        <div className="flex min-h-0 flex-1 items-center justify-center gap-8 px-8 pb-6 xl:gap-12 xl:px-12">
          <aside className="max-w-sm text-white">
            <p className="text-sm font-bold text-orange">Step 5 · Intake</p>
            <h1 className="font-display mt-1 text-2xl tracking-tight xl:text-[1.75rem]">
              {title}
            </h1>
            <p className="mt-2 text-base leading-6 text-white/75">{body}</p>
            {aside}
          </aside>

          <div className="intake-phone-halo shrink-0 rounded-[2rem]">{phone}</div>
        </div>
      </div>
    </div>
  );
}

export function IntakeChecklist({
  items,
}: {
  items: { n: number; label: string; done: boolean; active?: boolean }[];
}) {
  return (
    <ol className="mt-5 grid gap-2">
      {items.map((item) => (
        <li
          key={item.n}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold backdrop-blur-sm",
            item.done
              ? "bg-white/15 text-white"
              : item.active
                ? "bg-orange text-ink"
                : "bg-white/8 text-white/55",
          )}
        >
          <span
            className={cn(
              "grid h-6 w-6 place-items-center rounded-full text-xs font-bold",
              item.done
                ? "bg-blue text-white"
                : item.active
                  ? "bg-white text-ink"
                  : "bg-white/10 text-white/70",
            )}
          >
            {item.done ? "✓" : item.n}
          </span>
          {item.label}
        </li>
      ))}
    </ol>
  );
}

/** Shared tall phone shell for the glowing stage */
export const INTAKE_PHONE_CLASS =
  "h-[min(820px,calc(100svh-5.5rem))] w-[390px] max-w-[390px]";
