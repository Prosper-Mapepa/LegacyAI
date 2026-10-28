import { formatLong } from "./clock";
import { LESSONS, lessonsFor } from "./lessons";
import { assessHousehold, rankBook } from "./signal";
import type { Role } from "./people";
import type { Heir, Household, Lane } from "./types";

const LANE_NAME: Record<Lane, string> = {
  gap: "Needs you",
  ready: "Ready",
  watch: "Waiting",
  hold: "Do not call",
};

export function prompts(role: Role) {
  if (role === "advisor") {
    return ["Who needs me today?", "May I call Heir Whitfield?", "What stays hidden?"];
  }
  if (role === "principal") {
    return ["Who can the Advisor call?", "Who is not invited?", "Can a decline be undone?"];
  }
  return ["What can I see?", "Will the Advisor call me?", "Where are my lessons?"];
}

function norm(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function callLine(heir: Heir, principal: string, advisor: string) {
  if (heir.declinedIntro) {
    return `${advisor} may not call ${heir.firstName}. ${heir.firstName} declined, and a decline cannot be undone.`;
  }
  if (!heir.invited) {
    return `${principal} has not invited ${heir.firstName}, so ${advisor} may not call.`;
  }
  if (heir.scopes.advisorIntro) {
    return `${principal} allowed ${advisor} to call ${heir.firstName}.`;
  }
  return `${heir.firstName} is invited. ${advisor} may not call until ${principal} allows it.`;
}

function findHousehold(question: string, households: Household[]) {
  return (
    households.find((household) => question.includes(household.familyName.toLowerCase())) ??
    households.find((household) =>
      question.includes(household.principal.firstName.toLowerCase()),
    ) ??
    null
  );
}

function findHeir(question: string, households: Household[]) {
  for (const household of households) {
    for (const item of household.heirs) {
      const full = `${item.firstName} ${item.lastName}`.toLowerCase();
      const withFamily = `${item.firstName} ${household.familyName}`.toLowerCase();
      if (question.includes(full) || question.includes(withFamily)) {
        return { household, heir: item };
      }
    }
  }
  for (const household of households) {
    const heir = household.heirs.find((item) => question.includes(item.firstName.toLowerCase()));
    if (heir) return { household, heir };
  }
  return null;
}

export function answer(
  question: string,
  role: Role,
  households: Household[],
  now: Date,
  householdId?: string,
  heirId?: string,
) {
  const q = norm(question);
  const mine = households.find((household) => household.id === householdId) ?? null;
  const self = mine?.heirs.find((heir) => heir.id === heirId) ?? null;
  const advisor = (mine ?? households[0])?.advisor.name.split(" ")[0] ?? "The advisor";

  if (/(other bank|other institution|schwab|fidelity|vanguard|another firm|elsewhere)/.test(q)) {
    return "Activity at other institutions is not inferred. This book uses the bank record, the planning calendar, and choices the family has made.";
  }

  if (/(block|stop|prevent|hold the)/.test(q) && /(transfer|money|asset|wire)/.test(q)) {
    return "Nothing here can block a transfer. The signal only says who needs a conversation before the money moves.";
  }

  if (/(lesson answer|quiz|test score|what did they read|what did she read|what did he read)/.test(q)) {
    return role === "heir"
      ? "Your lessons stay on your page. The advisor never sees what you read."
      : "Lesson answers stay with the heir. A count appears only when that person chooses to share progress.";
  }

  if (/(portion note|private note|what did .* write|the note)/.test(q)) {
    if (role === "heir") {
      if (!self?.invited) return "Nothing is shared with you yet.";
      return self.scopes.portionNote
        ? `${mine?.principal.firstName}'s note is on your page.`
        : "No note has been shared with you.";
    }
    if (role === "principal") return "Your notes stay in the family hub. The advisor does not see the words.";
    return "The note stays with the family. You do not see the words.";
  }

  if (role === "advisor") return advisorAnswer(q, households, now);
  if (role === "principal") return principalAnswer(q, mine, advisor);
  return heirAnswer(q, mine, self, advisor);
}

function advisorAnswer(q: string, households: Household[], now: Date) {
  const ranked = rankBook(households, now);
  const namedHeir = findHeir(q, households);
  const namedHouse = namedHeir?.household ?? findHousehold(q, households);

  if (/(total|add up|sum|market|billion)/.test(q)) {
    return "Each relationship is already on the bank record. This pilot does not add them into a market number.";
  }

  if (namedHeir && /(call|contact|phone|meet|intro)/.test(q)) {
    const { household, heir } = namedHeir;
    const view = assessHousehold(household, now).heirs.find((item) => item.heirId === heir.id);
    const line = callLine(heir, household.principal.firstName, household.advisor.name.split(" ")[0]);
    const progress = !view?.engagement.visible
      ? " Progress inside the hub is hidden."
      : ` Shared progress: ${view.engagement.openedCount} visits, ${view.engagement.modulesCompleted} of ${LESSONS.length} lessons.`;
    return `${line}${progress}`;
  }

  if (namedHouse) {
    const view = assessHousehold(namedHouse, now);
    const calls = view.heirs
      .map((heir) => `${heir.firstName}: ${heir.contactHeir ? "may call" : "do not call"}`)
      .join(". ");
    const value = /(value|million|how much|aum|relationship)/.test(q)
      ? ` On the record: ${namedHouse.relationshipValue}.`
      : "";
    return `${namedHouse.familyName} is ${LANE_NAME[view.lane]}. Review ${formatLong(namedHouse.reviewOn)}, ${view.daysToReview} days.${value} ${view.summary} ${calls}.`;
  }

  if (/(who needs|today|first|queue|gap|report|statistic|how many)/.test(q)) {
    const counts = { gap: 0, ready: 0, watch: 0, hold: 0 };
    for (const item of ranked) counts[item.lane] += 1;
    const first = ranked[0];
    return `${ranked.length} families. ${counts.gap} need you, ${counts.ready} are ready, ${counts.watch} are waiting, ${counts.hold} are do-not-call. ${first.familyName} is first. ${first.summary}`;
  }

  if (/(hidden|private|cannot see|can't see|consent)/.test(q)) {
    return "Lesson answers stay with the heir. Progress stays hidden until they share it. Activity at other institutions is not inferred. Nothing here can block a transfer.";
  }

  return "I answer from this book only. Ask who needs you, whether you may call someone, or what stays hidden.";
}

function principalAnswer(q: string, mine: Household | null, advisor: string) {
  if (!mine) return "That household is not on your desk.";
  const outside = q.match(/\b(okonkwo|alvarez|chen|ready family|watch family|hold family)\b/);
  if (
    outside &&
    !mine.familyName.toLowerCase().includes(outside[1].replace(" family", "")) &&
    !mine.familyName.toLowerCase().includes(outside[1])
  ) {
    return "That family is not on your desk. You only see the people on your own plan.";
  }

  if (/(decline|undo|override|change .* mind)/.test(q)) {
    const declined = mine.heirs.filter((heir) => heir.declinedIntro);
    if (!declined.length) return `No one has declined. If they do, ${advisor} cannot override it, and neither can you.`;
    return declined
      .map((heir) => `${heir.firstName} declined. ${advisor} cannot call, and you cannot undo that.`)
      .join(" ");
  }

  if (/(not invited|invite|who is waiting)/.test(q)) {
    const waiting = mine.heirs.filter((heir) => !heir.invited && !heir.declinedIntro);
    if (!waiting.length) return "Everyone you can invite is already in the hub.";
    return `Still to invite: ${waiting.map((heir) => heir.firstName).join(" and ")}. ${advisor} cannot call them until you invite them and allow the call.`;
  }

  const named = mine.heirs.find((heir) => q.includes(heir.firstName.toLowerCase()));
  if (named) return callLine(named, mine.principal.firstName, advisor);

  return mine.heirs
    .map((heir) => callLine(heir, mine.principal.firstName, advisor))
    .join(" ");
}

function heirAnswer(q: string, mine: Household | null, self: Heir | null, advisor: string) {
  if (!mine || !self) return "This page is only yours.";
  const sibling = mine.heirs.find(
    (heir) => heir.id !== self.id && q.includes(heir.firstName.toLowerCase()),
  );
  if (sibling) return `${sibling.firstName}'s page is not yours. You only see what is shared with you.`;
  if (/(million|aum|relationship value|how much|worth)/.test(q)) {
    return "The relationship value is not on your page.";
  }
  if (!self.invited) {
    return `Nothing is shared with you yet. When ${mine.principal.firstName} invites you, you will see a note only if it is shared, plus your own lessons. ${advisor} will not call unless ${mine.principal.firstName} allows it.`;
  }
  if (/(lesson|learn|read)/.test(q)) {
    const lessons = lessonsFor(self.goal);
    const read = self.completedModuleIds.length;
    return `${read} of ${lessons.length} lessons read. Next up: ${lessons.find((lesson) => !self.completedModuleIds.includes(lesson.id))?.title ?? "you have read them all"}. ${advisor} never sees what you read.`;
  }
  if (/(call|contact|phone|meet)/.test(q)) {
    return callLine(self, mine.principal.firstName, advisor);
  }
  if (/(see|visit|share|private)/.test(q)) {
    const visits = self.scopes.shareEngagement
      ? `${advisor} can see that you visit.`
      : "Your visits are private.";
    const note = self.scopes.portionNote
      ? `${mine.principal.firstName}'s note is shared with you.`
      : "No note is shared.";
    return `${note} ${visits} You never see the relationship value or anyone else's page.`;
  }
  return `This page is only yours. ${callLine(self, mine.principal.firstName, advisor)}`;
}
