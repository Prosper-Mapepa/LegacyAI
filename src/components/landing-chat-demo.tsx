"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { PhoneFrame } from "@/components/phone-frame";
import { FAMILY_LAST_NAME } from "@/data/story";
import { cn } from "@/lib/utils";

type Msg = { id: string; from: "bot" | "user"; text: string };
type Screen = "push" | "email" | "chat";

type ChatPhase =
  | { kind: "bot"; text: string; holdMs: number }
  | { kind: "type"; text: string; charMs: number }
  | { kind: "send"; holdMs: number }
  | { kind: "think"; label: string; holdMs: number }
  | { kind: "pause"; holdMs: number }
  | { kind: "done" };

const CHAT_SCRIPT: ChatPhase[] = [
  {
    kind: "bot",
    text: "Welcome to LegacyAI. To confirm it's you, what's your last name?",
    holdMs: 900,
  },
  { kind: "type", text: FAMILY_LAST_NAME, charMs: 55 },
  { kind: "send", holdMs: 280 },
  { kind: "think", label: "Updating intake", holdMs: 1000 },
  {
    kind: "bot",
    text: `Thanks, ${FAMILY_LAST_NAME}. What's your birthday?`,
    holdMs: 700,
  },
  { kind: "type", text: "01/15/1984", charMs: 48 },
  { kind: "send", holdMs: 280 },
  { kind: "think", label: "Updating intake", holdMs: 900 },
  {
    kind: "bot",
    text: "What's your monthly income (before tax)?",
    holdMs: 650,
  },
  { kind: "type", text: "12000", charMs: 65 },
  { kind: "send", holdMs: 280 },
  { kind: "think", label: "Updating intake", holdMs: 900 },
  {
    kind: "bot",
    text: "About how much do you spend each month?",
    holdMs: 650,
  },
  { kind: "type", text: "4500", charMs: 65 },
  { kind: "send", holdMs: 280 },
  { kind: "think", label: "Updating intake", holdMs: 900 },
  {
    kind: "bot",
    text: "How many family members live at home (including you)?",
    holdMs: 650,
  },
  { kind: "type", text: "3", charMs: 110 },
  { kind: "send", holdMs: 280 },
  { kind: "think", label: "Updating intake", holdMs: 1100 },
  { kind: "pause", holdMs: 1800 },
  { kind: "done" },
];

function ThinkingBubble({ label }: { label: string }) {
  return (
    <div
      className="flex max-w-[90%] items-center gap-3 rounded-2xl border border-line bg-white px-3.5 py-3 text-sm text-muted shadow-sm"
      aria-live="polite"
    >
      <span
        className="process-spinner shrink-0 !h-5 !w-5 !border-2"
        aria-hidden
      />
      <div className="min-w-0">
        <p className="font-semibold text-ink">{label}</p>
        <p className="mt-0.5 text-xs text-muted">
          LegacyAI is working on your answer…
        </p>
      </div>
    </div>
  );
}

function PushScreen({ pulse }: { pulse: boolean }) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-gradient-to-b from-slate-100 to-slate-200 px-4 pb-8 pt-5">
      <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-orange">
        Tap notification
      </p>
      <div
        className={cn(
          "mt-3 rounded-2xl p-0.5 transition",
          pulse && "ring-4 ring-orange/45",
        )}
      >
        <div className="w-full rounded-2xl border-2 border-orange bg-white p-4 text-left shadow-lg">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange text-white shadow-md">
              <Bell className="notif-bell-vibrate h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 pt-0.5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-ink">LegacyAI</p>
                <p className="shrink-0 text-[11px] text-muted">now</p>
              </div>
              <p className="mt-1 text-sm font-medium leading-snug text-ink">
                Your advisor invited your family to LegacyAI. Tap to review
                securely in the app.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Matches the system invite email on /customer (Heir Whitfield). */
function EmailScreen() {
  const firstName = "Heir";
  const lastName = FAMILY_LAST_NAME;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-white">
      <header className="flex shrink-0 items-center gap-1 border-b border-line px-2 py-2.5">
        <p className="inline-flex items-center gap-0.5 px-2 py-1.5 text-sm font-semibold text-blue">
          <span aria-hidden className="text-base leading-none">
            ‹
          </span>
          Inbox
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-2 pt-4">
        <h2 className="text-xl font-bold leading-snug tracking-tight text-ink">
          Your LegacyAI planning invite
        </h2>

        <div className="mt-4 flex items-start gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue text-sm font-bold text-white"
            aria-hidden
          >
            L
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-semibold text-ink">
                LegacyAI Concierge
              </p>
              <p className="shrink-0 text-[11px] text-muted">Today</p>
            </div>
            <p className="mt-0.5 text-xs text-muted">
              to {firstName} {lastName}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3.5 text-[15px] leading-relaxed text-ink">
          <p>Hi {firstName},</p>
          <p>
            Your Advisor invited you (the Heir on {lastName} family) to complete
            a short <strong>LegacyAI</strong> intake. Answer a few questions and
            we will sketch how to split your fund across Liquidity, Safe
            Investment, and Growth.
          </p>
          <p>
            Guidance only — an RM reviews every recommendation before you act.
            Optional details can be skipped anytime.
          </p>
          <p className="text-xs leading-normal text-muted">
            Demo prototype · synthetic data · not a real bank email
          </p>
        </div>
      </div>

      <div className="shrink-0 border-t border-line bg-white px-4 py-3">
        <div className="flex h-11 w-full items-center justify-center rounded-lg bg-orange text-base font-bold text-ink">
          Open intake chat
        </div>
      </div>
    </div>
  );
}

