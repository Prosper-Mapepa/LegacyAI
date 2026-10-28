"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatLong } from "@/domain/clock";
import { usePerson } from "@/domain/accounts";
import { useLegacy } from "@/domain/store";
import type { Heir } from "@/domain/types";
import { Button } from "./desk-ui";
import { StageShell } from "./flow-chrome";
import { StepLink } from "./step-briefing";
import { FEATURED_HEIR_ID } from "@/data/story";
import {
  demoStepById,
  isOutreachUnlocked,
  roleSwitchHref,
} from "@/lib/demo-flow";

const STEPS = ["On record", "Invite", "They share", "Allow call"] as const;

export function FamilyHub({ householdId }: { householdId: string }) {
  const { state } = useLegacy();
  const viewer = usePerson();
  const household = state.households.find((item) => item.id === householdId);
  const featured = household?.heirs.find((heir) => heir.id === FEATURED_HEIR_ID);
  const unlocked = isOutreachUnlocked(state.households);

  useEffect(() => {
    if (typeof window === "undefined" || !household) return;
    const hash = window.location.hash.replace("#", "");
    if (!hash.startsWith("allow-call-")) return;
    const el = document.getElementById(hash);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus();
  }, [household, featured?.invited, featured?.scopes.advisorIntro]);

  if (!household) {
    return <p className="text-lg text-muted">That household is not in this book.</p>;
  }

  const waiting = household.heirs.filter((heir) => !heir.invited && !heir.declinedIntro);
  const needsAllow =
    featured?.invited && !featured.scopes.advisorIntro && !featured.declinedIntro;
  const stepIndex = waiting.length ? 2 : needsAllow ? 4 : unlocked ? 5 : 3;
  const title = waiting.length
    ? `Invite ${waiting.map((heir) => heir.firstName).join(" and ")}`
    : unlocked
      ? "Call allowed — continue to Outreach"
      : "Everyone is in the hub";
  const body = unlocked
    ? `Review ${formatLong(household.reviewOn)}. Hand off to the Advisor — they see the approval on Step 1, then call from Outreach.`
    : `Review ${formatLong(household.reviewOn)}. Invite Heir and allow a call before Outreach.`;

  const content = (
    <>
      <ol className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {STEPS.map((label, index) => {
          const step = index + 1;
          const done = step < stepIndex;
          const active = step === stepIndex;
          return (
            <li
              key={label}
              className={`rounded-lg px-3 py-2.5 text-center text-sm ${
                active
                  ? "bg-orange font-bold text-ink"
                  : done
                    ? "bg-blue-soft font-semibold text-blue"
                    : "bg-mist font-semibold text-muted"
              }`}
            >
              <span className="block text-[11px] uppercase tracking-wide opacity-80">
                {done ? "Done" : `Step ${step}`}
              </span>
              <span className="mt-0.5 block">{label}</span>
            </li>
          );
        })}
      </ol>

      {!unlocked && (
        <div className="rounded-xl border border-orange/35 border-l-4 border-l-orange bg-white px-4 py-3 text-sm leading-6 text-ink">
          <strong>To unlock Outreach:</strong>{" "}
          {waiting.length
            ? "Invite Heir, then tap Allow call."
            : "Tap the highlighted Allow call on Heir."}
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {household.heirs.map((heir) => (
          <HeirRow
            key={`${heir.id}:${heir.portionNote}:${heir.scopes.portionNote}`}
            householdId={household.id}
            heir={heir}
            highlightAllow={
              heir.invited && !heir.scopes.advisorIntro && !heir.declinedIntro
            }
            emphasize={heir.id === FEATURED_HEIR_ID}
          />
        ))}
      </div>

      {unlocked ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3">
          <p className="text-sm font-semibold text-ink">
            Call allowed. Sign in as Advisor to see the approval on Step 1, then
            open Outreach.
          </p>
          <StepLink
            href="/dashboard"
            stepId="signal"
            className="inline-flex h-10 items-center rounded-lg bg-orange px-4 text-sm font-bold text-ink hover:bg-orange-deep"
          >
            Sign in as Advisor →
          </StepLink>
        </div>
      ) : (
        <p className="text-sm text-muted">
          Lesson answers stay private. Other banks are not inferred. Transfers are never
          blocked.
        </p>
      )}
    </>
  );

  if (viewer?.role === "advisor") {
    return (
      <StageShell stepId="hub" title={title} body={body} showFooter={false}>
        {content}
      </StageShell>
    );
  }

  return (
    <div className="grid w-full gap-5">
      <div>
        <h1 className="font-display text-3xl tracking-tight text-ink sm:text-[2rem]">
          {title}
        </h1>
        <p className="mt-1.5 max-w-xl text-base leading-7 text-muted">{body}</p>
      </div>
      {content}
    </div>
  );
}

function statusLine(heir: Heir) {
  if (heir.declinedIntro) return "Declined a call — that stands.";
  if (!heir.invited) return "Not invited yet.";
  if (heir.scopes.advisorIntro) return "Invited · Advisor may call.";
  return "Invited · Advisor cannot call yet.";
}

function HeirRow({
  householdId,
  heir,
  highlightAllow,
  emphasize,
}: {
  householdId: string;
  heir: Heir;
  highlightAllow: boolean;
  emphasize: boolean;
}) {
  const router = useRouter();
  const { dispatch } = useLegacy();
  const [note, setNote] = useState(heir.portionNote);
  const allowed = heir.scopes.advisorIntro && !heir.declinedIntro;

  return (
    <section
      className={`rounded-xl border bg-white p-5 ${
        emphasize && highlightAllow
          ? "border-orange ring-2 ring-orange/25"
          : "border-line"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-xl tracking-tight text-ink">
            {heir.firstName} {heir.lastName}
          </h2>
          <p className="text-sm text-muted">
            {heir.relationship}
            {heir.beneficiaryOnFile ? " · on record" : ""}
          </p>
        </div>
        {emphasize && highlightAllow ? (
          <span className="rounded-full bg-orange px-2.5 py-1 text-xs font-bold text-ink">
            Action needed
          </span>
        ) : null}
      </div>

      <p
        className={`mt-3 rounded-lg px-3 py-2 text-sm font-semibold ${
          allowed ? "bg-blue-soft text-blue" : "bg-orange-soft text-ink"
        }`}
      >
        {statusLine(heir)}
      </p>

      <label className="mt-4 block text-sm font-semibold text-ink" htmlFor={`${heir.id}-note`}>
        Note for {heir.firstName}
      </label>
      <textarea
        id={`${heir.id}-note`}
        className="mt-1.5 min-h-24 w-full rounded-lg border border-line px-3 py-2.5 text-base leading-7"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        onBlur={() =>
          dispatch({
            type: "setPortion",
            householdId,
            heirId: heir.id,
            note,
            shared: heir.scopes.portionNote,
          })
        }
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {!heir.invited && !heir.declinedIntro ? (
          <Button
            variant="primary"
            onClick={() => dispatch({ type: "invite", householdId, heirId: heir.id })}
          >
            Invite
          </Button>
        ) : null}
        <Button
          aria-pressed={heir.scopes.portionNote}
          variant={heir.scopes.portionNote ? "blue" : "quiet"}
          onClick={() =>
            dispatch({
              type: "setPortion",
              householdId,
              heirId: heir.id,
              note,
              shared: !heir.scopes.portionNote,
            })
          }
        >
          {heir.scopes.portionNote ? "Note shared" : "Keep private"}
        </Button>
        <Button
          id={`allow-call-${heir.id}`}
          disabled={heir.declinedIntro || !heir.invited}
          aria-pressed={heir.scopes.advisorIntro}
          variant={
            heir.scopes.advisorIntro ? "blue" : highlightAllow ? "primary" : "quiet"
          }
          className={highlightAllow ? "allow-call-pulse relative z-[1]" : undefined}
          onClick={() => {
            const allowing = !heir.scopes.advisorIntro;
            dispatch({
              type: "setIntro",
              householdId,
              heirId: heir.id,
              allowed: allowing,
            });
            if (allowing) {
              // Advisor must see Step 1 notifications, then Outreach
              router.push(
                roleSwitchHref(demoStepById("signal"), "/dashboard"),
              );
            }
          }}
        >
          {heir.declinedIntro
            ? "Declined"
            : heir.scopes.advisorIntro
              ? "Call allowed"
              : "Allow call"}
        </Button>
      </div>

      <Link
        href={`/hub/${householdId}/heirs/${heir.id}`}
        className="mt-3 inline-block text-sm font-semibold text-blue hover:underline"
      >
        Preview space →
      </Link>
    </section>
  );
}
