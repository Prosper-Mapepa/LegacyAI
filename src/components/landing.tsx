"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DEMO_PASSWORD, signIn } from "@/domain/accounts";
import { STORY } from "@/data/story";
import { useDemoCompleted } from "@/lib/demo-completion";
import { LandingChatDemo } from "@/components/landing-chat-demo";

const PATH = [
  { role: "Advisor", beat: "Rank the book" },
  { role: "Principal", beat: "Allow the call" },
  { role: "Advisor", beat: "Outreach" },
  { role: "Heir", beat: "Intake & plan" },
] as const;

const TYPED_LINE = "Wealth Transition & Emergency-Fund Diversification";

function useTypewriter(text: string, speedMs = 42, pauseMs = 2200) {
  const [shown, setShown] = useState("");
  const [phase, setPhase] = useState<"typing" | "holding" | "deleting">(
    "typing",
  );

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      if (shown.length < text.length) {
        timer = setTimeout(
          () => setShown(text.slice(0, shown.length + 1)),
          speedMs,
        );
      } else {
        timer = setTimeout(() => setPhase("holding"), pauseMs);
      }
    } else if (phase === "holding") {
      timer = setTimeout(() => setPhase("deleting"), 400);
    } else if (shown.length > 0) {
      timer = setTimeout(
        () => setShown(text.slice(0, shown.length - 1)),
        speedMs / 1.6,
      );
    } else {
      timer = setTimeout(() => setPhase("typing"), 500);
    }

    return () => clearTimeout(timer);
  }, [shown, phase, text, speedMs, pauseMs]);

  return shown;
}

export function Landing() {
  const router = useRouter();
  const demoDone = useDemoCompleted();
  const [pending, setPending] = useState(false);
  const typed = useTypewriter(TYPED_LINE);

  async function startFullDemo() {
    setPending(true);
    const result = await signIn("advisor@legacyai.com", DEMO_PASSWORD);
    setPending(false);
    if (result.error) return;
    router.push("/dashboard");
  }

  return (
    <div className="relative flex min-h-[calc(100svh-5rem)] items-center overflow-x-clip">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(560px 320px at 20% 35%, rgba(0, 105, 170, 0.28), transparent 62%), radial-gradient(420px 260px at 82% 45%, rgba(245, 128, 37, 0.14), transparent 58%)",
        }}
      />

      {/* Inset from shell edges so content isn't edge-to-edge */}
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-2 py-8 sm:px-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16 lg:py-5 xl:px-6">
        <div className="flex max-w-xl flex-col items-start text-left">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-orange sm:text-sm sm:tracking-[0.14em]">
            <span className="text-orange">AI-Assisted</span>{" "}
            <span className="text-white/90" aria-label={TYPED_LINE}>
              {typed}
              <span
                aria-hidden
                className="ml-0.5 inline-block h-[0.95em] w-[0.07em] translate-y-[0.08em] animate-pulse bg-white align-baseline"
              />
            </span>
          </p>

          <h1 className="font-display mt-5 text-5xl leading-[1.05] tracking-tight text-white sm:text-6xl">
            {STORY.headline}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-white/75 sm:text-xl sm:leading-9">
            One guided path across Advisor, Principal, and Heir — consent first,
            then outreach, intake, and a draft plan.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={pending}
              onClick={startFullDemo}
              className="inline-flex min-h-12 min-w-[12rem] items-center justify-center rounded-full bg-orange px-8 text-lg tracking-tight text-ink transition hover:bg-orange-deep disabled:opacity-60"
              style={{ fontWeight: 700 }}
            >
              {pending ? "Opening…" : "Start Full Demo"}
            </button>
            {demoDone ? (
              <Link
                href="/sign-in"
                className="inline-flex min-h-12 min-w-[12rem] items-center justify-center rounded-full border border-white/80 px-8 text-lg font-bold text-white transition hover:bg-white/10"
              >
                Sign in as family
              </Link>
            ) : (
              <button
                type="button"
                disabled
                title="Finish the full demo once to unlock family sign-in"
                className="inline-flex min-h-12 min-w-[12rem] cursor-not-allowed items-center justify-center rounded-full border border-white/25 px-8 text-lg font-bold text-white/35"
              >
                Sign in as family
              </button>
            )}
          </div>

          <ol className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-2.5">
            {PATH.map((item, index) => (
              <li
                key={`${item.role}-${item.beat}`}
                className="flex items-center gap-2"
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 backdrop-blur-sm">
                  <span className="text-xs font-bold tabular-nums text-orange">
                    {index + 1}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-orange">
                    {item.role}
                  </span>
                  <span className="text-sm font-semibold text-white sm:text-base">
                    {item.beat}
                  </span>
                </span>
                {index < PATH.length - 1 && (
                  <span className="text-white/35" aria-hidden>
                    →
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>

        <div className="mx-auto w-[360px] shrink-0 justify-self-center lg:mx-0 lg:justify-self-end">
          <LandingChatDemo />
        </div>
      </div>
    </div>
  );
}
