export type Goal = "understand" | "meet" | "undecided";

export type Lane = "gap" | "ready" | "watch" | "hold";

export type Heir = {
  id: string;
  firstName: string;
  lastName: string;
  relationship: string;
  age: number;
  beneficiaryOnFile: boolean;
  beneficiarySince: string | null;
  invited: boolean;
  openedCount: number;
  lastOpenedOn: string | null;
  completedModuleIds: string[];
  goal: Goal | null;
  scopes: {
    portionNote: boolean;
    advisorIntro: boolean;
    shareEngagement: boolean;
  };
  portionNote: string;
  declinedIntro: boolean;
};

export type Household = {
  id: string;
  familyName: string;
  relationshipValue: string;
  reviewOn: string;
  principal: {
    id: string;
    firstName: string;
    lastName: string;
    age: number;
  };
  advisor: {
    id: string;
    name: string;
    office: string;
  };
  heirs: Heir[];
  audit: AuditEvent[];
};

export type AuditEvent = {
  id: string;
  at: string;
  actor: string;
  action: string;
};

export type Evidence = {
  label: string;
  detail: string;
};

export type HeirAssessment = {
  heirId: string;
  firstName: string;
  lastName: string;
  relationship: string;
  lane: Lane;
  title: string;
  action: string;
  contactHeir: boolean;
  evidence: Evidence[];
  withheld: string[];
  engagement: {
    visible: boolean;
    openedCount: number | null;
    modulesCompleted: number | null;
  };
};

export type HouseholdAssessment = {
  householdId: string;
  familyName: string;
  daysToReview: number;
  lane: Lane;
  summary: string;
  heirs: HeirAssessment[];
  rank: number;
};

export type BriefState = {
  status: "draft" | "approved" | "dismissed";
  text: string | null;
  fingerprint: string | null;
  stale: boolean;
  dismissReason: string | null;
};

export type AdvisorNotice = {
  id: string;
  at: string;
  title: string;
  body: string;
  href: string;
  read: boolean;
  kind: "call_allowed" | "intake_complete";
};

export type DemoState = {
  households: Household[];
  briefs: Record<string, BriefState>;
  advisorNotices: AdvisorNotice[];
};

export type Action =
  | { type: "invite"; householdId: string; heirId: string }
  | {
      type: "setPortion";
      householdId: string;
      heirId: string;
      note: string;
      shared: boolean;
    }
  | { type: "setIntro"; householdId: string; heirId: string; allowed: boolean }
  | {
      type: "setEngagementShare";
      householdId: string;
      heirId: string;
      shared: boolean;
    }
  | { type: "setGoal"; householdId: string; heirId: string; goal: Goal }
  | {
      type: "completeModule";
      householdId: string;
      heirId: string;
      moduleId: string;
    }
  | { type: "recordOpen"; householdId: string; heirId: string }
  | { type: "declineIntro"; householdId: string; heirId: string }
  | { type: "withdrawDecline"; householdId: string; heirId: string }
  | {
      type: "editBrief";
      householdId: string;
      text: string;
      fingerprint: string;
    }
  | {
      type: "approveBrief";
      householdId: string;
      text: string;
      fingerprint: string;
    }
  | { type: "useUpdatedBrief"; householdId: string }
  | { type: "reopenBrief"; householdId: string }
  | { type: "dismissBrief"; householdId: string; reason: string }
  | { type: "dismissAdvisorNotice"; id: string }
  | { type: "markAdvisorNoticesRead" }
  | {
      type: "intakeComplete";
      clientName: string;
      /** Optional customer id for the report deep-link */
      customerId?: string;
    }
  | { type: "reset" };
