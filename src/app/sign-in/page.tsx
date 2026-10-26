import type { Metadata } from "next";
import { DemoUnlockGate } from "@/components/demo-unlock-gate";
import { SignIn } from "@/components/sign-in";

export const metadata: Metadata = { title: "Sign in · LegacyAI" };

export default function SignInPage() {
  return (
    <DemoUnlockGate>
      <SignIn />
    </DemoUnlockGate>
  );
}
