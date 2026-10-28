"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import {
  isDeskReady,
  nextPathFor,
  useAccount,
  usePerson,
} from "@/domain/accounts";
import { allowed, type GateArea } from "@/domain/people";
import { useClientReady } from "@/domain/session";
import {
  matchDemoStep,
  personMatchesStepRole,
  roleSwitchHref,
} from "@/lib/demo-flow";
import { useSystemTourOptional } from "@/components/system-tour";

export function Gate({
  area,
  householdId,
  heirId,
  children,
}: {
  area: GateArea;
  householdId?: string;
  heirId?: string;
  children: ReactNode;
}) {
  const ready = useClientReady();
  const router = useRouter();
  const path = usePathname();
  const account = useAccount();
  const person = usePerson();
  const tour = useSystemTourOptional();
  const home = nextPathFor(account);
  const deskReady = isDeskReady(account);
  const ok =
    person && deskReady ? allowed(person, area, householdId, heirId) : false;

  useEffect(() => {
    if (!ready) return;
    // Tour drives seat + route; don't fight it
    if (tour?.open) return;
    if (!account) {
      router.replace("/sign-in");
      return;
    }
    if (!deskReady) {
      router.replace(home);
      return;
    }
    if (ok) return;

    // Wrong seat for this desk → Sign in as [Role], not a soft dump home
    const step = matchDemoStep(path);
    if (person && !personMatchesStepRole(person.role, step.role)) {
      router.replace(roleSwitchHref(step));
      return;
    }
    router.replace(home);
  }, [ready, account, deskReady, home, ok, path, person, router, tour?.open]);

  // While tour is open, render the screen so spotlight targets exist
  if (tour?.open && ready && account && deskReady) {
    return children;
  }

  if (!ready || !ok) {
    return <p className="text-lg text-muted">Opening your desk.</p>;
  }

  return children;
}
