export type PersonId = "priya" | "margaret" | "david" | "elena";

export type Role = "advisor" | "principal" | "heir";

export type Person = {
  id: string;
  role: Role;
  name: string;
  roleLabel: string;
  detail: string;
  sees: string;
  hidden: string;
  householdId: string;
  heirId?: string;
};

export const PEOPLE: Person[] = [
  {
    id: "priya",
    role: "advisor",
    name: "Advisor",
    roleLabel: "Advisor",
    detail: "Pittsburgh. You already know these families.",
    sees: "The book, one next step, and a brief you approve yourself.",
    hidden: "Lesson answers, and any progress an heir has not shared.",
    householdId: "whitmore",
  },
  {
    id: "margaret",
    role: "principal",
    name: "Principal",
    roleLabel: "Principal",
    detail: "The relationship is yours. The review is 14 January 2027.",
    sees: "The people on your plan, your notes, and whether a call is allowed.",
    hidden: "Lesson answers. You cannot undo a decline.",
    householdId: "whitmore",
  },
  {
    id: "david",
    role: "heir",
    name: "Heir",
    roleLabel: "Heir",
    detail: "Adult child on the bank record — and the $100K+ customer in outreach.",
    sees: "Only what the Principal shares, plus your own lessons and choices.",
    hidden: "The relationship value, Sibling’s page, and the advisor brief.",
    householdId: "whitmore",
    heirId: "david",
  },
  {
    id: "elena",
    role: "heir",
    name: "Sibling",
    roleLabel: "Sibling",
    detail: "Already invited. Shows consent choices in the hub.",
    sees: "Your note if it is shared, lessons matched to your goal, and your choices.",
    hidden: "The relationship value and Heir’s private choices.",
    householdId: "whitmore",
    heirId: "elena",
  },
];

export function personById(id: string | null | undefined) {
  return PEOPLE.find((person) => person.id === id) ?? null;
}

/**
 * App areas for access control.
 * - signal / book / outreach → Advisor only
 * - hub → Principal only (own household)
 * - heir → Heir only (own space) — or Principal viewing their hub heirs
 * - customer → Heir only (intake / plan)
 */
export type GateArea =
  | "signal"
  | "book"
  | "outreach"
  | "report"
  | "hub"
  | "heir"
  | "customer";

export function allowed(
  person: Person,
  area: GateArea,
  householdId?: string,
  heirId?: string,
) {
  if (person.role === "advisor") {
    return (
      area === "signal" ||
      area === "book" ||
      area === "outreach" ||
      area === "report"
    );
  }

  if (person.role === "principal") {
    if (person.householdId !== householdId) return false;
    // Principal owns the family hub and can open heir preview cards there
    return area === "hub" || area === "heir";
  }

  // Heir / Sibling
  if (area === "customer") return true;
  if (area === "heir") {
    return (
      person.householdId === householdId &&
      Boolean(heirId) &&
      person.heirId === heirId
    );
  }
  return false;
}
