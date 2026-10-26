import { formatLong } from "./clock";
import type { Heir, Household, HouseholdAssessment } from "./types";

/** Short meeting brief — one line per person, no repeated “do not call”. */
export function writeBrief(
  household: Household,
  assessment: HouseholdAssessment,
) {
  const days = Math.max(0, assessment.daysToReview);
  const lines = [
    `${household.familyName} · review ${formatLong(household.reviewOn)} (${days} days)`,
    `Relationship ${household.relationshipValue} (already on the bank record).`,
    "",
    `For ${household.advisor.name}. Your judgment only — LegacyAI will not contact anyone or move money.`,
    "",
    "People",
  ];

  for (const heir of assessment.heirs) {
    const call = heir.contactHeir ? "May call" : "Do not call";
    lines.push(`· ${heir.firstName} — ${heir.title}. ${call}.`);
  }

  lines.push("");
  lines.push(assessment.summary);
  lines.push("");
  lines.push("Limits: no other-bank inference · transfers never blocked · no lesson answers here.");

  return lines.join("\n");
}

export type TalkBeat = {
  step: number;
  label: string;
  say: string;
};

function joinNames(names: string[]) {
  if (names.length === 0) return "the next generation";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
}

/**
 * Advisor ↔ Principal call script.
 * No dollar figures on the phone. Speak as “we” (the Advisor team).
 */
export function principalTalkBeats(
  household: Household,
  assessment: HouseholdAssessment,
): TalkBeat[] {
  const principal = household.principal.firstName;
  const days = Math.max(0, assessment.daysToReview);
  const heirList = joinNames(assessment.heirs.map((h) => h.firstName));

  const askLines: string[] = [];
  for (const heir of assessment.heirs) {
    if (heir.contactHeir) {
      askLines.push(
        `For ${heir.firstName}: confirm you still want us to introduce ourselves — we only call if you allow it in the hub.`,
      );
    } else if (/declined/i.test(heir.title)) {
      askLines.push(
        `For ${heir.firstName}: we honor the decline. We won’t reach out. Ask only if anything has changed.`,
      );
    } else {
      askLines.push(
        `For ${heir.firstName}: would you like to invite them into the family hub before anyone from the bank calls?`,
      );
    }
  }

  return [
    {
      step: 1,
      label: "Open warm",
      say: `“${principal}, it’s ${household.advisor.name} with your LegacyAI team. We’re preparing for your ${formatLong(household.reviewOn)} review, about ${days} days out. Do you have a few minutes?”`,
    },
    {
      step: 2,
      label: "What LegacyAI is",
      say: `“We’ve opened LegacyAI for families like yours. It’s our private continuity workspace on your bank record — a family hub where you invite the next generation, share only what you choose, and decide who we may call. LegacyAI never moves money, never blocks a transfer, and never contacts ${heirList} unless you allow it.”`,
    },
    {
      step: 3,
      label: "Why this matters now",
      say: `“Your review is coming up, and we want the people on your plan ready in a calm way. We’d rather you hear that from us first — not from a cold outreach.”`,
    },
    {
      step: 4,
      label: "Ask for direction",
      say: askLines.map((line) => `• ${line}`).join("\n"),
    },
    {
      step: 5,
      label: "Close with control",
      say: `“When you’re ready, open the LegacyAI hub, invite who you want, and tap Allow call. Until then we wait. You’re in control — we only follow the choices you make.”`,
    },
  ];
}

/** Plain-text Principal script for the desk card. */
export function principalTalkNote(
  household: Household,
  assessment: HouseholdAssessment,
) {
  const beats = principalTalkBeats(household, assessment);
  return [
    `Call with ${household.principal.firstName} · ${household.familyName}`,
    "",
    ...beats.flatMap((beat) => [
      `${beat.step}. ${beat.label}`,
      beat.say,
      "",
    ]),
    "Guardrails: no figures on the phone · no other-bank talk · transfers never blocked · no lesson answers · no heir calls without hub approval.",
  ].join("\n");
}

/**
 * Advisor ↔ Heir or Sibling call after Principal allowed outreach.
 * Ends by promising an intake email — no figures.
 */
export function outreachTalkBeats(
  household: Household,
  heir: Heir,
): TalkBeat[] {
  const name = heir.firstName;
  const principal = household.principal.firstName;
  const roleWord =
    heir.relationship.toLowerCase().includes("sibling") ||
    name.toLowerCase() === "sibling"
      ? "Sibling"
      : "Heir";

  return [
    {
      step: 1,
      label: "Open warm",
      say: `“${name}, it’s ${household.advisor.name} with your LegacyAI team. ${principal} allowed this conversation, so we wanted to reach you personally. Is now an okay time?”`,
    },
    {
      step: 2,
      label: "What LegacyAI is",
      say: `“We’ve set up LegacyAI for your family. It’s a private space on your bank record for continuity — ${principal} invites people, chooses what to share, and decides who we may call. Nothing here moves money or blocks a transfer. Your lesson answers stay private.”`,
    },
    {
      step: 3,
      label: "What you need to know",
      say: `“You’re the ${roleWord} on the plan. ${principal} wants you ready before the next review. We’re not asking you to decide anything today — just to start a short, guided intake so we understand your goals in your own words.”`,
    },
    {
      step: 4,
      label: "Intake email",
      say: `“We’ll send you an email with directions for intake on your phone. Open the notification, then the email, and follow the steps. You’ll confirm your last name to begin — it’s the same family name on the bank record.”`,
    },
    {
      step: 5,
      label: "Close",
      say: `“Watch for that email from us. If anything feels unclear, reply or call us back. Thank you, ${name} — we’re here with ${principal}, not instead of them.”`,
    },
  ];
}

export function outreachTalkNote(household: Household, heir: Heir) {
  const beats = outreachTalkBeats(household, heir);
  return [
    `Call with ${heir.firstName} · ${household.familyName}`,
    "",
    ...beats.flatMap((beat) => [
      `${beat.step}. ${beat.label}`,
      beat.say,
      "",
    ]),
    "Guardrails: no figures on the phone · Principal already allowed this call · end by sending the intake email.",
  ].join("\n");
}
