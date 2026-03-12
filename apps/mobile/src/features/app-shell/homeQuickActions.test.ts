import test from "node:test";
import assert from "node:assert/strict";

import {
  createLogMealHref,
  createMobileHomeQuickActions,
  createSummaryHistoryHref,
  createTodayTimelineHref,
} from "./homeQuickActions.ts";

test("createMobileHomeQuickActions enables all downstream mobile actions once a baby profile is active", () => {
  assert.deepEqual(createMobileHomeQuickActions(" baby_123 "), [
    {
      key: "log-meal",
      label: "Log a meal",
      description: "Jump into the chat-first meal logging flow for this baby.",
      href: "/log-meal?babyId=baby_123",
    },
    {
      key: "today-timeline",
      label: "Today's timeline",
      description: "Review what has been logged today before editing or confirming records.",
      href: "/today?babyId=baby_123",
    },
    {
      key: "summary-history",
      label: "Summary history",
      description: "Open saved daily and weekly summaries for the active baby profile.",
      href: "/summaries?babyId=baby_123",
    },
  ]);
});

test("createMobileHomeQuickActions keeps downstream actions disabled when no baby profile is active", () => {
  const actions = createMobileHomeQuickActions();

  assert.equal(actions.length, 3);

  for (const action of actions) {
    assert.equal(action.href, undefined);
    assert.match(action.disabledReason ?? "", /Create a baby profile first/);
  }
});

test("baby-scoped home quick action href builders trim and encode baby ids", () => {
  assert.equal(createLogMealHref("  baby 123  "), "/log-meal?babyId=baby%20123");
  assert.equal(createTodayTimelineHref("  baby 123  "), "/today?babyId=baby%20123");
  assert.equal(createSummaryHistoryHref("  baby 123  "), "/summaries?babyId=baby%20123");
});
