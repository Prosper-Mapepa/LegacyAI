"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEMO_PASSWORD, signIn } from "@/domain/accounts";
import { STORY } from "@/data/story";
import { useDemoCompleted } from "@/lib/demo-completion";
import { Logo } from "./logo";

const PATH = [
  { role: "Advisor", beat: "Rank the book" },
  { role: "Principal", beat: "Allow the call" },
  { role: "Advisor", beat: "Outreach" },
  { role: "Heir", beat: "Intake & plan" },
] as const;

export function Landing() {
  const router = useRouter();
  const demoDone = useDemoCompleted();
  const [pending, setPending] = useState(false);

  async function startFullDemo() {
    setPending(true);
    const result = await signIn("advisor@legacyai.com", DEMO_PASSWORD);
    setPending(false);
    if (result.error) return;
    router.push("/dashboard");
  }

  return (
    <div className="relative flex min-h-[calc(100svh-5rem)] flex-col justify-center overflow-hidden py-10 sm:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(720px 380px at 15% 15%, rgba(0, 105, 170, 0.32), transparent 58%), radial-gradient(560px 320px at 90% 85%, rgba(245, 128, 37, 0.2), transparent 55%)",
        }}
      />

      <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-4 text-center">
        <Logo className="h-16 sm:h-20" />
        <p className="mt-8 text-sm font-bold uppercase tracking-[0.18em] text-orange">
          Continuity pilot
        </p>
        <h1 className="font-display mt-4 max-w-2xl text-4xl leading-tight tracking-tight text-white sm:text-5xl">
          {STORY.headline}
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-white/75 sm:text-xl">
          One guided path across Advisor, Principal, and Heir — consent first,
          then outreach, intake, and a draft plan.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <button
            type="button"
            disabled={pending}
            onClick={startFullDemo}
            className="inline-flex min-h-12 min-w-[12rem] items-center justify-center rounded-full bg-orange px-8 text-lg font-bold text-ink transition hover:bg-orange-deep disabled:opacity-60"
          >
            {pending ? "Opening…" : "Start full demo"}
          </button>
          {demoDone ? (
            <Link
              href="/sign-in"
              className="inline-flex min-h-12 min-w-[12rem] items-center justify-center rounded-full border border-white px-8 text-lg font-bold text-white transition hover:bg-white/10"
            >
              Sign in as family
            </Link>
          ) : (
            <button
              type="button"
              disabled
              title="Finish the full demo once to unlock family sign-in"
              className="inline-flex min-h-12 min-w-[12rem] cursor-not-allowed items-center justify-center rounded-full border border-white/30 px-8 text-lg font-bold text-white/40"
            >
              Sign in as family
            </button>
          )}
        </div>
        {!demoDone && (
          <p className="mt-3 max-w-md text-sm leading-6 text-white/55">
            Sign in and Create account unlock after you complete the demo
            end-to-end.
          </p>
        )}
      </div>

      <ol className="relative mx-auto mt-14 flex w-full max-w-3xl flex-wrap items-center justify-center gap-2 px-4 sm:gap-0">
        {PATH.map((item, index) => (
          <li key={`${item.role}-${item.beat}`} className="flex items-center gap-2">
            <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-left backdrop-blur-sm">
              <p className="text-[11px] font-bold uppercase tracking-wide text-orange">
                {item.role}
              </p>
              <p className="text-sm font-semibold text-white">{item.beat}</p>
            </div>
            {index < PATH.length - 1 && (
              <span className="hidden px-1 text-white/40 sm:inline" aria-hidden>
                →
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
