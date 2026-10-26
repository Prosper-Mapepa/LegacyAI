import { daysUntil, formatLong } from "./clock";
import { LESSONS } from "./lessons";
import type {
  Heir,
  HeirAssessment,
  Household,
  HouseholdAssessment,
  Lane,
} from "./types";

const LANE_WEIGHT: Record<Lane, number> = {
  gap: 400,
  ready: 300,
  watch: 200,
  hold: 100,
};

const LIMITS = [
  "Lesson answers stay with the heir.",
  "Activity at other institutions is not inferred.",
  "Nothing here can block a transfer.",
];

function lead(heirs: HeirAssessment[], lane: Lane) {
  return heirs.find((heir) => heir.lane === lane) ?? heirs[0];
}

export function assessHeir(
  household: Household,
  heir: Heir,
  now: Date,
): HeirAssessment {
  const days = daysUntil(household.reviewOn, now);
  const principal = household.principal.firstName;
  const withheld = [...LIMITS];
  if (!heir.scopes.shareEngagement) {
    withheld.unshift(
      `Progress inside the hub stays hidden until ${heir.firstName} chooses to share it.`,
    );
  }

  const evidence = [
    {
      label: "Bank record",
      detail: heir.beneficiaryOnFile
        ? `Beneficiary on file since ${heir.beneficiarySince?.slice(0, 4)}.`
        : "Not listed as a beneficiary on the bank record.",
    },
    {
      label: "Planning calendar",
      detail: `${principal}'s review is ${formatLong(household.reviewOn)} (${days} days).`,
    },
    {
      label: "Invitation",
      detail: heir.invited
        ? `${principal} has opened an invitation.`
        : `${principal} has not sent an invitation.`,
    },
    {
      label: "Introduction consent",
      detail: heir.declinedIntro
        ? `${heir.firstName} declined a call.`
        : heir.scopes.advisorIntro
          ? `${principal} approved an introduction.`
          : `${principal} has not approved an introduction.`,
    },
  ];

  if (heir.scopes.shareEngagement) {
    const finished = heir.completedModuleIds.length;
    evidence.push({
      label: "Shared progress",
      detail:
        heir.openedCount === 0
          ? `${heir.firstName} agreed to share progress and has not opened the hub.`
          : `${heir.firstName} has opened the hub ${heir.openedCount} ${heir.openedCount === 1 ? "time" : "times"} and finished ${finished} of ${LESSONS.length} lessons.`,
    });
  }

  let lane: Lane;
  let title: string;
  let action: string;
  let contactHeir: boolean;

  if (heir.declinedIntro) {
    lane = "hold";
    title = "Do not contact";
    contactHeir = false;
    action = `Do not call ${heir.firstName}. The decline stands until they withdraw it. You may talk with ${principal} about other people in the family.`;
  } else if (!heir.beneficiaryOnFile) {
    lane = "watch";
    title = "Confirm the record";
    contactHeir = false;
    action = `Confirm with ${principal} before treating ${heir.firstName} as an heir. Do not call ${heir.firstName}.`;
  } else if (!heir.invited && days <= 180) {
    lane = "gap";
    title = "No relationship yet";
    contactHeir = false;
    action = `Ask ${principal} about inviting ${heir.firstName}. Do not contact ${heir.firstName} yet.`;
  } else if (!heir.invited) {
    lane = "watch";
    title = "Not invited";
    contactHeir = false;
    action = `Ask ${principal} when to invite ${heir.firstName}. Do not contact ${heir.firstName} yet.`;
  } else if (!heir.scopes.advisorIntro && days <= 120) {
    lane = "gap";
    title = "Introduction not approved";
    contactHeir = false;
    action = `Ask ${principal} whether ${heir.firstName} should meet you. Do not call ${heir.firstName} yet.`;
  } else if (!heir.scopes.advisorIntro) {
    lane = "watch";
    title = "Waiting on the principal";
    contactHeir = false;
    action = `Waiting on ${principal}'s approval. Do not call ${heir.firstName} yet.`;
  } else if (heir.scopes.shareEngagement && heir.openedCount === 0) {
    lane = "watch";
    title = "Approved, not opened";
    contactHeir = false;
    action = `${heir.firstName} is approved but has not opened the hub. Confirm with ${principal} before you call.`;
  } else if (!heir.scopes.shareEngagement) {
    lane = "ready";
    title = "Introduction approved";
    contactHeir = true;
    action = `You may call ${heir.firstName}. ${principal} approved it.`;
  } else {
    lane = "ready";
    title = "Ready for a warm introduction";
    contactHeir = true;
    action = `You may call ${heir.firstName} for a short introduction. ${principal} approved it.`;
  }

  return {
    heirId: heir.id,
    firstName: heir.firstName,
    lastName: heir.lastName,
    relationship: heir.relationship,
    lane,
    title,
    action,
    contactHeir,
    evidence,
    withheld,
    engagement: {
      visible: heir.scopes.shareEngagement,
      openedCount: heir.scopes.shareEngagement ? heir.openedCount : null,
      modulesCompleted: heir.scopes.shareEngagement
        ? heir.completedModuleIds.length
        : null,
    },
  };
}

