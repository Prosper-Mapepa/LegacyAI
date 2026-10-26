"use client";

import Link from "next/link";
import { useState } from "react";
import {
  principalTalkBeats,
  principalTalkNote,
  writeBrief,
} from "@/domain/brief";
import { formatLong } from "@/domain/clock";
import { assessHousehold, fingerprint } from "@/domain/signal";
import { useLegacy } from "@/domain/store";
import { SimulatedCall } from "./simulated-call";
import { Button, LaneChip } from "./desk-ui";
import { StageShell } from "./flow-chrome";
import { StepLink } from "./step-briefing";

export function HouseholdDesk({ householdId }: { householdId: string }) {
  const { state, dispatch } = useLegacy();
  const household = state.households.find((item) => item.id === householdId);
  const assessment = household ? assessHousehold(household, new Date()) : null;
  const [reason, setReason] = useState("Already in conversation");
  const [calling, setCalling] = useState(false);

  if (!household || !assessment) {
    return <p className="text-muted">That household is not in this book.</p>;
  }

  const saved = state.briefs[household.id];
  const generated = writeBrief(household, assessment);
  const talkNote = principalTalkNote(household, assessment);
  const talkBeats = principalTalkBeats(household, assessment);
  const print = fingerprint(assessment);
  const text = saved?.text ?? generated;
  const drifted = Boolean(saved?.fingerprint && saved.fingerprint !== print);
  const approved = saved?.status === "approved";
  const days = Math.max(0, assessment.daysToReview);

  function startCall() {
    dispatch({
      type: "approveBrief",
      householdId: household!.id,
      text,
      fingerprint: print,
    });
    setCalling(true);
  }

  return (
    <StageShell
      stepId="book"
      title={household.familyName}
      body={`${formatLong(household.reviewOn)} · ${household.relationshipValue} · ${days} days to review`}
      aside={<LaneChip lane={assessment.lane} />}
      showFooter={false}
    >
      {calling && (
        <SimulatedCall
          principalName={household.principal.firstName}
          familyName={household.familyName}
          talkNote={talkNote}
          talkBeats={talkBeats}
          onEnd={() => setCalling(false)}
        />
      )}

      <Link
        href="/workbench"
        className="w-fit text-sm font-semibold text-blue hover:underline"
      >
        ← All families
      </Link>

      <section className="rounded-xl border border-line border-l-4 border-l-orange bg-white p-5 sm:p-6">
        <p className="text-sm font-bold text-blue">What to do</p>
        <p className="mt-2 text-lg font-medium leading-8 text-ink sm:text-xl">
          {assessment.summary}
        </p>
      </section>

      <section className="rounded-xl border border-line bg-white p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-wide text-blue">
          Advisor note · talking to Principal
        </p>
        <h2 className="mt-1 text-lg font-bold text-ink">
          Use this when you call {household.principal.firstName}
        </h2>
        <ol className="mt-4 grid gap-3">
          {talkBeats.map((beat) => (
            <li
              key={beat.step}
              className="rounded-lg border border-line bg-mist px-4 py-3"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-blue">
                {beat.step}. {beat.label}
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-ink sm:text-base">
                {beat.say}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-ink">On the record</h2>
            <p className="text-sm text-muted">
              Principal · only people already on the bank file
            </p>
          </div>
          <StepLink
            href={`/hub/${household.id}`}
            stepId="hub"
            className="text-sm font-semibold text-blue hover:underline"
          >
            Next: Hub →
          </StepLink>
        </div>

        <ul className="overflow-hidden rounded-xl border border-line bg-white">
          {assessment.heirs.map((heir, index) => (
            <li
              key={heir.heirId}
              className={index > 0 ? "border-t border-line" : undefined}
            >
              <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-xl tracking-tight text-ink">
                      {heir.firstName}
                    </p>
                    <span className="text-sm text-muted">{heir.relationship}</span>
                    <LaneChip lane={heir.lane} />
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted">{heir.title}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-muted">
          Lesson answers stay private. Other banks are not inferred. Transfers are never blocked.
        </p>
      </section>

      <section className="rounded-xl border border-line bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold text-ink">Your brief</h2>
        <p className="mt-1 text-sm text-muted">
          Approving records your judgment only — it does not send a message or move money.
        </p>

        {(saved?.stale || drifted) && (
          <p className="mt-3 rounded-lg bg-orange-soft px-3 py-2.5 text-sm">
            The record changed.{" "}
            <button
              type="button"
              className="font-semibold text-blue"
              onClick={() =>
                dispatch({ type: "useUpdatedBrief", householdId: household.id })
              }
            >
              Use updated brief
            </button>
          </p>
        )}

        {saved?.status === "dismissed" && saved.dismissReason && (
          <p className="mt-3 text-sm text-muted">Set aside: {saved.dismissReason}</p>
        )}

        {approved ? (
          <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-mist px-4 py-3 font-sans text-base leading-7 text-ink">
            {text}
          </pre>
        ) : (
          <textarea
            className="mt-4 min-h-36 w-full rounded-lg border border-line bg-white px-4 py-3 text-base leading-7"
            value={text}
            aria-label="Meeting brief"
            onChange={(event) =>
              dispatch({
                type: "editBrief",
                householdId: household.id,
                text: event.target.value,
                fingerprint: print,
              })
            }
          />
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          {approved ? (
            <>
              <Button variant="primary" onClick={() => setCalling(true)}>
                Call Principal again
              </Button>
              <Button onClick={() => dispatch({ type: "reopenBrief", householdId: household.id })}>
                Reopen
              </Button>
            </>
          ) : (
            <>
              <Button variant="primary" onClick={startCall}>
                I&apos;ll make this call
              </Button>
              <select
                className="min-h-11 rounded-lg border border-line bg-white px-3 text-sm"
                value={reason}
                aria-label="Reason to set aside"
                onChange={(event) => setReason(event.target.value)}
              >
                <option>Already in conversation</option>
                <option>Principal asked to wait</option>
                <option>Not this quarter</option>
              </select>
              <Button
                onClick={() =>
                  dispatch({
                    type: "dismissBrief",
                    householdId: household.id,
                    reason,
                  })
                }
              >
                Set aside
              </Button>
            </>
          )}
        </div>
      </section>

      <details className="rounded-xl border border-line bg-white px-5 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-ink">
          Recent record
        </summary>
        <ol className="mt-3 grid gap-3 border-l border-line pl-4">
          {[...household.audit].reverse().slice(0, 5).map((event) => (
            <li key={event.id} className="text-sm leading-6 text-ink">
              {event.action}
              <span className="block text-muted">
                {event.actor} · {event.at.slice(0, 10)}
              </span>
            </li>
          ))}
        </ol>
      </details>
    </StageShell>
  );
}
