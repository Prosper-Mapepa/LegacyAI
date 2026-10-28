"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { usePerson } from "@/domain/accounts";
import { useLegacy } from "@/domain/store";
import {
  DEMO_FLOW,
  hubStep,
  isDemoStepActive,
  isDemoStepDone,
  isIntakeUnlocked,
  isOutreachUnlocked,
  isReportUnlocked,
  matchDemoStep,
  nextDemoStep,
  outreachStep,
  roleStepIndex,
  stepsForRole,
  type DemoStepId,
} from "@/lib/demo-flow";
import { useDemoStore } from "@/store/demo-store";
import { StepLink, useStepBriefing } from "./step-briefing";

export const SHELL_PAD = "mx-auto w-full max-w-none px-6 lg:px-8 xl:px-10";

/** Compact step rail — only this seat’s steps. */
export function AdvisorFlowRail() {
  const path = usePathname();
  const person = usePerson();
  const { state } = useLegacy();
  const customers = useDemoStore((s) => s.customers);
  const current = matchDemoStep(path);
  const next = nextDemoStep(path);
  const roleSteps = stepsForRole(person?.role);
  const { n: localN, total: localTotal } = roleStepIndex(
    person?.role,
    current.id,
  );
  const outreachOpen = isOutreachUnlocked(state.households);
  const intakeOpen = isIntakeUnlocked(customers);
  const intake = useDemoStore((s) => s.intake);
  const plan = useDemoStore((s) => s.planSnapshot);
  const heirChoice = useDemoStore((s) => s.heirChoice);
  const reportOpen = isReportUnlocked({
    intakeCompleted: intake.completed,
    heirChoice,
    hasPlan: Boolean(plan),
  });
  const { showHelp, hideHelp, helpOpen, showAllowPrompt, showNotifyPrompt } =
    useStepBriefing();
  const immersive =
    path === "/customer" || path.startsWith("/customer/chat");

  const onHub = path.startsWith("/hub");
  const onRm = path.startsWith("/rm");
  const needsAllow = next?.id === "outreach" && !outreachOpen;
  const needsNotify = next?.id === "intake" && !intakeOpen;

  const nextHref = needsAllow && !onHub
    ? hubStep().href
    : needsNotify && !onRm
      ? outreachStep().href
      : (next?.href ?? "/dashboard");
  const nextId = needsAllow ? "outreach" : needsNotify ? "intake" : next?.id;
  const nextLabel = needsAllow
    ? onHub
      ? "Allow call to continue"
      : "Next: Outreach"
    : needsNotify
      ? onRm
        ? "Notify to continue"
        : "Next: Intake"
      : next
        ? `Next: ${next.label}`
        : "Start over";

  const gateNext =
    (needsAllow && onHub) || (needsNotify && onRm);

  const cols =
    roleSteps.length <= 1
      ? "grid-cols-1"
      : roleSteps.length === 2
        ? "grid-cols-2"
        : roleSteps.length === 3
          ? "grid-cols-3"
          : roleSteps.length === 4
            ? "grid-cols-2 sm:grid-cols-4"
            : "grid-cols-3 sm:grid-cols-6";

  return (
    <div
      className={`border-b border-line bg-white ${immersive ? "hidden md:block" : ""}`}
    >
      <div className={`${SHELL_PAD} py-3`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-base font-semibold text-ink">
            <span className="text-blue">
              Step {localN} of {localTotal}
            </span>
            <span className="mx-2 text-line">·</span>
            <span>{current.label}</span>
            <span className="mx-2 text-line">·</span>
            <span className="font-bold text-orange">{current.role}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => (helpOpen ? hideHelp() : showHelp(current.id))}
              className="inline-flex h-10 items-center rounded-lg border border-line px-3.5 text-sm font-semibold text-ink hover:bg-mist"
            >
              {helpOpen ? "Hide guide" : "Guide"}
            </button>
            {gateNext ? (
              <button
                type="button"
                onClick={() =>
                  needsAllow ? showAllowPrompt() : showNotifyPrompt()
                }
                className="inline-flex h-10 items-center rounded-lg bg-orange px-4 text-sm font-bold text-ink hover:bg-orange-deep"
              >
                {nextLabel} →
              </button>
            ) : (
              <StepLink
                href={nextHref}
                stepId={nextId}
                className="inline-flex h-10 items-center rounded-lg bg-orange px-4 text-sm font-bold text-ink hover:bg-orange-deep"
              >
                {nextLabel} →
              </StepLink>
            )}
          </div>
        </div>

        <ol
          className={`mt-3 grid gap-1.5 ${cols}`}
          aria-label="Your stages"
        >
          {roleSteps.map((step, index) => {
            const active = isDemoStepActive(step, path);
            const done = isDemoStepDone(step, path);
            const locked =
              (step.id === "outreach" && !outreachOpen) ||
              ((step.id === "intake" || step.id === "plan") && !intakeOpen) ||
              (step.id === "report" && !reportOpen);
            const lockHref =
              step.id === "outreach"
                ? hubStep().href
                : step.id === "report"
                  ? "/dashboard"
                  : outreachStep().href;
            const lockStepId =
              step.id === "outreach"
                ? "outreach"
                : step.id === "report"
                  ? "signal"
                  : "intake";
            return (
              <li key={step.id}>
                <StepLink
                  href={locked ? lockHref : step.href}
                  stepId={locked ? lockStepId : step.id}
                  aria-current={active ? "step" : undefined}
                  title={
                    locked
                      ? step.id === "outreach"
                        ? "Principal must allow a call in Hub first"
                        : step.id === "report"
                          ? "Heir must finish intake and choose Save or Reinvest first"
                          : "Approve and send notification in Outreach first"
                      : undefined
                  }
                  className={`flex h-12 w-full flex-col items-center justify-center rounded-lg text-center transition ${
                    active
                      ? "bg-navy text-white"
                      : locked
                        ? "bg-mist text-faint"
                        : done
                          ? "bg-blue-soft text-blue"
                          : "bg-mist text-muted hover:text-ink"
                  }`}
                >
                  <span className="text-sm font-bold leading-none">
                    {index + 1} {step.label}
                    {locked ? " 🔒" : ""}
                  </span>
                  <span
                    className={`mt-1 text-[11px] font-semibold leading-none ${
                      active ? "text-orange" : ""
                    }`}
                  >
                    {step.role}
                  </span>
                </StepLink>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

export function StageHeader({
  stepId,
  title,
  body,
  aside,
}: {
  stepId: DemoStepId;
  title?: string;
  body?: string;
  aside?: ReactNode;
}) {
  const step = DEMO_FLOW.find((item) => item.id === stepId) ?? DEMO_FLOW[0];
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-3xl tracking-tight text-ink sm:text-[2rem]">
          {title ?? step.title}
        </h1>
        {(body ?? step.body) && (
          <p className="mt-1.5 max-w-xl text-base leading-7 text-muted">
            {body ?? step.body}
          </p>
        )}
      </div>
      {aside}
    </div>
  );
}

export function StageFooterCta({ pathname }: { pathname?: string }) {
  const path = usePathname();
  const { state } = useLegacy();
  const customers = useDemoStore((s) => s.customers);
  const { showAllowPrompt, showNotifyPrompt } = useStepBriefing();
  const resolved = pathname ?? path;
  const next = nextDemoStep(resolved);
  const outreachOpen = isOutreachUnlocked(state.households);
  const intakeOpen = isIntakeUnlocked(customers);
  const immersive =
    resolved === "/customer" || resolved.startsWith("/customer/chat");
  if (immersive) return null;

  const onHub = resolved.startsWith("/hub");
  const onRm = resolved.startsWith("/rm");
  const needsAllow = next?.id === "outreach" && !outreachOpen;
  const needsNotify = next?.id === "intake" && !intakeOpen;
  const nextHref =
    needsAllow && !onHub
      ? hubStep().href
      : needsNotify && !onRm
        ? outreachStep().href
        : (next?.href ?? "/dashboard");
  const nextId = needsAllow ? "outreach" : needsNotify ? "intake" : next?.id;
  const label = needsAllow
    ? onHub
      ? "Allow call to continue"
      : "Next: Outreach"
    : needsNotify
      ? onRm
        ? "Notify to continue"
        : "Next: Intake"
      : next
        ? `Next: ${next.label}`
        : "Back to AI Analysis";

  const gateNext = (needsAllow && onHub) || (needsNotify && onRm);

  return (
    <div className="mt-6 flex justify-end border-t border-line pt-5">
      {gateNext ? (
        <button
          type="button"
          onClick={() =>
            needsAllow ? showAllowPrompt() : showNotifyPrompt()
          }
          className="inline-flex h-11 items-center rounded-lg bg-orange px-5 text-sm font-bold text-ink hover:bg-orange-deep"
        >
          {label} →
        </button>
      ) : (
        <StepLink
          href={nextHref}
          stepId={nextId}
          className="inline-flex h-11 items-center rounded-lg bg-orange px-5 text-sm font-bold text-ink hover:bg-orange-deep"
        >
          {label} →
        </StepLink>
      )}
    </div>
  );
}

export function StageShell({
  stepId,
  title,
  body,
  aside,
  children,
  showFooter = true,
}: {
  stepId: DemoStepId;
  title?: string;
  body?: string;
  aside?: ReactNode;
  children: ReactNode;
  showFooter?: boolean;
}) {
  return (
    <div className="grid w-full gap-5">
      <StageHeader stepId={stepId} title={title} body={body} aside={aside} />
      {children}
      {showFooter ? <StageFooterCta /> : null}
    </div>
  );
}
