import type { Metadata } from "next";
import { Suspense } from "react";
import { Gate } from "@/components/gate";
import { HeirSpace } from "@/components/heir-space";

export const metadata: Metadata = { title: "Heir space · LegacyAI" };

async function HeirContent({
  params,
}: {
  params: Promise<{ householdId: string; heirId: string }>;
}) {
  const { householdId, heirId } = await params;
  return (
    <Gate area="heir" householdId={householdId} heirId={heirId}>
      <HeirSpace householdId={householdId} heirId={heirId} />
    </Gate>
  );
}

export default function HeirPage({
  params,
}: {
  params: Promise<{ householdId: string; heirId: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-lg text-muted">Opening this space.</p>}>
      <HeirContent params={params} />
    </Suspense>
  );
}
