"use client";

import { useEffect, useState } from "react";
import { PhoneFrame } from "@/components/phone-frame";
import { Button } from "@/components/ui/button";
import type { TalkBeat } from "@/domain/brief";
import { cn } from "@/lib/utils";

type Phase = "dialing" | "ringing" | "connected" | "ended";

const PHASE_MS: Record<Exclude<Phase, "ended">, number> = {
  dialing: 900,
  ringing: 2200,
  connected: 0,
};

/**
 * Simulated Advisor → Principal call after “I’ll make this call”.
 */
export function SimulatedCall({
  principalName,
  familyName,
  talkNote,
  talkBeats,
  endLabel = "Back to desk",
  onEnd,
}: {
  principalName: string;
  familyName: string;
  /** Fallback plain script if beats are not passed */
  talkNote: string;
  talkBeats?: TalkBeat[];
  endLabel?: string;
  onEnd: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("dialing");
  const [elapsed, setElapsed] = useState(0);
  const [beatIndex, setBeatIndex] = useState(0);

  useEffect(() => {
    if (phase === "ended" || phase === "connected") return;
    const next: Phase = phase === "dialing" ? "ringing" : "connected";
    const t = window.setTimeout(() => setPhase(next), PHASE_MS[phase]);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "connected") return;
    const id = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  const timer = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(
    elapsed % 60,
  ).padStart(2, "0")}`;

  const beats = talkBeats ?? [];
  const activeBeat = beats[beatIndex] ?? null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/80 p-3 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sim-call-title"
    >
      <div className="w-full max-w-md">
        <PhoneFrame title="Call" tone="dark" className="shadow-2xl">
          <div className="flex min-h-[min(70vh,560px)] flex-1 flex-col bg-gradient-to-b from-[#061226] via-[#0a2240] to-[#061226] px-4 pb-5 pt-6 text-white md:min-h-[640px]">
            <p
              id="sim-call-title"
              className="text-center text-[10px] font-semibold uppercase tracking-wide text-white/55"
            >
              {phase === "ended" ? "Call ended" : "Advisor line"}
            </p>
            <p className="mt-2 text-center font-display text-2xl tracking-tight">
              {principalName}
            </p>
            <p className="mt-0.5 text-center text-sm text-white/65">{familyName}</p>

            <div className="mt-4 flex min-h-0 flex-1 flex-col">
              {phase === "dialing" && (
                <div className="flex flex-1 flex-col items-center justify-center gap-3">
                  <span className="process-spinner !border-orange !border-t-transparent" />
                  <p className="text-sm text-orange">Dialing…</p>
                </div>
              )}
              {phase === "ringing" && (
                <div className="flex flex-1 flex-col items-center justify-center gap-3">
                  <div
                    className="grid h-16 w-16 place-items-center rounded-full bg-orange/20 ring-4 ring-orange/40 ai-live-dot"
                    aria-hidden
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M6.5 4.5c.6-.6 1.6-.5 2.1.2l1.4 2a1.5 1.5 0 0 1-.3 2L8.5 10a12 12 0 0 0 5.5 5.5l1.3-1.2a1.5 1.5 0 0 1 2-.3l2 1.4c.7.5.8 1.5.2 2.1l-1.2 1.2c-.6.6-1.5.8-2.3.5A16 16 0 0 1 5 7.8c-.3-.8-.1-1.7.5-2.3L6.5 4.5Z"
                        fill="#F58025"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-orange">Ringing…</p>
                </div>
              )}
              {phase === "connected" && (
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="flex shrink-0 flex-col items-center gap-1">
                    <p className="font-mono text-lg text-orange">{timer}</p>
                    <p className="text-sm font-semibold text-white">Connected</p>
                  </div>

                  {activeBeat ? (
                    <div className="mt-3 flex min-h-0 flex-1 flex-col rounded-xl border border-white/15 bg-white/10 p-3">
                      <div className="flex shrink-0 items-center justify-between gap-2">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-orange">
                          Step {activeBeat.step} of {beats.length} ·{" "}
                          {activeBeat.label}
                        </p>
                        <ol className="flex gap-1" aria-label="Script progress">
                          {beats.map((beat, i) => (
                            <li
                              key={beat.step}
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                i === beatIndex
                                  ? "bg-orange"
                                  : i < beatIndex
                                    ? "bg-white/70"
                                    : "bg-white/25",
                              )}
                            />
                          ))}
                        </ol>
                      </div>
                      <p className="mt-3 min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-white/95">
                        {activeBeat.say}
                      </p>
                      <div className="mt-3 flex shrink-0 gap-2">
                        <button
                          type="button"
                          disabled={beatIndex === 0}
                          className="flex-1 rounded-lg border border-white/20 py-2 text-xs font-semibold text-white/80 disabled:opacity-40"
                          onClick={() => setBeatIndex((i) => Math.max(0, i - 1))}
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          disabled={beatIndex >= beats.length - 1}
                          className="flex-1 rounded-lg bg-orange py-2 text-xs font-bold text-ink disabled:opacity-40"
                          onClick={() =>
                            setBeatIndex((i) =>
                              Math.min(beats.length - 1, i + 1),
                            )
                          }
                        >
                          Next line
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-xl border border-white/15 bg-white/10 p-3 text-left">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-orange">
                        Advisor note · Principal
                      </p>
                      <pre className="mt-2 whitespace-pre-wrap font-sans text-xs leading-5 text-white/90">
                        {talkNote}
                      </pre>
                    </div>
                  )}
                </div>
              )}
              {phase === "ended" && (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
                  <p className="text-base font-semibold text-white">
                    Call logged
                  </p>
                  <p className="text-sm leading-6 text-white/75">
                    {talkBeats && talkBeats.some((b) => /intake/i.test(b.label))
                      ? "We’ll send the intake email next. Continue to Intake as the customer."
                      : "Brief stays on your desk. Next: Principal allows a call in the hub before Outreach."}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 flex shrink-0 flex-col items-center gap-2">
              {phase === "connected" && (
                <Button
                  type="button"
                  className="min-w-[10rem] rounded-full bg-red-600 text-white hover:bg-red-700"
                  onClick={() => setPhase("ended")}
                >
                  End call
                </Button>
              )}
              {phase === "ended" && (
                <Button
                  type="button"
                  className="min-w-[10rem] rounded-full bg-orange text-ink hover:bg-orange-deep"
                  onClick={onEnd}
                >
                  {endLabel}
                </Button>
              )}
              {(phase === "dialing" || phase === "ringing") && (
                <button
                  type="button"
                  className="text-sm font-semibold text-white/70 underline-offset-2 hover:text-white hover:underline"
                  onClick={() => setPhase("connected")}
                >
                  Skip to connected
                </button>
              )}
            </div>
          </div>
        </PhoneFrame>
      </div>
    </div>
  );
}
