import { FEATURED_CUSTOMER_ID, PILOT_HOUSEHOLD_ID } from "@/data/story";
import type { Role } from "@/domain/people";
import type { Household } from "@/domain/types";
import type { Customer } from "@/lib/types";

export type DemoStepId =
  | "signal"
  | "book"
  | "hub"
  | "outreach"
  | "intake"
  | "plan"
  | "report";

/** Role you play on this tab */
export type TabRole = "Advisor" | "Heir" | "Principal";

export type DemoStep = {
  id: DemoStepId;
  n: number;
  label: string;
  role: TabRole;
  href: string;
  title: string;
  body: string;
  nextLabel: string;
  briefing: {
    youAre: string;
    why: string;
    doThis: string[];
  };
};

/**
 * Seamless path: continuity first, Principal consent on Hub,
 * then wealth outreach → intake → plan.
 */
export const DEMO_FLOW: DemoStep[] = [
  {
    id: "signal",
    n: 1,
    label: "AI Analysis",
    role: "Advisor",
    href: "/dashboard",
    title: "AI Client Analysis",
    body: "Review calculated figures for the featured client, then open the family that needs you.",
    nextLabel: "Next: Book",
    briefing: {
      youAre: "Role: Advisor",
      why: "AI ranks the book and surfaces client figures. You decide the next conversation.",
      doThis: [
        "Review Heir Pilot’s calculated report.",
        "Pilot family should be first in the list.",
        "Open it, or tap Next for the Book.",
      ],
    },
  },
  {
    id: "book",
    n: 2,
    label: "Book",
    role: "Advisor",
    href: "/workbench",
    title: "Open a family desk",
    body: "Pick a family, read the next step, approve your brief.",
    nextLabel: "Next: Hub",
    briefing: {
      youAre: "Role: Advisor",
      why: "Turn the signal into a brief. Then the Principal must allow outreach.",
      doThis: [
        "Open Pilot family.",
        "Approve or set aside your brief.",
        "Go to Hub so the Principal can allow a call.",
      ],
    },
  },
  {
    id: "hub",
    n: 3,
    label: "Hub",
    role: "Principal",
    href: `/hub/${PILOT_HOUSEHOLD_ID}`,
    title: "Allow the next step",
    body: "Invite Heir and allow a call before any outreach goes out.",
    nextLabel: "Next: Outreach",
    briefing: {
      youAre: "Role: Principal",
      why: "Outreach waits for you. Invite Heir, then allow a call.",
      doThis: [
        "Invite Heir if they are still waiting.",
        "Tap Allow call for Heir or Sibling.",
        "You’ll hand off to the Advisor so they see the approval on Step 1.",
      ],
    },
  },
  {
    id: "outreach",
    n: 4,
    label: "Outreach",
    role: "Advisor",
    href: "/rm",
    title: "Call and send intake",
    body: "Principal allowed the call. Speak with Heir or Sibling, then send the intake email.",
    nextLabel: "Next: Intake",
    briefing: {
      youAre: "Role: Advisor",
      why: "Consent is in place. Call the approved person, then send intake directions.",
      doThis: [
        "Open Outreach from your Step 1 notification.",
        "Call the approved Heir or Sibling using the script.",
        "End the call to send the intake email, then continue as the customer.",
      ],
    },
  },
  {
    id: "intake",
    n: 5,
    label: "Intake",
    role: "Heir",
    href: "/customer",
    title: "Customer intake",
    body: "Open the invite and answer the guided questions.",
    nextLabel: "Next: Plan",
    briefing: {
      youAre: "Role: Heir",
      why: "You are the customer on the phone.",
      doThis: [
        "Tap the notification, then the email.",
        "Last name is Pilot.",
        "Finish intake, then open the Plan.",
      ],
    },
  },
  {
    id: "plan",
    n: 6,
    label: "Plan",
    role: "Heir",
    href: "/customer/plan",
    title: "Diversification plan",
    body: "AI suggests a split. Advisor and customer still decide.",
    nextLabel: "Back to AI Analysis",
    briefing: {
      youAre: "Role: Heir",
      why: "AI suggests Emergency · Safe · Growth. Nothing moves without approval.",
      doThis: [
        "Watch the short analysis.",
        "Choose Save or Reinvest.",
        "Return to AI Analysis as Advisor — a notice opens the full report.",
      ],
    },
  },
  {
    id: "report",
    n: 7,
    label: "Report",
    role: "Advisor",
    href: "/report",
    title: "Full client report",
    body: "Post-intake view: calculated figures, suggested split, and the Heir’s preference.",
    nextLabel: "Back to AI Analysis",
    briefing: {
      youAre: "Role: Advisor",
      why: "Intake is complete. Review the full report before any next conversation.",
      doThis: [
        "Open Report from the Step 1 notice or the rail.",
        "Review figures, split, and Save vs Reinvest.",
        "Demo complete — return to AI Analysis anytime.",
      ],
    },
  },
];

