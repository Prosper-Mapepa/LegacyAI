"use client";

import { FullClientReport } from "@/components/full-client-report";
import { Gate } from "@/components/gate";
import { StageShell } from "@/components/flow-chrome";
import { StepLink } from "@/components/step-briefing";
import { isReportUnlocked } from "@/lib/demo-flow";
import { useDemoStore } from "@/store/demo-store";

export default function ReportPage() {
  const intake = useDemoStore((s) => s.intake);
  const plan = useDemoStore((s) => s.planSnapshot);
  const heirChoice = useDemoStore((s) => s.heirChoice);
  const unlocked = isReportUnlocked({
    intakeCompleted: intake.completed,
    heirChoice,
    hasPlan: Boolean(plan),
  });

  return (
    <Gate area="report">
      <StageShell
        stepId="report"
        title="Full client report"
        body={
          unlocked
            ? "Post-intake figures, suggested split, and the Heir’s preference."
            : "Waiting for the Heir to finish intake and choose Save or Reinvest."
        }
        showFooter={unlocked}
      >
        {!unlocked && (
          <div className="mb-4 rounded-xl border border-line border-l-4 border-l-orange bg-white p-5">
            <p className="text-sm leading-6 text-ink">
              Step 4 unlocks after Outreach sends the intake email and the
              customer completes the phone intake plus plan preference.
            </p>
            <StepLink
              href="/customer"
              stepId="intake"
              className="mt-4 inline-flex h-10 items-center rounded-lg bg-orange px-4 text-sm font-bold text-ink hover:bg-orange-deep"
            >
              Go to Intake →
            </StepLink>
          </div>
        )}
        <FullClientReport />
      </StageShell>
    </Gate>
  );
}
