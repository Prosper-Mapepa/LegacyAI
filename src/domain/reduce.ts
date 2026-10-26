import { todayKey } from "./clock";
import { LESSONS } from "./lessons";
import { seedHouseholds } from "./seed";
import type { Action, BriefState, DemoState, Heir, Household } from "./types";

export function initialState(now = new Date()): DemoState {
  const today = todayKey(now);
  return {
    households: structuredClone(seedHouseholds).map((household) => ({
      ...household,
      heirs: household.heirs.map((heir) => ({
        ...heir,
        lastOpenedOn: heir.openedCount > 0 ? today : null,
      })),
    })),
    briefs: {},
    advisorNotices: [],
  };
}

function fullName(person: { firstName: string; lastName: string }) {
  return `${person.firstName} ${person.lastName}`;
}

function withHousehold(
  state: DemoState,
  householdId: string,
  change: (household: Household) => boolean,
  touchBrief = false,
): DemoState {
  let changed = false;
  const households = state.households.map((household) => {
    if (household.id !== householdId) return household;
    const next = structuredClone(household);
    changed = change(next);
    return changed ? next : household;
  });
  if (!changed) return state;

  const briefs = { ...state.briefs };
  if (touchBrief) {
    const current = briefs[householdId];
    if (current?.status === "approved") {
      briefs[householdId] = { ...current, status: "draft", stale: true };
      const household = households.find((item) => item.id === householdId);
      if (household) {
        household.audit.push({
          id: crypto.randomUUID(),
          at: new Date().toISOString(),
          actor: "LegacyAI",
          action:
            "The family record changed after approval. The brief is back in draft. Nothing was sent.",
        });
      }
    }
  }

  return { ...state, households, briefs };
}

function updateHeir(
  state: DemoState,
  householdId: string,
  heirId: string,
  change: (household: Household, heir: Heir) => boolean,
  touchBrief = true,
) {
  return withHousehold(
    state,
    householdId,
    (household) => {
      const heir = household.heirs.find((item) => item.id === heirId);
      if (!heir) return false;
      return change(household, heir);
    },
    touchBrief,
  );
}

function pushAudit(household: Household, actor: string, action: string) {
  household.audit.push({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    actor,
    action,
  });
}

