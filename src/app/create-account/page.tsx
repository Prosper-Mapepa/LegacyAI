import type { Metadata } from "next";
import { CreateAccount } from "@/components/create-account";
import { DemoUnlockGate } from "@/components/demo-unlock-gate";

export const metadata: Metadata = { title: "Create account · LegacyAI" };

export default function CreateAccountPage() {
  return (
    <DemoUnlockGate>
      <CreateAccount />
    </DemoUnlockGate>
  );
}
