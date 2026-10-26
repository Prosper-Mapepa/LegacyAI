import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { initialState, reduce } from "./reduce";
import { seedHouseholds } from "./seed";
import { assessHousehold, rankBook } from "./signal";

const now = new Date(2026, 9, 20, 12, 0, 0);

function book() {
  return initialState(now);
}

function household(state: ReturnType<typeof book>, id: string) {
  const found = state.households.find((item) => item.id === id);
  if (!found) throw new Error(id);
  return found;
}

describe("continuity signal", () => {
  it("ranks gaps ahead of ready calls, and never treats a decline as urgency", () => {
    const ranked = rankBook(seedHouseholds, now).map((item) => item.householdId);
    assert.deepEqual(ranked, ["whitmore", "alvarez", "okonkwo", "chen"]);
  });

  it("tells the Advisor to call the Principal about Heir, and not to call Heir", () => {
    const whitmore = assessHousehold(
      seedHouseholds.find((item) => item.id === "whitmore")!,
      now,
    );
    const david = whitmore.heirs.find((heir) => heir.heirId === "david")!;
    assert.equal(david.lane, "gap");
    assert.equal(david.title, "No relationship yet");
    assert.equal(david.contactHeir, false);
    assert.match(david.action, /Do not contact Heir/);
    assert.equal(david.engagement.visible, false);
    assert.equal(david.engagement.openedCount, null);
  });

  it("hides Luis's silence because he has not shared progress", () => {
    const alvarez = assessHousehold(
      seedHouseholds.find((item) => item.id === "alvarez")!,
      now,
    );
    const luis = alvarez.heirs[0];
    assert.equal(luis.engagement.visible, false);
    assert.equal(luis.contactHeir, false);
    assert.match(luis.withheld[0], /Progress inside the hub stays hidden/);
  });

  it("marks Ready Heir ready for a call and Hold Heir as do-not-contact", () => {
    const amaka = assessHousehold(
      seedHouseholds.find((item) => item.id === "okonkwo")!,
      now,
    ).heirs[0];
    assert.equal(amaka.lane, "ready");
    assert.equal(amaka.contactHeir, true);

    const michael = assessHousehold(
      seedHouseholds.find((item) => item.id === "chen")!,
      now,
    ).heirs.find((heir) => heir.heirId === "michael")!;
    assert.equal(michael.lane, "hold");
    assert.equal(michael.contactHeir, false);
  });

  it("keeps a decline even if the principal tries to approve a call", () => {
    const next = reduce(book(), {
      type: "setIntro",
      householdId: "chen",
      heirId: "michael",
      allowed: true,
    });
    const michael = household(next, "chen").heirs.find((heir) => heir.id === "michael")!;
    assert.equal(michael.scopes.advisorIntro, false);
    assert.equal(michael.declinedIntro, true);
  });

  it("changes Heir's signal when Principal invites them, without permitting a call", () => {
    const next = reduce(book(), {
      type: "invite",
      householdId: "whitmore",
      heirId: "david",
    });
    const david = assessHousehold(household(next, "whitmore"), now).heirs.find(
      (heir) => heir.heirId === "david",
    )!;
    assert.equal(david.title, "Introduction not approved");
    assert.equal(david.contactHeir, false);
    assert.match(david.action, /Do not call Heir/);
  });

  it("returns an approved brief to draft when consent changes", () => {
    let state = reduce(book(), {
      type: "approveBrief",
      householdId: "whitmore",
      text: "Call Principal.",
      fingerprint: "old",
    });
    state = reduce(state, {
      type: "invite",
      householdId: "whitmore",
      heirId: "david",
    });
    assert.equal(state.briefs.whitmore.status, "draft");
    assert.equal(state.briefs.whitmore.stale, true);
    assert.match(
      household(state, "whitmore").audit.at(-1)!.action,
      /Nothing was sent/,
    );
  });
});
