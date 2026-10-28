"use client";

import { Gate } from "@/components/gate";
import { SHELL_PAD, StageShell } from "@/components/flow-chrome";
import { StepLink } from "@/components/step-briefing";
import { isIntakeUnlocked, outreachStep } from "@/lib/demo-flow";
import { useDemoStore } from "@/store/demo-store";

/** Heir-only desk. Also blocks until Advisor has sent the outreach notification. */
export function IntakeGate({ children }: { children: React.ReactNode }) {
  const customers = useDemoStore((s) => s.customers);
  const unlocked = isIntakeUnlocked(customers);
  const outreach = outreachStep();

  return (
    <Gate area="customer">
      {unlocked ? (
        <div className="relative flex min-h-0 w-full flex-1 flex-col">
          {children}
        </div>
      ) : (
        <div className={`${SHELL_PAD} flex-1 py-6`}>
          <StageShell
            stepId="intake"
            title="Intake is locked"
            body="The Advisor must approve outreach and send the notification before Heir can open intake."
            showFooter={false}
          >
            <div className="rounded-xl border border-line border-l-4 border-l-orange bg-white p-6">
              <p className="text-base leading-7 text-ink">
                On Outreach: select Heir Whitfield → <strong>Approve outreach</strong>{" "}
                → <strong>Send notification</strong>.
              </p>
              <StepLink
                href={outreach.href}
                stepId="outreach"
                className="mt-5 inline-flex h-11 items-center rounded-lg bg-orange px-5 text-sm font-bold text-ink hover:bg-orange-deep"
              >
                Go to Outreach →
              </StepLink>
            </div>
          </StageShell>
        </div>
      )}
    </Gate>
  );
}
