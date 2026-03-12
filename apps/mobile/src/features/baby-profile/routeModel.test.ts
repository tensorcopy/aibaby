import test from "node:test";
import assert from "node:assert/strict";

import { createBabyProfileRouteModel } from "./routeModel.ts";
import { createBabyProfileScreenState, updateBabyProfileScreenField } from "./screenShell.ts";

const profile = {
  id: "baby_123",
  ownerUserId: "user_123",
  name: "Yiyi",
  birthDate: "2025-10-15",
  sex: null,
  feedingStyle: "mixed",
  allergies: ["egg"],
  supplements: ["iron"],
  timezone: "America/Los_Angeles",
  primaryCaregiver: "Zhen",
  createdAt: "2026-03-12T07:00:00.000Z",
  updatedAt: "2026-03-12T07:00:00.000Z",
} as const;

test("createBabyProfileRouteModel exposes create-mode fields and labels", () => {
  const state = updateBabyProfileScreenField(
    updateBabyProfileScreenField(createBabyProfileScreenState(), "birthDate", "2026-03-05"),
    "name",
    "Yiyi",
  );

  const model = createBabyProfileRouteModel(state);

  assert.equal(model.title, "Create baby profile");
  assert.equal(model.subtitle, "Current age: 1 week");
  assert.equal(model.submitLabel, "Create profile");
  assert.equal(model.textFields[0]?.label, "Baby name");
  assert.equal(model.textFields[1]?.placeholder, "YYYY-MM-DD");
  assert.deepEqual(
    model.sexOptions.map((option) => option.label),
    ["Female", "Male", "Other", "Prefer not to say"],
  );
});

test("createBabyProfileRouteModel surfaces edit-mode submission feedback", () => {
  const state = createBabyProfileScreenState(profile, "explicit");
  const model = createBabyProfileRouteModel({
    ...state,
    submission: {
      outcome: "updated",
      changedFields: ["timezone", "supplements"],
      request: {
        method: "PATCH",
        path: "/api/babies/baby_123",
        body: {
          timezone: "America/New_York",
          supplements: ["iron", "vitamin D"],
        },
      },
    },
  });

  assert.equal(model.title, "Baby profile");
  assert.equal(model.submitLabel, "Save profile");
  assert.equal(model.statusMessage, "Saved 2 profile fields.");
  assert.equal(
    model.feedingStyleOptions.find((option) => option.selected)?.label,
    "Mixed",
  );
});
