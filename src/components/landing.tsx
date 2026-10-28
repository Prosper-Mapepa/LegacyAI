"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
            AI-Assisted
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
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/40 px-6 text-base font-semibold text-white/90 transition hover:bg-white/10"
              >
                Sign in as family
              </Link>
            ) : null}
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