export function householdLane(heirs: HeirAssessment[]): Lane {
  if (heirs.some((heir) => heir.lane === "gap")) return "gap";
  if (heirs.some((heir) => heir.lane === "ready")) return "ready";
  if (heirs.some((heir) => heir.lane === "watch")) return "watch";
  return "hold";
}

/** One short household line — no repeated “call / do not call” phrases. */
function writeHouseholdSummary(
  principal: string,
  lane: Lane,
  heirs: HeirAssessment[],
): string {
  const names = (list: HeirAssessment[]) =>
    list.map((heir) => heir.firstName).join(" and ");
  const gaps = heirs.filter((heir) => heir.lane === "gap");
  const ready = heirs.filter((heir) => heir.lane === "ready");
  const holds = heirs.filter((heir) => heir.lane === "hold");
  const watches = heirs.filter((heir) => heir.lane === "watch");

  if (lane === "gap" && gaps.length) {
    const invite = gaps.filter((heir) => heir.title === "No relationship yet");
    const intro = gaps.filter((heir) => heir.title === "Introduction not approved");
    const parts: string[] = [`Talk to ${principal} first.`];
    if (invite.length) parts.push(`Ask about inviting ${names(invite)}.`);
    if (intro.length) parts.push(`Ask whether ${names(intro)} should meet you.`);
    parts.push(`Do not contact ${names(gaps)} yet.`);
    return parts.join(" ");
  }

  if (lane === "ready" && ready.length) {
    return `You may call ${names(ready)}. ${principal} already approved.`;
  }

  if (lane === "hold" && holds.length) {
    return `Do not call ${names(holds)}. A decline stands.`;
  }

  if (watches.length) {
    return `Waiting on ${principal} for ${names(watches)}. No call yet.`;
  }

  return heirs[0]?.action ?? "No next step on this family.";
}

export function assessHousehold(
  household: Household,
  now: Date,
): HouseholdAssessment {
  const heirs = household.heirs.map((heir) => assessHeir(household, heir, now));
  const lane = householdLane(heirs);
  const daysToReview = daysUntil(household.reviewOn, now);
  const primary = lead(heirs, lane);
  const principal = household.principal.firstName;
  const summary = writeHouseholdSummary(principal, lane, heirs);

  return {
    householdId: household.id,
    familyName: household.familyName,
    daysToReview,
    lane,
    summary,
    heirs,
    rank: LANE_WEIGHT[lane] + Math.max(0, 180 - daysToReview),
  };
}

export function rankBook(households: Household[], now: Date) {
  return households
    .map((household) => assessHousehold(household, now))
    .sort((a, b) => b.rank - a.rank || a.familyName.localeCompare(b.familyName));
}

export function fingerprint(assessment: HouseholdAssessment) {
  return assessment.heirs
    .map(
      (heir) =>
        `${heir.heirId}:${heir.lane}:${heir.contactHeir}:${heir.engagement.visible}:${heir.engagement.openedCount}:${heir.engagement.modulesCompleted}`,
    )
    .join("|");
}
