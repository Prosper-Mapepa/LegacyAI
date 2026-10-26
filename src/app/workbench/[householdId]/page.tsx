import type { Metadata } from "next";
import { Suspense } from "react";
import { Gate } from "@/components/gate";
import { HouseholdDesk } from "@/components/household-desk";

export const metadata: Metadata = { title: "Household · LegacyAI" };

async function HouseholdContent({
  params,
}: {
  params: Promise<{ householdId: string }>;
}) {
  const { householdId } = await params;
  return (
    <Gate area="book">
      <HouseholdDesk householdId={householdId} />
    </Gate>
  );
}

export default function HouseholdPage({
  params,
}: {
  params: Promise<{ householdId: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-lg text-muted">Opening the household.</p>}>
      <HouseholdContent params={params} />
    </Suspense>
  );
}
