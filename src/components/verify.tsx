"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  confirmOtp,
  DEMO_OTP,
  nextPathFor,
  readPendingOtp,
  startOtp,
  useAccount,
} from "@/domain/accounts";

const field =
  "mt-2 min-h-11 w-full rounded-lg border border-white/20 bg-white/10 px-3.5 text-base tracking-[0.35em] text-white outline-none focus:border-orange";

const glass = "rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm";

export function Verify() {
  const router = useRouter();
  const account = useAccount();
  const [channel, setChannel] = useState<"email" | "phone">("email");
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!account) {
      router.replace("/sign-in");
      return;
    }
    if (account.verified) {
      router.replace(nextPathFor(account));
      return;
    }
    const pendingOtp = readPendingOtp();
    if (pendingOtp?.accountId === account.id) {
      setChannel(pendingOtp.channel);
      setSentTo(pendingOtp.sentTo);
    }
  }, [account, router]);

  if (!account || account.verified) {
    return <p className="px-1 py-14 text-lg text-white/75">Opening verification…</p>;
  }

  function send(next: "email" | "phone") {
    setError("");
    const message = startOtp(account!.id, next);
    if (message) {
      setError(message);
      return;
    }
    setChannel(next);
    setSentTo(next === "email" ? account!.email : account!.phone);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!account) return;
    setPending(true);
    setError("");
    if (!sentTo) {
      setPending(false);
      setError("Send a code to your email or phone first.");
      return;
    }
    const message = confirmOtp(account.id, code);
    setPending(false);
    if (message) {
      setError(message);
      return;
    }
    router.push("/setup");
  }

  return (
    <div className="mx-auto w-full max-w-xl px-1 py-10 lg:py-14">
      <p className="text-sm font-semibold text-orange">Verify</p>
      <h1 className="font-display mt-2 text-4xl tracking-tight text-white">Confirm it is you</h1>
      <p className="mt-3 text-lg leading-7 text-white/75">
        Choose email or phone. Family details stay hidden until this step is done.
      </p>

      <div className={`mt-8 p-6 sm:p-8 ${glass}`}>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => send("email")}
            className={`min-h-11 rounded-lg border px-3 text-sm font-semibold ${
              channel === "email" && sentTo
                ? "border-orange bg-orange text-ink"
                : "border-white/20 bg-white/10 text-white hover:bg-white/15"
            }`}
          >
            Send to email
          </button>
          <button
            type="button"
            onClick={() => send("phone")}
            className={`min-h-11 rounded-lg border px-3 text-sm font-semibold ${
              channel === "phone" && sentTo
                ? "border-orange bg-orange text-ink"
                : "border-white/20 bg-white/10 text-white hover:bg-white/15"
            }`}
          >
            Send to phone
          </button>
        </div>

        {sentTo && (
          <p className="mt-4 text-sm leading-6 text-white/75">
            Code sent to <span className="font-semibold text-white">{sentTo}</span>. For this pilot,
            use <span className="font-semibold text-white">{DEMO_OTP}</span>.
          </p>
        )}

        <form onSubmit={submit} className="mt-6">
          <label className="block text-sm font-semibold text-white" htmlFor="otp">
            One-time code
            <input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              className={field}
            />
          </label>

          {error && (
            <p className="mt-4 text-sm font-semibold text-[#ffb4b4]" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-orange text-base font-semibold text-ink hover:bg-orange-deep disabled:opacity-60"
          >
            {pending ? "Checking…" : "Verify and continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
