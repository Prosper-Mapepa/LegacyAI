import type { Metadata } from "next";
import { SignOut } from "@/components/sign-out";

export const metadata: Metadata = { title: "Signed out · LegacyAI" };

export default function SignOutPage() {
  return <SignOut />;
}
