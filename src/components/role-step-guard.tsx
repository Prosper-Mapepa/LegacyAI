"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePerson } from "@/domain/accounts";
import {
  matchDemoStep,
  personMatchesStepRole,
  roleSwitchHref,
} from "@/lib/demo-flow";
import { useSystemTourOptional } from "@/components/system-tour";

/**
 * When the signed-in seat does not match the demo step’s role,
 * send the user through Sign in as [Role] before the step content.
 * Skipped while the in-app tour is driving seat switches itself.
 */
export function RoleStepGuard() {
  const path = usePathname();
  const router = useRouter();
  const person = usePerson();
  const tour = useSystemTourOptional();

  useEffect(() => {
    if (!person) return;
    if (tour?.open) return;
    if (
      path === "/" ||
      path.startsWith("/sign-") ||
      path.startsWith("/switch-role") ||
      path.startsWith("/create-account") ||
      path.startsWith("/verify") ||
      path.startsWith("/setup")
    ) {
      return;
    }

    const step = matchDemoStep(path);
    if (personMatchesStepRole(person.role, step.role)) return;
    router.replace(roleSwitchHref(step));
  }, [path, person, router, tour?.open]);

  return null;
}
