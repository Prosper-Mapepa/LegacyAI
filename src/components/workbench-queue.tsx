"use client";

import Link from "next/link";
import { rankBook } from "@/domain/signal";
import { useLegacy } from "@/domain/store";
import { LaneChip } from "./desk-ui";
import { StageShell } from "./flow-chrome";

export function WorkbenchQueue() {
  const { state } = useLegacy();
  const ranked = rankBook(state.households, new Date());
  const first = ranked[0];
  const needYou = ranked.filter((item) => item.lane === "gap").length;

  return (
    <StageShell
      stepId="book"
      title="Open a family desk"
      body="Pick a family, read the next step, approve your brief."
      showFooter={false}
    >
      <dl className="grid grid-cols-3 divide-x divide-line rounded-xl border border-line bg-white">
        <div className="px-4 py-3 text-center sm:px-5 sm:py-4">
          <dt className="text-sm text-muted">Families</dt>
          <dd className="font-display mt-1 text-2xl text-ink sm:text-3xl">
            {ranked.length}
          </dd>
        </div>
        <div className="px-4 py-3 text-center sm:px-5 sm:py-4">
          <dt className="text-sm text-muted">Need you</dt>
          <dd className="font-display mt-1 text-2xl text-ink sm:text-3xl">{needYou}</dd>
        </div>
        <div className="px-4 py-3 text-center sm:px-5 sm:py-4">
          <dt className="text-sm text-muted">Days to review</dt>
          <dd className="font-display mt-1 text-2xl text-ink sm:text-3xl">
            {first ? Math.max(0, first.daysToReview) : "—"}
          </dd>
        </div>
      </dl>

      {first && (
        <Link
          href={`/workbench/${first.householdId}`}
          data-tour="open-desk"
          className="block rounded-xl border border-line border-l-4 border-l-orange bg-white p-5 transition hover:border-orange sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-2xl tracking-tight text-ink">
                {first.familyName}
              </h2>
              <LaneChip lane={first.lane} />
            </div>
            <span className="text-sm font-bold text-blue">Start here</span>
          </div>
          <p className="mt-3 max-w-3xl text-base leading-7 text-ink">{first.summary}</p>
          <span className="mt-4 inline-flex h-10 items-center rounded-lg bg-orange px-4 text-sm font-bold text-ink">
            Open desk →
          </span>
        </Link>
      )}

      {ranked.length > 1 && (
        <ul className="overflow-hidden rounded-xl border border-line bg-white">
          {ranked.slice(1).map((item, index) => (
            <li
              key={item.householdId}
              className={index > 0 ? "border-t border-line" : undefined}
            >
              <Link
                href={`/workbench/${item.householdId}`}
                className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-mist"
              >
                <span className="font-semibold text-ink">{item.familyName}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted">
                    {item.daysToReview < 0 ? "—" : `${item.daysToReview}d`}
                  </span>
                  <LaneChip lane={item.lane} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </StageShell>
  );
}
