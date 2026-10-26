"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import { nextPathFor, useAccount, usePerson } from "@/domain/accounts";
import { useLegacy } from "@/domain/store";
import { useDemoCompleted } from "@/lib/demo-completion";
import { nextDemoStep } from "@/lib/demo-flow";
import { useDemoStore } from "@/store/demo-store";
import { Chat } from "./chat";
import { AdvisorFlowRail, SHELL_PAD } from "./flow-chrome";
import { Logo } from "./logo";
import { RoleStepGuard } from "./role-step-guard";
import { StepBriefingProvider, StepLink } from "./step-briefing";

function ShellFrame({ children }: { children: ReactNode }) {
  const path = usePathname();
  const account = useAccount();
  const person = usePerson();
  const demoDone = useDemoCompleted();
  const { dispatch } = useLegacy();
  const resetWealth = useDemoStore((state) => state.resetDemo);
  const [armReset, setArmReset] = useState(false);
  const stage =
    path === "/" ||
    path === "/sign-in" ||
    path === "/switch-role" ||
    path === "/create-account" ||
    path === "/sign-out" ||
    path === "/verify" ||
    path === "/setup" ||
    path.startsWith("/switch-role");
  const stageStyle = stage ? { backgroundColor: "#032252", color: "#fff" } : undefined;
  const deskOpen = Boolean(person) && !stage;
  const home = nextPathFor(account);
  const next = deskOpen ? nextDemoStep(path) : null;
  const immersiveCustomer =
    path === "/customer" ||
    path.startsWith("/customer/chat") ||
    path.startsWith("/customer/plan");
  const chatImmersive =
    path.startsWith("/customer/chat") || path.startsWith("/customer/plan");

  /** Nav only lists features this seat may open */
  const links =
    !deskOpen || !person
      ? []
      : person.role === "advisor"
        ? [
            { href: "/dashboard", label: "AI Analysis" },
            { href: "/workbench", label: "Book" },
            { href: "/rm", label: "Outreach" },
            { href: "/report", label: "Report" },
          ]
        : person.role === "principal"
          ? [{ href: `/hub/${person.householdId}`, label: "Family hub" }]
          : person.heirId === "david"
            ? [
                { href: "/customer", label: "Intake" },
                { href: "/customer/plan", label: "Plan" },
              ]
            : person.heirId
              ? [
                  {
                    href: `/hub/${person.householdId}/heirs/${person.heirId}?live=1`,
                    label: "My space",
                  },
                ]
              : [{ href: "/customer", label: "Intake" }];

  return (
    <div
      className={`flex flex-col ${
        immersiveCustomer ? "h-svh" : "min-h-svh"
      } ${stage ? "" : "bg-mist text-ink"}`}
      style={stageStyle}
    >
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="sticky top-0 z-20 border-b border-blue/20 bg-navy">
        <div className={`${SHELL_PAD} flex flex-wrap items-center justify-between gap-3 py-3`}>
          <Link href={deskOpen ? home : "/"} aria-label="LegacyAI" className="block">
            <Logo className="h-9 sm:h-10" />
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {deskOpen && links.length > 0 ? (
              <nav className="flex flex-wrap items-center gap-1 rounded-full bg-white/10 p-1">
                {links.map((link) => {
                  const base = link.href.split("?")[0];
                  const active =
                    path === base || path.startsWith(`${base}/`);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`rounded-full px-3 py-2 text-sm font-semibold ${
                        active ? "bg-white text-ink" : "text-white/85 hover:text-white"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            ) : !deskOpen && demoDone ? (
              <nav className="flex items-center gap-2">
                <Link
                  href="/sign-in"
                  className={`inline-flex min-h-10 items-center rounded-full border px-5 text-base font-bold ${
                    path === "/sign-in"
                      ? "border-white bg-white text-ink"
                      : "border-white/70 text-white hover:bg-white/10"
                  }`}
                >
                  Sign in
                </Link>
                <Link
                  href="/create-account"
                  className={`inline-flex min-h-10 items-center rounded-full px-5 text-base font-bold ${
                    path === "/create-account"
                      ? "bg-white text-ink"
                      : "bg-orange text-ink hover:bg-orange-deep"
                  }`}
                >
                  Create account
                </Link>
              </nav>
            ) : null}
            {deskOpen && (immersiveCustomer || chatImmersive) && (
              <StepLink
                href={next?.href ?? home}
                stepId={next?.id}
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-orange px-4 text-sm font-bold text-ink hover:bg-orange-deep md:hidden"
              >
                {next ? `Next: ${next.label}` : "Start over"}
              </StepLink>
            )}
            {deskOpen && (
              <>
                {person?.role === "advisor" ? <Chat key={person.id} /> : null}
                <span className="hidden text-sm font-semibold text-white/85 sm:inline">
                  {person?.roleLabel ?? person?.name}
                </span>
                <Link href="/sign-out" className="rounded-full px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white">
                  Sign out
                </Link>
                <button
                  type="button"
                  className={`rounded-full px-3 py-2 text-sm ${
                    armReset
                      ? "bg-orange font-semibold text-ink"
                      : "text-white/75 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => {
                    if (!armReset) {
                      setArmReset(true);
                      return;
                    }
                    dispatch({ type: "reset" });
                    resetWealth();
                    setArmReset(false);
                  }}
                >
                  {armReset ? "Confirm reset" : "Reset demo"}
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      {deskOpen ? <AdvisorFlowRail /> : null}
      {deskOpen ? <RoleStepGuard /> : null}
      <main
        id="main"
        className={
          stage
            ? `${SHELL_PAD} flex-1 ${path === "/" ? "" : "py-2"}`
            : immersiveCustomer
              ? "relative flex min-h-0 flex-1 flex-col overflow-hidden p-0"
              : `${SHELL_PAD} flex-1 py-6 lg:py-8`
        }
      >
        {children}
      </main>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-svh bg-mist" />}>
      <StepBriefingProvider>
        <ShellFrame>{children}</ShellFrame>
      </StepBriefingProvider>
    </Suspense>
  );
}
