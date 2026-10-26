"use client";

import { useState } from "react";
import { answer, prompts } from "@/domain/assistant";
import { usePerson } from "@/domain/accounts";
import type { Role } from "@/domain/people";
import { useLegacy } from "@/domain/store";
import { PhoneFrame } from "@/components/phone-frame";
import { cn } from "@/lib/utils";

type Turn = { from: "you" | "legacy"; text: string };

export function Chat() {
  const person = usePerson();
  const { state } = useLegacy();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);

  if (!person) return null;

  function ask(text: string) {
    const cleaned = text.trim();
    if (!cleaned) return;
    const reply = answer(
      cleaned,
      person!.role,
      state.households,
      new Date(),
      person!.householdId,
      person!.heirId,
    );
    setTurns((current) => [
      ...current,
      { from: "you", text: cleaned },
      { from: "legacy", text: reply },
    ]);
    setDraft("");
    setOpen(true);
  }

  const ideas = prompts(person.role);

  return (
    <>
      {open && (
        <div className="fixed bottom-4 right-4 z-40 w-[min(24rem,calc(100vw-1.5rem))] bg-transparent">
          <PhoneFrame
            title="Ask LegacyAI"
            fillHeight
            className="mx-0 h-[min(36rem,calc(100svh-6rem))] w-full max-w-none bg-transparent shadow-[0_0_40px_8px_rgba(61,155,212,0.35)]"
          >
            <div className="flex h-full min-h-0 flex-1 flex-col bg-[#f7f9fc]">
              <div className="flex shrink-0 items-start justify-between gap-2 border-b border-line bg-white px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ink">Ask LegacyAI</p>
                  <p className="text-xs text-muted">{labelFor(person.role)}</p>
                </div>
                <button
                  type="button"
                  className="rounded-lg px-2.5 py-1 text-sm font-semibold text-muted hover:bg-mist hover:text-ink"
                  onClick={() => setOpen(false)}
                >
                  Close
                </button>
              </div>

              <div className="grid min-h-0 flex-1 gap-2.5 overflow-y-auto overscroll-contain px-3 py-3">
                {turns.length === 0 && (
                  <p className="text-sm leading-6 text-muted">
                    Ask about this book. Answers use only what{" "}
                    {person.name.split(" ")[0]} is allowed to see.
                  </p>
                )}
                {turns.map((turn, index) => (
                  <p
                    key={`${turn.from}-${index}`}
                    className={cn(
                      "max-w-[92%] rounded-2xl px-3 py-2.5 text-sm leading-6",
                      turn.from === "you"
                        ? "ml-auto bg-mist text-ink"
                        : "bg-blue-soft text-ink",
                    )}
                  >
                    {turn.text}
                  </p>
                ))}
                <div className="flex flex-wrap gap-1">
                  {ideas.map((idea) => (
                    <button
                      key={idea}
                      type="button"
                      className="rounded-md border border-line/80 bg-white px-2 py-0.5 text-[11px] font-medium leading-snug text-ink hover:border-blue/40 hover:bg-blue-soft"
                      onClick={() => ask(idea)}
                    >
                      {idea}
                    </button>
                  ))}
                </div>
              </div>

              <form
                className="flex shrink-0 gap-2 border-t border-line bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
                onSubmit={(event) => {
                  event.preventDefault();
                  ask(draft);
                }}
              >
                <label className="sr-only" htmlFor="ask-legacy">
                  Ask LegacyAI
                </label>
                <input
                  id="ask-legacy"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Ask about this book"
                  className="min-h-11 flex-1 rounded-full border border-line px-4 text-sm"
                />
                <button
                  type="submit"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-orange text-sm font-bold text-ink hover:bg-orange-deep"
                >
                  Ask
                </button>
              </form>
            </div>
          </PhoneFrame>
        </div>
      )}
      <button
        type="button"
        aria-expanded={open}
        className="inline-flex min-h-11 items-center rounded-full bg-orange px-4 text-lg font-bold text-ink hover:bg-orange-deep"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Hide chat" : "Ask"}
      </button>
    </>
  );
}

function labelFor(role: Role) {
  if (role === "advisor") return "Advisor view of the book";
  if (role === "principal") return "Your family only";
  return "Your page only";
}
