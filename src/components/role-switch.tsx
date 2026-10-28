"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  DEMO_PASSWORD,
  signIn,
  usePerson,
} from "@/domain/accounts";
import {
  DEMO_FLOW,
  ROLE_SEAT_EMAIL,
  demoStepById,
  domainRoleForTab,
  personMatchesStepRole,
  type DemoStepId,
  type TabRole,
} from "@/lib/demo-flow";

const field =
  "mt-2 min-h-12 w-full rounded-lg border border-white/20 bg-white/10 px-3.5 text-lg text-white outline-none placeholder:text-white/45 focus:border-orange";

const glass = "rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm";

const ROLE_FROM: Record<string, string> = {
  advisor: "Advisor",
  principal: "Principal",
  heir: "Heir",
};

const ROLE_BLURB: Record<TabRole, string> = {
  Advisor: "You see the book, briefs, and outreach. Lesson answers stay private.",
  Principal: "You invite Heir and allow a call before Outreach can begin.",
  Heir: "You are the customer on the phone — intake and the draft plan.",
};

export function RoleSwitch() {
  const router = useRouter();
  const params = useSearchParams();
  const person = usePerson();
  const stepId = (params.get("step") as DemoStepId | null) ?? "hub";
  const nextHref = params.get("next");
  const step = useMemo(() => demoStepById(stepId), [stepId]);
  const target = nextHref || step.href;
  const seatEmail = ROLE_SEAT_EMAIL[step.role];
  const requiredRole = domainRoleForTab(step.role);

  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (person && personMatchesStepRole(person.role, step.role)) {
      router.replace(target);
    }
  }, [person, router, step.role, target]);

  if (person && personMatchesStepRole(person.role, step.role)) {
    return (
      <p className="px-6 py-16 text-center text-lg text-white/80">
        Opening {step.label}…
      </p>
    );
  }

  async function finish(emailValue: string, passwordValue: string) {
    setPending(true);
    setError("");
    const result = await signIn(emailValue, passwordValue);
    setPending(false);
    if (result.error || !result.account) {
      setError(result.error ?? "Sign in failed.");
      return;
    }
    if (result.account.role !== requiredRole) {
      setError(`That account is not the ${step.role} seat.`);
      return;
    }
    router.push(target);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    await finish(seatEmail, password);
  }

  const fromRole =
    person?.roleLabel ||
    (person?.role ? ROLE_FROM[person.role] : null) ||
    "your current seat";

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-8 px-1 py-10 lg:py-14">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-orange">
          Role handoff · Step {step.n}
        </p>
        <h1 className="font-display mt-3 text-4xl tracking-tight text-white sm:text-5xl">
          Sign in as {step.role}
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-white/75">
          You were acting as{" "}
          <strong className="text-white">{fromRole}</strong>. The next stage —{" "}
          <strong className="text-white">{step.label}</strong> — needs the{" "}
          {step.role} seat. {ROLE_BLURB[step.role]}
        </p>
      </div>

      <div className={`p-6 sm:p-8 ${glass}`}>
        <p className="text-base font-bold text-white">
          Whitfield seat · {seatEmail}
        </p>
        <p className="mt-1 text-sm text-white/65">
          Password defaults to{" "}
          <span className="font-semibold text-white">{DEMO_PASSWORD}</span>
        </p>

        <form onSubmit={submit} className="mt-6 max-w-md">
          <label className="block text-base font-bold text-white" htmlFor="role-password">
            Password
            <input
              id="role-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={field}
            />
          </label>

          {error && (
            <p className="mt-4 text-base font-semibold text-[#ffb4b4]" role="alert">
              {error}
            </p>
          )}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-lg bg-orange text-lg font-bold text-ink hover:bg-orange-deep disabled:opacity-60"
            >
              {pending ? "Signing in…" : `Sign in as ${step.role}`}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => finish(seatEmail, DEMO_PASSWORD)}
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/25 px-5 text-base font-bold text-white hover:bg-white/10 disabled:opacity-60"
            >
              Use {step.role} seat
            </button>
          </div>
        </form>

        <p className="mt-6 text-sm leading-7 text-white/55">
          Demo flow:{" "}
          {DEMO_FLOW.map((item, index) => (
            <span key={item.id}>
              {item.n === step.n ? (
                <strong className="text-orange">
                  {item.label} ({item.role})
                </strong>
              ) : (
                <span>
                  {item.label} ({item.role})
                </span>
              )}
              {index < DEMO_FLOW.length - 1 ? " → " : ""}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
