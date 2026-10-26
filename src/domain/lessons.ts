import type { Goal } from "./types";

export type Lesson = {
  id: string;
  title: string;
  body: string;
};

export const LESSONS: Lesson[] = [
  {
    id: "beneficiary",
    title: "What it means to be named",
    body: "Being named does not move money today. It means the person who holds the relationship has recorded you on a plan that already exists at the bank. You can learn what that record is without taking a meeting.",
  },
  {
    id: "questions",
    title: "Questions worth asking",
    body: "If you do meet the advisor, fair questions are: what is my role, which decisions are actually mine, and what can wait. You do not owe anyone a transfer, a consolidation, or an answer in the room.",
  },
  {
    id: "consent",
    title: "What you share, and what you don't",
    body: "The principal chooses whether you can read their note. You choose whether the advisor can see that you opened this space. Neither choice reveals accounts you hold somewhere else. LegacyAI never infers them.",
  },
  {
    id: "meeting",
    title: "Preparing for a first conversation",
    body: "A first meeting is an introduction, not a review of the whole estate. You can ask for twenty minutes. The principal has to approve the introduction before the advisor will call.",
  },
];

const ORDER: Record<Goal | "none", string[]> = {
  understand: ["beneficiary", "consent", "questions", "meeting"],
  meet: ["questions", "meeting", "beneficiary", "consent"],
  undecided: ["beneficiary", "questions", "consent", "meeting"],
  none: ["beneficiary", "questions", "consent", "meeting"],
};

export function lessonsFor(goal: Goal | null) {
  const order = ORDER[goal ?? "none"];
  return order.map((id) => LESSONS.find((lesson) => lesson.id === id)!);
}
