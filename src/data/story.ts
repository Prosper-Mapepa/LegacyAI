/**
 * One pilot story for the whole demo. Roles — not personal names — are what you see.
 * Internal ids stay stable for routes and tests.
 */

export const PILOT_HOUSEHOLD_ID = "whitmore";
export const FEATURED_HEIR_ID = "david";
export const FEATURED_CUSTOMER_ID = "cust-heir";
export const SIBLING_CUSTOMER_ID = "cust-sibling";
export const FAMILY_LAST_NAME = "Pilot";

/** Continuity heir id → deposit customer on the outreach book */
export const HEIR_TO_CUSTOMER_ID: Record<string, string> = {
  david: FEATURED_CUSTOMER_ID,
  elena: SIBLING_CUSTOMER_ID,
};

export const STORY = {
  headline: "One family. Four roles. One path.",
  scenario: [
    "A review is coming for a large relationship at the bank.",
    "The Advisor ranks the book and prepares a brief.",
    "The Principal invites Heir and allows a call in the Hub — only then does Outreach begin.",
    "The same Heir holds $100K+ on deposit: intake and the plan come after that consent.",
  ].join(" "),
  roles: [
    {
      role: "Advisor",
      seat: "You work the book",
      does: "Signal and Book first. After Principal allows a call, run Outreach. You never place a call alone.",
    },
    {
      role: "Principal",
      seat: "You own the relationship",
      does: "In the Hub, invite heirs and allow a call. That unlocks Outreach.",
    },
    {
      role: "Heir",
      seat: "You are next generation — and the $100K+ customer",
      does: "After Outreach, complete intake and see a plan. Lesson answers stay private.",
    },
    {
      role: "Sibling",
      seat: "Another heir already in the hub",
      does: "Shows consent for someone already invited.",
    },
  ],
} as const;

export type StoryRole = (typeof STORY.roles)[number]["role"];

/** Advisor seat used across continuity. */
export const ADVISOR = {
  id: "advisor",
  name: "Advisor",
  office: "Pittsburgh",
} as const;
