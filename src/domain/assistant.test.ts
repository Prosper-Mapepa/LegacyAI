import assert from "node:assert/strict";
import test from "node:test";
import { answer } from "./assistant";
import { LESSONS } from "./lessons";
import { seedHouseholds } from "./seed";

const now = new Date(2026, 9, 20, 12, 0, 0);

test("the advisor never receives a lesson answer", () => {
  const reply = answer(
    "What are the lesson answers for Sibling?",
    "advisor",
    seedHouseholds,
    now,
    "whitmore",
  );
  assert.match(reply, /stay with the heir/i);
  for (const lesson of LESSONS) assert.equal(reply.includes(lesson.body), false);
});

test("the advisor is told not to call a declined heir", () => {
  const reply = answer("May I call Heir Chen?", "advisor", seedHouseholds, now, "whitmore");
  assert.match(reply, /may not call Heir/i);
  assert.match(reply, /cannot be undone/i);
});

test("a principal cannot see another family", () => {
  const reply = answer("Tell me about Okonkwo family", "principal", seedHouseholds, now, "whitmore");
  assert.match(reply, /not on your desk/i);
  assert.equal(reply.includes("$6.2"), false);
});

test("an heir cannot see a sibling or the relationship value", () => {
  const sibling = answer("What is Sibling reading?", "heir", seedHouseholds, now, "whitmore", "david");
  const money = answer("What is the relationship worth?", "heir", seedHouseholds, now, "whitmore", "david");
  assert.match(sibling, /not yours/i);
  assert.match(money, /not on your page/i);
  assert.equal(sibling.includes("$18.4"), false);
});