export function reduce(state: DemoState, action: Action, now = new Date()): DemoState {
  switch (action.type) {
    case "reset":
      return initialState(now);
    case "invite":
      return updateHeir(state, action.householdId, action.heirId, (household, heir) => {
        if (heir.invited || heir.declinedIntro) return false;
        heir.invited = true;
        pushAudit(
          household,
          fullName(household.principal),
          `Invited ${fullName(heir)} into the family hub.`,
        );
        return true;
      });
    case "setPortion":
      return updateHeir(
        state,
        action.householdId,
        action.heirId,
        (household, heir) => {
          if (heir.portionNote === action.note && heir.scopes.portionNote === action.shared) {
            return false;
          }
          heir.portionNote = action.note;
          heir.scopes.portionNote = action.shared;
          pushAudit(
            household,
            fullName(household.principal),
            action.shared
              ? `Shared a note with ${heir.firstName}.`
              : `Kept the note with ${heir.firstName} private.`,
          );
          return true;
        },
        false,
      );
    case "setIntro": {
      const next = updateHeir(state, action.householdId, action.heirId, (household, heir) => {
        if (heir.declinedIntro || !heir.invited) return false;
        if (heir.scopes.advisorIntro === action.allowed) return false;
        heir.scopes.advisorIntro = action.allowed;
        pushAudit(
          household,
          fullName(household.principal),
          action.allowed
            ? `Approved an introduction between ${heir.firstName} and ${household.advisor.name}.`
            : `Withdrew the introduction approval for ${heir.firstName}.`,
        );
        return true;
      });
      if (next === state || !action.allowed) return next;
      const household = next.households.find((h) => h.id === action.householdId);
      const heir = household?.heirs.find((h) => h.id === action.heirId);
      if (!household || !heir) return next;
      return {
        ...next,
        advisorNotices: [
          {
            id: crypto.randomUUID(),
            at: new Date().toISOString(),
            title: "Call allowed",
            body: `${fullName(household.principal)} allowed a call with ${heir.firstName}. Open Outreach to call them, then send the intake email.`,
            href: "/rm",
            read: false,
            kind: "call_allowed" as const,
          },
          ...(next.advisorNotices ?? []),
        ],
      };
    }
    case "dismissAdvisorNotice":
      return {
        ...state,
        advisorNotices: (state.advisorNotices ?? []).filter((n) => n.id !== action.id),
      };
    case "markAdvisorNoticesRead":
      return {
        ...state,
        advisorNotices: (state.advisorNotices ?? []).map((n) =>
          n.read ? n : { ...n, read: true },
        ),
      };
    case "intakeComplete": {
      const already = (state.advisorNotices ?? []).some(
        (n) =>
          n.kind === "intake_complete" &&
          n.body.includes(action.clientName),
      );
      if (already) return state;
      return {
        ...state,
        advisorNotices: [
          {
            id: crypto.randomUUID(),
            at: new Date().toISOString(),
            title: "Intake complete",
            body: `${action.clientName} finished intake and chose a plan preference. Open Step 4 to view the full report.`,
            href: "/report",
            read: false,
            kind: "intake_complete" as const,
          },
          ...(state.advisorNotices ?? []),
        ],
      };
    }
    case "setEngagementShare":
      return updateHeir(state, action.householdId, action.heirId, (household, heir) => {
        if (!heir.invited || heir.scopes.shareEngagement === action.shared) return false;
        heir.scopes.shareEngagement = action.shared;
        pushAudit(
          household,
          fullName(heir),
          action.shared
            ? `Agreed to share progress with ${household.advisor.name}.`
            : `Stopped sharing progress with ${household.advisor.name}.`,
        );
        return true;
      });
    case "setGoal":
      return updateHeir(
        state,
        action.householdId,
        action.heirId,
        (household, heir) => {
          if (!heir.invited || heir.goal === action.goal) return false;
          heir.goal = action.goal;
          pushAudit(
            household,
            fullName(heir),
            "Set what they want from this space. The answer stays off the advisor brief.",
          );
          return true;
        },
        false,
      );
    case "completeModule":
      return updateHeir(state, action.householdId, action.heirId, (household, heir) => {
        if (!heir.invited || heir.completedModuleIds.includes(action.moduleId)) return false;
        const lesson = LESSONS.find((item) => item.id === action.moduleId);
        if (!lesson) return false;
        heir.completedModuleIds.push(action.moduleId);
        pushAudit(household, fullName(heir), `Finished the lesson “${lesson.title}.”`);
        return true;
      });
    case "recordOpen":
      return updateHeir(state, action.householdId, action.heirId, (household, heir) => {
        if (!heir.invited) return false;
        const today = todayKey(now);
        if (heir.lastOpenedOn === today) return false;
        const first = heir.openedCount === 0;
        heir.openedCount += 1;
        heir.lastOpenedOn = today;
        if (first) {
          pushAudit(household, fullName(heir), "Opened the family hub for the first time.");
        }
        return true;
      });
    case "declineIntro":
      return updateHeir(state, action.householdId, action.heirId, (household, heir) => {
        if (!heir.invited || heir.declinedIntro) return false;
        heir.declinedIntro = true;
        heir.scopes.advisorIntro = false;
        pushAudit(
          household,
          fullName(heir),
          `Declined an introduction. ${household.advisor.name} is not to call them.`,
        );
        return true;
      });
    case "withdrawDecline":
      return updateHeir(state, action.householdId, action.heirId, (household, heir) => {
        if (!heir.declinedIntro) return false;
        heir.declinedIntro = false;
        pushAudit(
          household,
          fullName(heir),
          "Withdrew the decline. An introduction still needs the principal's approval.",
        );
        return true;
      });
    case "editBrief":
      return {
        ...state,
        briefs: {
          ...state.briefs,
          [action.householdId]: {
            status: state.briefs[action.householdId]?.status === "approved" ? "approved" : "draft",
            text: action.text,
            fingerprint: action.fingerprint,
            stale: state.briefs[action.householdId]?.stale ?? false,
            dismissReason: null,
          } satisfies BriefState,
        },
      };
    case "approveBrief": {
      const households = state.households.map((household) => {
        if (household.id !== action.householdId) return household;
        const next = structuredClone(household);
        pushAudit(
          next,
          next.advisor.name,
          "Approved the meeting brief. No message was sent to the family.",
        );
        return next;
      });
      return {
        ...state,
        households,
        briefs: {
          ...state.briefs,
          [action.householdId]: {
            status: "approved",
            text: action.text,
            fingerprint: action.fingerprint,
            stale: false,
            dismissReason: null,
          },
        },
      };
    }
    case "useUpdatedBrief": {
      const current = state.briefs[action.householdId];
      if (!current) return state;
      return {
        ...state,
        briefs: {
          ...state.briefs,
          [action.householdId]: { ...current, text: null, stale: false, status: "draft" },
        },
      };
    }
    case "reopenBrief": {
      const current = state.briefs[action.householdId];
      if (!current) return state;
      return {
        ...state,
        briefs: {
          ...state.briefs,
          [action.householdId]: { ...current, status: "draft" },
        },
      };
    }
    case "dismissBrief": {
      const households = state.households.map((household) => {
        if (household.id !== action.householdId) return household;
        const next = structuredClone(household);
        pushAudit(next, next.advisor.name, `Set the brief aside: ${action.reason}.`);
        return next;
      });
      const current = state.briefs[action.householdId];
      return {
        ...state,
        households,
        briefs: {
          ...state.briefs,
          [action.householdId]: {
            status: "dismissed",
            text: current?.text ?? null,
            fingerprint: current?.fingerprint ?? null,
            stale: false,
            dismissReason: action.reason,
          },
        },
      };
    }
    default:
      return state;
  }
}
