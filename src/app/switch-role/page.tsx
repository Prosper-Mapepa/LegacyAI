import type { Metadata } from "next";
import { Suspense } from "react";
import { RoleSwitch } from "@/components/role-switch";

export const metadata: Metadata = { title: "Sign in as role · LegacyAI" };

export default function SwitchRolePage() {
  return (
    <Suspense
      fallback={
        <p className="px-6 py-16 text-center text-lg text-white/80">
          Preparing role handoff…
        </p>
      }
    >
      <RoleSwitch />
    </Suspense>
  );
}
