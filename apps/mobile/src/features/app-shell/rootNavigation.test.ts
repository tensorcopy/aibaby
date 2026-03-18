import test from "node:test";
import assert from "node:assert/strict";

import {
  createBabyProfileHref,
  createMobileHomeHref,
  createMobileRootNavigationModel,
} from "./rootNavigation.ts";

test("createMobileRootNavigationModel points first-time users to create baby profile", () => {
  const model = createMobileRootNavigationModel();

  assert.equal(model.title, "AI Baby");
  assert.equal(model.primaryAction.label, "Create baby profile");
  assert.equal(model.primaryAction.href, "/baby-profile");
  assert.match(model.subtitle, /Start with a baby profile/);
  assert.equal(model.statusBanner, undefined);
  assert.equal(model.quickActions.length, 7);
  assert.ok(model.quickActions.every((action) => action.href === undefined));
});

test("createMobileRootNavigationModel keeps explicit baby profile navigation stable", () => {
  const model = createMobileRootNavigationModel({ babyId: "baby_123" });

  assert.equal(model.primaryAction.label, "Open baby profile");
  assert.equal(model.primaryAction.href, "/baby-profile?babyId=baby_123");
  assert.match(model.subtitle, /launch point for logging, review, meal ideas, reminders, and exports/);
  assert.deepEqual(
    model.quickActions.map((action) => action.href),
    [
      "/log-meal?babyId=baby_123",
      "/today?babyId=baby_123",
      "/review?babyId=baby_123&days=7",
      "/meal-ideas?babyId=baby_123",
      "/reminders?babyId=baby_123",
      "/summaries?babyId=baby_123",
      "/growth?babyId=baby_123",
    ],
  );
});

test("createMobileRootNavigationModel surfaces a success handoff banner when the baby profile flow returns home", () => {
  const model = createMobileRootNavigationModel({
    babyId: "baby_123",
    handoff: "baby-profile-updated",
  });

  assert.match(model.subtitle, /Baby profile saved/);
  assert.deepEqual(model.statusBanner, {
    title: "Baby profile saved",
    message: "Your latest baby profile changes are ready for the next mobile steps.",
  });
});

test("createMobileHomeHref carries the saved baby id and success handoff back to the app root", () => {
  assert.equal(
    createMobileHomeHref({
      babyId: " baby 123 ",
      handoff: "baby-profile-created",
    }),
    "/?babyId=baby+123&handoff=baby-profile-created",
  );
});

test("createBabyProfileHref trims and encodes the baby id query parameter", () => {
  assert.equal(createBabyProfileHref("  baby 123  "), "/baby-profile?babyId=baby%20123");
});
