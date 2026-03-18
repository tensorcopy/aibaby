import test from "node:test";
import assert from "node:assert/strict";

import {
  createLogMealHref,
  createMobileHomeQuickActions,
  createGrowthHref,
  createMealIdeasHref,
  createReminderHistoryHref,
  createReviewWindowHref,
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
      key: "review-window",
      label: "Review",
      description: "Jump into the 7-day review window to spot trends before drilling into a specific day.",
      href: "/review?babyId=baby_123&days=7",
    },
    {
      key: "meal-ideas",
      label: "Meal ideas",
      description: "Open the next-day suggestion set shaped by recent gaps and age-stage guidance.",
      href: "/meal-ideas?babyId=baby_123",
    },
    {
      key: "reminders",
      label: "Reminders",
      description: "Open the reminder timeline for age-stage guidance and follow-up nudges.",
      href: "/reminders?babyId=baby_123",
    },
    {
      key: "summary-history",
      label: "Summaries & exports",
      description: "Review saved summaries and create the latest Markdown export bundle from one place.",
      href: "/summaries?babyId=baby_123",
    },
    {
      key: "growth",
      label: "Growth",
      description: "Hold space for future weight and height tracking without waiting on backend changes.",
      href: "/growth?babyId=baby_123",
    },
  ]);
});

test("createMobileHomeQuickActions keeps downstream actions disabled when no baby profile is active", () => {
  const actions = createMobileHomeQuickActions();

  assert.equal(actions.length, 7);

  for (const action of actions) {
    assert.equal(action.href, undefined);
    assert.match(action.disabledReason ?? "", /Create a baby profile first/);
  }
});

test("baby-scoped home quick action href builders trim and encode baby ids", () => {
  assert.equal(createLogMealHref("  baby 123  "), "/log-meal?babyId=baby%20123");
  assert.equal(createTodayTimelineHref("  baby 123  "), "/today?babyId=baby%20123");
  assert.equal(createReviewWindowHref("  baby 123  "), "/review?babyId=baby%20123&days=7");
  assert.equal(createMealIdeasHref("  baby 123  "), "/meal-ideas?babyId=baby%20123");
  assert.equal(createReminderHistoryHref("  baby 123  "), "/reminders?babyId=baby%20123");
  assert.equal(createSummaryHistoryHref("  baby 123  "), "/summaries?babyId=baby%20123");
  assert.equal(createGrowthHref("  baby 123  "), "/growth?babyId=baby%20123");
});
