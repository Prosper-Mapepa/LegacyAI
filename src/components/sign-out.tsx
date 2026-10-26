"use client";

import Link from "next/link";
import { useEffect } from "react";
import { clearSession } from "@/domain/session";

export function SignOut() {
  useEffect(() => {
    clearSession();
  }, []);

  return (
    <div className="mx-auto w-full max-w-xl px-1 py-14">
      <h1 className="font-display text-4xl tracking-tight text-white">You are signed out</h1>
      <p className="mt-3 text-lg leading-7 text-white/75">Sign in again to open your desk.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/sign-in"
          className="inline-flex min-h-11 items-center rounded-lg bg-orange px-5 text-base font-semibold text-ink hover:bg-orange-deep"
        >
          Sign in
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-lg border border-white/30 px-5 text-base font-semibold text-white hover:bg-white/10"
        >
          Back to the start
        </Link>
      </div>
    </div>
  );
}
