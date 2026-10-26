import type { Metadata } from "next";
import { Suspense } from "react";
import { FamilyHub } from "@/components/family-hub";
import { Gate } from "@/components/gate";

export const metadata: Metadata = { title: "Family hub · LegacyAI" };

async function HubContent({
  params,
}: {
  params: Promise<{ householdId: string }>;
}) {
  const { householdId } = await params;
  return (
    <Gate area="hub" householdId={householdId}>
      <FamilyHub householdId={householdId} />
    </Gate>
  );
}

export default function HubPage({
  params,
}: {
  params: Promise<{ householdId: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-lg text-muted">Opening the family hub.</p>}>
      <HubContent params={params} />
    </Suspense>
  );
}
