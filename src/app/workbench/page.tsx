import type { Metadata } from "next";
import { Suspense } from "react";
import { Gate } from "@/components/gate";
import { WorkbenchQueue } from "@/components/workbench-queue";

export const metadata: Metadata = { title: "Advisor desk · LegacyAI" };

export default function WorkbenchPage() {
  return (
    <Suspense fallback={<p className="text-lg text-muted">Opening the desk.</p>}>
      <Gate area="book">
        <WorkbenchQueue />
      </Gate>
    </Suspense>
  );
}
