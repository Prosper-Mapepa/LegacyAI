"use client";

import { useMemo, useState } from "react";
import { Gate } from "@/components/gate";
import { StageShell } from "@/components/flow-chrome";
import { SimulatedCall } from "@/components/simulated-call";
import { StepLink } from "@/components/step-briefing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HEIR_TO_CUSTOMER_ID, PILOT_HOUSEHOLD_ID } from "@/data/story";
import {
  outreachTalkBeats,
  outreachTalkNote,
} from "@/domain/brief";
import { useLegacy } from "@/domain/store";
import type { Heir } from "@/domain/types";
import {
  approvedOutreachHeirs,
  hubStep,
  isOutreachUnlocked,
} from "@/lib/demo-flow";
import { useDemoStore } from "@/store/demo-store";

export default function RmDashboardPage() {
  const { state } = useLegacy();
  const unlocked = isOutreachUnlocked(state.households);
  const customers = useDemoStore((s) => s.customers);
  const approveOutreach = useDemoStore((s) => s.approveOutreach);
  const sendNotification = useDemoStore((s) => s.sendNotification);
  const [callingHeirId, setCallingHeirId] = useState<string | null>(null);
  const [sentIntakeFor, setSentIntakeFor] = useState<string | null>(null);

  const household = state.households.find((h) => h.id === PILOT_HOUSEHOLD_ID);
  const approved = useMemo(
    () => approvedOutreachHeirs(state.households),
    [state.households],
  );

  const callingHeir =
    approved.find((h) => h.id === callingHeirId) ?? null;

  function customerIdFor(heir: Heir) {
    return HEIR_TO_CUSTOMER_ID[heir.id] ?? null;
  }

  function statusFor(heir: Heir) {
    const id = customerIdFor(heir);
    const customer = id
      ? customers.find((c) => c.id === id)
      : null;
    return customer?.status ?? "New";
  }

  function finishCall(heir: Heir) {
    const id = customerIdFor(heir);
    if (id) {
      const customer = customers.find((c) => c.id === id);
      if (customer && customer.status === "New") {
        approveOutreach(id);
      }
      sendNotification(id);
    }
    setSentIntakeFor(heir.id);
    setCallingHeirId(null);
  }

  if (!unlocked) {
    const hub = hubStep();
    return (
      <Gate area="outreach">
        <StageShell
          stepId="outreach"
          title="Outreach is locked"
          body="The Principal must invite someone and allow a call in the Hub before Outreach."
          showFooter={false}
        >
          <div className="rounded-xl border border-line border-l-4 border-l-orange bg-white p-6">
            <p className="text-base leading-7 text-ink">
              Seamless order: AI Analysis → Book → <strong>Hub</strong> →
              Outreach → Intake → Plan.
            </p>
            <p className="mt-2 text-sm text-muted">
              On Hub: Invite Heir or Sibling, then tap Allow call. You’ll sign
              back in as Advisor to see the notification.
            </p>
            <StepLink
              href={hub.href}
              stepId="hub"
              className="mt-5 inline-flex h-11 items-center rounded-lg bg-orange px-5 text-sm font-bold text-ink hover:bg-orange-deep"
            >
              Go to Hub →
            </StepLink>
          </div>
        </StageShell>
      </Gate>
    );
  }

  return (
    <Gate area="outreach">
      <StageShell
        stepId="outreach"
        title="Call and send intake"
        body="Principal allowed these conversations. Call Heir or Sibling with the script, then we’ll send the intake email."
      >
        {callingHeir && household && (
          <SimulatedCall
            principalName={`${callingHeir.firstName} ${callingHeir.lastName}`}
            familyName={household.familyName}
            talkNote={outreachTalkNote(household, callingHeir)}
            talkBeats={outreachTalkBeats(household, callingHeir)}
            endLabel="Send intake email"
            onEnd={() => finishCall(callingHeir)}
          />
        )}

        <div className="grid gap-3 lg:grid-cols-2">
          {approved.map((heir) => {
            const status = statusFor(heir);
            const emailed = sentIntakeFor === heir.id ||
              status === "Notified" ||
              status === "Engaged" ||
              status === "Meeting booked";
            return (
              <section
                key={heir.id}
                className="rounded-xl border border-line border-l-4 border-l-orange bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-blue">
                      Approved to call
                    </p>
                    <h2 className="font-display mt-1 text-2xl text-ink">
                      {heir.firstName} {heir.lastName}
                    </h2>
                    <p className="text-sm text-muted">{heir.relationship}</p>
                  </div>
                  <Badge variant="outline">{status}</Badge>
                </div>

                <div className="mt-4 rounded-lg bg-mist px-3 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue">
                    Advisor note
                  </p>
                  <p className="mt-1 text-sm leading-6 text-ink">
                    Tell {heir.firstName} {heir.lastName} what LegacyAI is, that{" "}
                    {household?.principal.firstName ?? "Principal"} allowed this
                    call, and that we’ll send an email with directions for
                    intake on their phone. No figures on the call.
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {!emailed ? (
                    <Button
                      type="button"
                      onClick={() => setCallingHeirId(heir.id)}
                    >
                      Call {heir.firstName} {heir.lastName}
                    </Button>
                  ) : (
                    <>
                      <Badge variant="success">Intake email sent</Badge>
                      <StepLink
                        href="/customer"
                        stepId="intake"
                        className="inline-flex h-10 items-center rounded-lg bg-orange px-4 text-sm font-bold text-ink hover:bg-orange-deep"
                      >
                        Continue to Intake →
                      </StepLink>
                    </>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        {approved.length === 0 && (
          <p className="text-muted">No approved calls yet.</p>
        )}
      </StageShell>
    </Gate>
  );
}
