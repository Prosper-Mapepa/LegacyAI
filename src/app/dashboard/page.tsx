import type { Metadata } from "next";
import { Suspense } from "react";
import { Dashboard } from "@/components/dashboard";
import { Gate } from "@/components/gate";

export const metadata: Metadata = { title: "Dashboard · LegacyAI" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="text-lg text-muted">Opening your desk.</p>}>
      <Gate area="signal">
        <Dashboard />
      </Gate>
    </Suspense>
  );
}
