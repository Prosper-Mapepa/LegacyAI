"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { nextPathFor, register, type FamilyRole } from "@/domain/accounts";

const field =
  "mt-2 min-h-12 w-full rounded-lg border border-white/20 bg-white/10 px-3.5 text-lg text-white outline-none placeholder:text-white/45 focus:border-orange";

const glass = "rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm";

export function CreateAccount() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<FamilyRole>("principal");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const result = await register({
      name,
      email,
      phone,
      password,
      confirm,
      role,
    });
    setPending(false);
    if (result.error || !result.account) {
      setError(result.error ?? "Could not create the account.");
      return;
    }
    router.push(nextPathFor(result.account));
  }

  return (
    <div className="mx-auto w-full max-w-xl px-1 py-10 lg:py-14">
      <p className="text-xl font-bold text-orange">Create account</p>
      <h1 className="font-display mt-3 text-4xl tracking-tight text-white sm:text-5xl">
        Open a seat
      </h1>
      <p className="mt-4 text-lg leading-8 text-white/75">
        Principal or heir only. Family details stay locked until you verify by email or phone.
      </p>

      <form onSubmit={submit} className={`mt-8 p-6 sm:p-8 ${glass}`}>
        <div
          role="tablist"
          aria-label="Role"
          className="grid grid-cols-2 gap-2 rounded-xl border border-white/15 bg-white/5 p-1.5"
        >
          {(
            [
              { value: "principal", label: "Principal" },
              { value: "heir", label: "Heir" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={role === option.value}
              onClick={() => setRole(option.value)}
              className={`min-h-12 rounded-lg text-lg font-bold transition ${
                role === option.value
                  ? "bg-orange text-ink"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <label className="mt-6 block text-base font-bold text-white" htmlFor="name">
          Full name
          <input
            id="name"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={field}
          />
        </label>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
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
          <label className="block text-base font-bold text-white" htmlFor="phone">
            Phone number
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              required
              placeholder="+1 412 555 0100"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={field}
            />
          </label>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-base font-bold text-white" htmlFor="password">
            Password
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={field}
            />
          </label>
          <label className="block text-base font-bold text-white" htmlFor="confirm">
            Confirm password
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className={field}
            />
          </label>
        </div>

        <p className="mt-5 text-base leading-7 text-white/65">
          Family name and plan details are entered only after OTP verification. LegacyAI will not
          list existing households here.
        </p>

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
          {pending ? "Creating account…" : "Continue to verification"}
        </button>
        <p className="mt-5 text-center text-base text-white/75">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-bold text-orange">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
