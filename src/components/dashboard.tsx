"use client";

import { StepLink } from "@/components/step-briefing";
import { ClientAnalysisBook } from "@/components/rm/client-analysis-book";
import { usePerson } from "@/domain/accounts";
import { useLegacy } from "@/domain/store";
import type { AdvisorNotice } from "@/domain/types";
import { StageShell } from "./flow-chrome";

/** Step 1 — AI Client Analysis (Advisor). */
export function Dashboard() {
  const person = usePerson();
  const { state } = useLegacy();
  if (!person || person.role !== "advisor") return null;
  return <AdvisorHome notices={state.advisorNotices ?? []} />;
}

function AdvisorHome({ notices }: { notices: AdvisorNotice[] }) {
  const { dispatch } = useLegacy();

  return (
    <StageShell
      stepId="signal"
      title="AI Client Analysis"
      body="Ranked clients with calculated figures. After intake, Step 4 holds the full post-intake report."
      showFooter={false}
    >
      {notices.length > 0 && (
        <div className="grid gap-2">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className={`flex flex-wrap items-start justify-between gap-3 rounded-xl border border-l-4 px-4 py-3 ${
                notice.read
                  ? "border-line border-l-blue bg-white"
                  : "border-orange/40 border-l-orange bg-orange/10"
              }`}
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink">{notice.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted">{notice.body}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StepLink
                  href={notice.href}
                  stepId={
                    notice.kind === "intake_complete" ? "report" : "outreach"
                  }
                  className="inline-flex h-9 items-center rounded-lg bg-orange px-3 text-sm font-bold text-ink hover:bg-orange-deep"
                >
                  {notice.kind === "intake_complete"
                    ? "View full report →"
                    : "Go to Outreach →"}
                </StepLink>
                <button
                  type="button"
                  className="text-sm font-semibold text-muted hover:text-ink"
                  onClick={() =>
                    dispatch({ type: "dismissAdvisorNotice", id: notice.id })
                  }
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ClientAnalysisBook />
    </StageShell>
  );
}