/** Steps this seat may open without a role handoff */
export function stepsForRole(role: Role | undefined): DemoStep[] {
  if (!role) return DEMO_FLOW;
  return DEMO_FLOW.filter((step) => personMatchesStepRole(role, step.role));
}

/** Outreach unlocks after Principal allows a call with any invited heir/sibling. */
export function isOutreachUnlocked(households: Household[]): boolean {
  const pilot = households.find((item) => item.id === PILOT_HOUSEHOLD_ID);
  return Boolean(
    pilot?.heirs.some(
      (heir) =>
        heir.invited && heir.scopes.advisorIntro && !heir.declinedIntro,
    ),
  );
}

/** People on the pilot plan the Advisor may call now */
export function approvedOutreachHeirs(households: Household[]) {
  const pilot = households.find((item) => item.id === PILOT_HOUSEHOLD_ID);
  if (!pilot) return [];
  return pilot.heirs.filter(
    (heir) =>
      heir.invited && heir.scopes.advisorIntro && !heir.declinedIntro,
  );
}

/** Intake unlocks only after Advisor approves and sends the notification. */
export function isIntakeUnlocked(customers: Customer[]): boolean {
  const featured =
    customers.find((item) => item.featured) ??
    customers.find((item) => item.id === FEATURED_CUSTOMER_ID);
  if (!featured) return false;
  return (
    featured.status === "Notified" ||
    featured.status === "Engaged" ||
    featured.status === "Meeting booked"
  );
}

export function matchDemoStep(pathname: string): DemoStep {
  if (pathname.startsWith("/workbench")) return DEMO_FLOW[1];
  if (pathname.startsWith("/hub")) return DEMO_FLOW[2];
  if (pathname.startsWith("/rm")) return DEMO_FLOW[3];
  if (pathname.startsWith("/customer/plan")) return DEMO_FLOW[5];
  if (pathname.startsWith("/customer")) return DEMO_FLOW[4];
  if (pathname.startsWith("/report")) return DEMO_FLOW[6];
  return DEMO_FLOW[0];
}

/** Full report unlocks after the Heir finishes intake and picks Save/Reinvest. */
export function isReportUnlocked(input: {
  intakeCompleted: boolean;
  heirChoice: "save" | "reinvest" | null;
  hasPlan: boolean;
}) {
  return Boolean(
    input.intakeCompleted && input.heirChoice && input.hasPlan,
  );
}

export function nextDemoStep(pathname: string): DemoStep | null {
  const current = matchDemoStep(pathname);
  const index = DEMO_FLOW.findIndex((step) => step.id === current.id);
  if (index < 0 || index >= DEMO_FLOW.length - 1) return null;
  return DEMO_FLOW[index + 1];
}

export function isDemoStepActive(step: DemoStep, pathname: string): boolean {
  return matchDemoStep(pathname).id === step.id;
}

export function isDemoStepDone(step: DemoStep, pathname: string): boolean {
  return step.n < matchDemoStep(pathname).n;
}

export function demoStepById(id: DemoStepId): DemoStep {
  return DEMO_FLOW.find((step) => step.id === id) ?? DEMO_FLOW[0];
}

export function hubStep(): DemoStep {
  return DEMO_FLOW.find((step) => step.id === "hub")!;
}

export function outreachStep(): DemoStep {
  return DEMO_FLOW.find((step) => step.id === "outreach")!;
}

/** Map demo tab role → account role */
export function domainRoleForTab(role: TabRole): Role {
  if (role === "Advisor") return "advisor";
  if (role === "Principal") return "principal";
  return "heir";
}

/** Pilot seat emails for each demo role */
export const ROLE_SEAT_EMAIL: Record<TabRole, string> = {
  Advisor: "advisor@legacyai.com",
  Principal: "principal@legacyai.com",
  Heir: "heir@legacyai.com",
};

export function personMatchesStepRole(
  role: Role | undefined,
  tab: TabRole,
): boolean {
  if (!role) return false;
  return domainRoleForTab(tab) === role;
}

/** Local index (1-based) within the seat’s visible steps */
export function roleStepIndex(
  role: Role | undefined,
  stepId: DemoStepId,
): { n: number; total: number } {
  const mine = stepsForRole(role);
  const index = mine.findIndex((step) => step.id === stepId);
  return {
    n: index >= 0 ? index + 1 : 1,
    total: Math.max(1, mine.length),
  };
}

export function needsRoleHandoff(from: DemoStep, to: DemoStep): boolean {
  return from.role !== to.role;
}

export function roleSwitchHref(step: DemoStep, nextHref?: string): string {
  const next = encodeURIComponent(nextHref || step.href);
  return `/switch-role?step=${encodeURIComponent(step.id)}&next=${next}`;
}

/** @deprecated use roleSwitchHref */
export function roleSwitchPath(stepId: DemoStepId): string {
  return roleSwitchHref(demoStepById(stepId));
}
