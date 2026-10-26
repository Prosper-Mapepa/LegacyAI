"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useDemoCompleted } from "@/lib/demo-completion";

/** Blocks family Sign in / Create account until the full demo has finished once. */
export function DemoUnlockGate({ children }: { children: ReactNode }) {
  const ready = useDemoCompleted();
  const router = useRouter();

  useEffect(() => {
    if (!ready) router.replace("/");
  }, [ready, router]);

  if (!ready) {
    return (
      <p className="px-6 py-16 text-center text-lg text-white/75">
        Finish the full demo once to unlock Sign in and Create account.
      </p>
    );
  }

  return children;
}
