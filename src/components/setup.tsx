"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { completeSetup, nextPathFor, useAccount } from "@/domain/accounts";

const field =
  "mt-2 min-h-11 w-full rounded-lg border border-white/20 bg-white/10 px-3.5 text-base text-white outline-none placeholder:text-white/45 focus:border-orange";

const glass = "rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm";

export function Setup() {
  const router = useRouter();
  const account = useAccount();
  const [familyName, setFamilyName] = useState("");
  const [heirFirstName, setHeirFirstName] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!account) {
      router.replace("/sign-in");
      return;
    }
    if (!account.verified) {
      router.replace("/verify");
      return;
    }
    if (account.role === "advisor" || account.householdId) {
      router.replace(nextPathFor(account));
    }
  }, [account, router]);

  if (!account || !account.verified || account.role === "advisor" || account.householdId) {
    return <p className="px-1 py-14 text-lg text-white/75">Opening your setup…</p>;
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!account) return;
    setPending(true);
    setError("");
    const message = completeSetup({
      accountId: account.id,
      familyName,
      heirFirstName: account.role === "heir" ? heirFirstName : undefined,
    });
    setPending(false);
    if (message) {
      setError(message);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="mx-auto w-full max-w-xl px-1 py-10 lg:py-14">
      <p className="text-sm font-semibold text-orange">Family details</p>
      <h1 className="font-display mt-2 text-4xl tracking-tight text-white">Add them by hand</h1>
      <p className="mt-3 text-lg leading-7 text-white/75">
        Type the names yourself. LegacyAI will not offer a list of families or people on the plan.
      </p>

      <form onSubmit={submit} className={`mt-8 p-6 sm:p-8 ${glass}`}>
        <label className="block text-sm font-semibold text-white" htmlFor="family">
          Family name
          <input
            id="family"
            required
            placeholder="As it appears on the bank record"
            value={familyName}
            onChange={(event) => setFamilyName(event.target.value)}
            className={field}
          />
        </label>

        {account.role === "heir" && (
          <label className="mt-4 block text-sm font-semibold text-white" htmlFor="heir">
            Your first name on the plan
            <input
              id="heir"
              required
              placeholder="As written on the plan"
              value={heirFirstName}
              onChange={(event) => setHeirFirstName(event.target.value)}
              className={field}
            />
          </label>
        )}

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
          {pending ? "Saving…" : "Open my desk"}
        </button>
      </form>
    </div>
  );
}
