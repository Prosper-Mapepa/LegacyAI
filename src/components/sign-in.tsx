"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, nextPathFor, signIn } from "@/domain/accounts";

const field =
  "mt-2 min-h-12 w-full rounded-lg border border-white/20 bg-white/10 px-3.5 text-lg text-white outline-none placeholder:text-white/45 focus:border-orange";

const glass = "rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm";

const ROLE_LABEL = {
  advisor: "Advisor",
  principal: "Principal",
  heir: "Heir",
} as const;

export function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function finish(emailValue: string, passwordValue: string) {
    setPending(true);
    setError("");
    const result = await signIn(emailValue, passwordValue);
    setPending(false);
    if (result.error || !result.account) {
      setError(result.error ?? "Sign in failed.");
      return;
    }
    router.push(nextPathFor(result.account));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    await finish(email, password);
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-10 px-1 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-12 lg:py-14">
      <div>
        <p className="text-xl font-bold text-orange">Sign in</p>
        <h1 className="font-display mt-3 text-4xl tracking-tight text-white sm:text-5xl">
          Open your desk
        </h1>
        <p className="mt-4 max-w-lg text-lg leading-8 text-white/75">
          Enter the email and password for your account. Each role opens a different set of facts.
        </p>

        <form onSubmit={submit} className={`mt-8 max-w-md p-6 sm:p-8 ${glass}`}>
          <label className="block text-base font-bold text-white" htmlFor="email">
            Email
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={field}
            />
          </label>
          <label className="mt-5 block text-base font-bold text-white" htmlFor="password">
            Password
            <input
              id="password"
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

          <button
            type="submit"
            disabled={pending}
            className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-orange text-lg font-bold text-ink hover:bg-orange-deep disabled:opacity-60"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
          <p className="mt-5 text-center text-base text-white/75">
            New here?{" "}
            <Link href="/create-account" className="font-bold text-orange">
              Create account
            </Link>
          </p>
        </form>
      </div>

      <aside className={`p-6 sm:p-7 ${glass}`}>
        <p className="text-xl font-bold text-white">Pilot seats</p>
        <p className="mt-2 text-base leading-7 text-white/70">
          Three roles for the demo. Password:{" "}
          <span className="font-bold text-white">{DEMO_PASSWORD}</span>
        </p>
        <ul className="mt-6 flex flex-col gap-3">
          {DEMO_ACCOUNTS.map((account) => (
            <li key={account.id}>
              <div className="flex flex-col gap-4 rounded-xl border border-white/15 bg-white/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-lg font-bold text-orange">{ROLE_LABEL[account.role]}</p>
                  <p className="mt-1 text-xl font-bold text-white">{account.name}</p>
                  <p className="mt-1 text-base text-white/65">
                    Pilot family · {account.email}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => finish(account.email, DEMO_PASSWORD)}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-orange px-5 text-base font-bold text-ink hover:bg-orange-deep disabled:opacity-60"
                >
                  Use seat
                </button>
              </div>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
