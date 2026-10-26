"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePerson } from "@/domain/accounts";
import {
  matchDemoStep,
  personMatchesStepRole,
  roleSwitchHref,
} from "@/lib/demo-flow";

/**
 * When the signed-in seat does not match the demo step’s role,
 * send the user through Sign in as [Role] before the step content.
 */
export function RoleStepGuard() {
  const path = usePathname();
  const router = useRouter();
  const person = usePerson();

  useEffect(() => {
    if (!person) return;
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
  }, [path, person, router]);

  return null;
}