/**
 * Landing hero phone: notification → email → intake chat, then loops.
 */
export function LandingChatDemo({ className }: { className?: string }) {
  const [screen, setScreen] = useState<Screen>("push");
  const [pushPulse, setPushPulse] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [ready, setReady] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef(0);
  const alive = useRef(true);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function later(fn: () => void, ms: number) {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  useEffect(() => {
    setReady(true);
  }, []);

  // Screen choreography: push → email → chat → reset
  useEffect(() => {
    if (!ready) return;
    alive.current = true;
    clearTimers();

    if (screen === "push") {
      setPushPulse(false);
      later(() => setPushPulse(true), 700);
      later(() => {
        setPushPulse(false);
        setScreen("email");
      }, 2800);
      return () => {
        alive.current = false;
        clearTimers();
      };
    }

    if (screen === "email") {
      later(() => setScreen("chat"), 4200);
      return () => {
        alive.current = false;
        clearTimers();
      };
    }

    // chat
    setMessages([]);
    setDraft("");
    setThinking(null);
    setSending(false);
    stepRef.current = 0;

    const run = () => {
      if (!alive.current) return;
      const phase = CHAT_SCRIPT[stepRef.current];
      if (!phase) return;

      if (phase.kind === "done") {
        later(() => setScreen("push"), 400);
        return;
      }

      if (phase.kind === "bot") {
        setThinking(null);
        setSending(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `b-${stepRef.current}-${prev.length}`,
            from: "bot",
            text: phase.text,
          },
        ]);
        stepRef.current += 1;
        later(run, phase.holdMs);
        return;
      }

      if (phase.kind === "type") {
        setThinking(null);
        setSending(false);
        let i = 0;
        const tick = () => {
          if (!alive.current) return;
          i += 1;
          setDraft(phase.text.slice(0, i));
          if (i < phase.text.length) later(tick, phase.charMs);
          else {
            stepRef.current += 1;
            later(run, 300);
          }
        };
        later(tick, 180);
        return;
      }

      if (phase.kind === "send") {
        setSending(true);
        const prior = CHAT_SCRIPT[stepRef.current - 1];
        const answer =
          prior && prior.kind === "type" ? prior.text : FAMILY_LAST_NAME;
        later(() => {
          if (!alive.current) return;
          setMessages((prev) => [
            ...prev,
            {
              id: `u-${stepRef.current}-${prev.length}`,
              from: "user",
              text: answer,
            },
          ]);
          setDraft("");
          setSending(false);
          stepRef.current += 1;
          later(run, 200);
        }, phase.holdMs);
        return;
      }

      if (phase.kind === "think") {
        setThinking(phase.label);
        stepRef.current += 1;
        later(run, phase.holdMs);
        return;
      }

      if (phase.kind === "pause") {
        setThinking(null);
        stepRef.current += 1;
        later(run, phase.holdMs);
      }
    };

    later(run, 500);
    return () => {
      alive.current = false;
      clearTimers();
    };
  }, [ready, screen]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, thinking, draft, screen]);

  const title =
    screen === "push"
      ? "Messages"
      : screen === "email"
        ? "Mail"
        : "LegacyAI Chat";

  return (
    <div className={cn("relative mx-auto w-[360px]", className)}>
      <div className="intake-phone-halo rounded-[2.1rem]">
        <PhoneFrame
          title={title}
          fillHeight
          className="relative mx-0 h-[min(46rem,calc(100svh-6rem))] w-[360px] max-w-[360px] !shadow-none"
        >
          {screen === "push" && <PushScreen pulse={pushPulse} />}
          {screen === "email" && <EmailScreen />}
          {screen === "chat" && (
            <div
              className="flex h-full min-h-0 flex-1 flex-col bg-[#f7f9fc]"
              aria-label="Simulated LegacyAI intake conversation"
            >
              <div
                ref={listRef}
                className="grid min-h-0 flex-1 content-start gap-2.5 overflow-y-auto overscroll-contain px-3.5 py-3.5"
              >
                {messages.map((msg) => (
                  <p
                    key={msg.id}
                    className={cn(
                      "max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 shadow-sm",
                      msg.from === "user"
                        ? "ml-auto bg-blue text-white"
                        : "bg-white text-ink",
                    )}
                  >
                    {msg.text}
                  </p>
                ))}
                {thinking && <ThinkingBubble label={thinking} />}
              </div>
              <div className="flex shrink-0 gap-2 border-t border-line bg-white p-3">
                <div className="flex min-h-11 min-w-0 flex-1 items-center rounded-full border border-line px-4 text-sm text-ink">
                  <span className={cn(!draft && "text-muted")}>
                    {draft || "Type your answer"}
                  </span>
                  {draft && (
                    <span
                      aria-hidden
                      className="ml-0.5 inline-block h-[1em] w-[0.08em] animate-pulse bg-ink/70"
                    />
                  )}
                </div>
                <span
                  className={cn(
                    "inline-flex h-11 shrink-0 items-center justify-center rounded-full px-4 text-sm font-bold transition",
                    sending
                      ? "scale-95 bg-orange-deep text-ink"
                      : draft
                        ? "bg-orange text-ink"
                        : "bg-orange/50 text-ink/60",
                  )}
                >
                  Send
                </span>
              </div>
            </div>
          )}
        </PhoneFrame>
      </div>
    </div>
  );
}
