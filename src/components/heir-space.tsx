"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { lessonsFor } from "@/domain/lessons";
import { usePerson } from "@/domain/accounts";
import { useLegacy } from "@/domain/store";
import type { Goal } from "@/domain/types";
import { Button } from "./desk-ui";

const GOALS: { id: Goal; label: string; hint: string }[] = [
  { id: "understand", label: "I want to understand first", hint: "Start with what being named means." },
  { id: "meet", label: "I am willing to meet the advisor", hint: "Start with questions for the room." },
  { id: "undecided", label: "I have not decided", hint: "Read in a calm order. Nothing is owed." },
];

export function HeirSpace({
  householdId,
  heirId,
}: {
  householdId: string;
  heirId: string;
}) {
  const params = useSearchParams();
  const live = params.get("live") === "1";
  const viewer = usePerson();
  const { state, dispatch } = useLegacy();
  const [showAll, setShowAll] = useState(false);
  const household = state.households.find((item) => item.id === householdId);
  const heir = household?.heirs.find((item) => item.id === heirId);

  useEffect(() => {
    if (!live || !heir?.invited) return;
    dispatch({ type: "recordOpen", householdId, heirId });
  }, [live, heir?.invited, householdId, heirId, dispatch]);

  if (!household || !heir) {
    return <p className="text-muted">That space is not in this book.</p>;
  }

  if (!heir.invited) {
    return (
      <div className="mx-auto max-w-lg py-10 text-center sm:py-16">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-orange text-ink" aria-hidden>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.75" />
            <path d="M5 7.5 12 13l7-5.5" stroke="currentColor" strokeWidth="1.75" />
          </svg>
        </div>
        <h1 className="font-display mt-6 text-4xl leading-tight tracking-tight">
          Nothing is shared with you yet.
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted">
          When {household.principal.firstName} invites you, you will see her note if she shares
          it, a few short lessons, and your own choices. {household.advisor.name} will not call
          unless {household.principal.firstName} allows it.
        </p>
      </div>
    );
  }

  const lessons = lessonsFor(heir.goal);
  const next = lessons.find((lesson) => !heir.completedModuleIds.includes(lesson.id));
  const visible = showAll
    ? lessons
    : lessons.filter((lesson) => lesson.id === next?.id || heir.completedModuleIds.includes(lesson.id));
  const shown = visible.length ? visible : lessons.slice(0, 1);
  const read = heir.completedModuleIds.length;
  const progress = Math.round((read / lessons.length) * 100);

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-sm font-semibold text-blue">{live ? "Your space" : "Preview"}</p>
        <h1 className="font-display mt-2 text-4xl leading-tight tracking-tight sm:text-5xl">
          {heir.firstName}, this page is only yours.
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-muted">
          {live
            ? `${household.advisor.name} can see that you visited only if you allow it. She never sees what you read.`
            : "This preview is not recorded as a visit."}
        </p>
      </div>

      <section className="surface accent p-6 sm:p-7">
        <h2 className="text-sm font-semibold">From {household.principal.firstName}</h2>
        {heir.scopes.portionNote ? (
          <p className="font-display mt-3 text-2xl leading-snug">{heir.portionNote}</p>
        ) : (
          <p className="mt-3 leading-7 text-muted">
            No note has been shared. You can still read and choose.
          </p>
        )}
      </section>

      <fieldset>
        <legend className="text-lg font-semibold">What do you want?</legend>
        <p className="mt-1 text-sm text-muted">
          This changes the lesson order. It is not on the advisor&apos;s brief.
        </p>
        <div className="mt-4 grid gap-2">
          {GOALS.map((goal) => {
            const checked = heir.goal === goal.id;
            return (
              <label
                key={goal.id}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 ${
                  checked ? "border-orange bg-orange-soft" : "surface"
                }`}
              >
                <input
                  type="radio"
                  name="goal"
                  className="mt-1"
                  checked={checked}
                  onChange={() =>
                    dispatch({ type: "setGoal", householdId, heirId, goal: goal.id })
                  }
                />
                <span>
                  <span className="block font-semibold">{goal.label}</span>
                  <span className="block text-sm text-muted">{goal.hint}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <section>
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-lg font-semibold">Lessons</h2>
          <p className="text-sm text-muted">
            {read} of {lessons.length} read
          </p>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-orange" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-sm text-muted">Matched to what you said you want.</p>
        <ul className="mt-4 grid gap-3">
          {shown.map((lesson) => {
            const done = heir.completedModuleIds.includes(lesson.id);
            const isNext = lesson.id === next?.id;
            return (
              <li key={lesson.id} className={`surface p-5 ${isNext ? "accent" : ""}`}>
                <p className="font-semibold">
                  {lesson.title}
                  <span className="font-normal text-muted">
                    {done ? " · read" : isNext ? " · next" : ""}
                  </span>
                </p>
                {(!done || isNext) && <p className="mt-2 leading-7 text-muted">{lesson.body}</p>}
                {!done && (
                  <Button
                    className="mt-4"
                    variant={isNext ? "primary" : "quiet"}
                    onClick={() =>
                      dispatch({
                        type: "completeModule",
                        householdId,
                        heirId,
                        moduleId: lesson.id,
                      })
                    }
                  >
                    I&apos;ve read this
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
        {lessons.length > shown.length && (
          <button type="button" className="mt-4 text-sm font-semibold text-blue" onClick={() => setShowAll(true)}>
            Show the other lessons
          </button>
        )}
      </section>

      <section className="surface divide-y divide-line">
        <div className="p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
          <div>
            <h2 className="font-semibold">Visits</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              {household.advisor.name} never sees which lesson you read.
            </p>
          </div>
          <Button
            className="mt-3 sm:mt-0"
            variant={heir.scopes.shareEngagement ? "blue" : "quiet"}
            aria-pressed={heir.scopes.shareEngagement}
            onClick={() =>
              dispatch({
                type: "setEngagementShare",
                householdId,
                heirId,
                shared: !heir.scopes.shareEngagement,
              })
            }
          >
            {heir.scopes.shareEngagement
              ? `${household.advisor.name.split(" ")[0]} can see visits`
              : "Keep visits private"}
          </Button>
        </div>
        <div className="p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
          <div>
            <h2 className="font-semibold">A call</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              {household.principal.firstName} cannot undo a decline.
            </p>
          </div>
          {heir.declinedIntro ? (
            <Button
              className="mt-3 sm:mt-0"
              onClick={() => dispatch({ type: "withdrawDecline", householdId, heirId })}
            >
              I changed my mind about a call
            </Button>
          ) : (
            <Button
              className="mt-3 sm:mt-0"
              onClick={() => dispatch({ type: "declineIntro", householdId, heirId })}
            >
              I don&apos;t want a call
            </Button>
          )}
        </div>
      </section>

      <Link
        href={
          viewer?.role === "heir"
            ? viewer.heirId === "david"
              ? "/customer"
              : `/hub/${householdId}/heirs/${viewer.heirId}?live=1`
            : `/hub/${householdId}`
        }
        className="text-lg font-semibold text-blue"
      >
        ←{" "}
        {viewer?.role === "heir"
          ? "Back to your desk"
          : `Back to ${household.principal.firstName}`}
      </Link>
    </div>
  );
}
