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

  const identitySection = model.sections[1];
  assert.equal(identitySection?.kind, "choice");
  if (identitySection?.kind !== "choice") {
    return;
  }

  assert.equal(identitySection.field, "sex");
  assert.deepEqual(
    identitySection.options.map((option) => option.label),
    ["Female", "Male", "Other", "Prefer not to say"],
  );
});

test("createBabyProfileRouteModel groups profile fields into ordered route sections", () => {
  const state = createBabyProfileScreenState(profile, "explicit");
  const model = createBabyProfileRouteModel(state);

  assert.deepEqual(
    model.sections.map((section) => section.key),
    ["basics", "identity", "feeding", "care"],
  );

  const basicsSection = model.sections[0];
  assert.equal(basicsSection?.kind, "text-fields");
  if (basicsSection?.kind !== "text-fields") {
    return;
  }

  assert.deepEqual(
    basicsSection.fields.map((field) => field.key),
    ["name", "birthDate"],
  );

  const feedingSection = model.sections[2];
  assert.equal(feedingSection?.kind, "choice");
  if (feedingSection?.kind !== "choice") {
    return;
  }

  assert.equal(feedingSection.field, "feedingStyle");
  assert.equal(
    feedingSection.options.find((option) => option.selected)?.label,
    "Mixed",
  );

  const careSection = model.sections[3];
  assert.equal(careSection?.kind, "text-fields");
  if (careSection?.kind !== "text-fields") {
    return;
  }

  assert.deepEqual(
    careSection.fields.map((field) => field.key),
    ["allergiesText", "supplementsText", "timezone", "primaryCaregiver"],
  );
});

test("createBabyProfileRouteModel surfaces choice-field validation feedback", () => {
  const state = createBabyProfileScreenState(profile, "explicit");
  const model = createBabyProfileRouteModel({
    ...state,
    form: {
      ...state.form,
      errors: {
        sex: "Sex must be one of the supported options.",
        feedingStyle: "Feeding style must be one of the supported options.",
      },
    },
  });

  const sexSection = model.sections[1];
  assert.equal(sexSection?.kind, "choice");
  if (sexSection?.kind !== "choice") {
    return;
  }

  assert.equal(sexSection.field, "sex");
  assert.equal(sexSection.label, "Sex");
  assert.equal(sexSection.error, "Sex must be one of the supported options.");
  assert.equal(
    sexSection.options.find((option) => option.selected)?.label,
    "Prefer not to say",
  );

  const feedingSection = model.sections[2];
  assert.equal(feedingSection?.kind, "choice");
  if (feedingSection?.kind !== "choice") {
    return;
  }

  assert.equal(feedingSection.field, "feedingStyle");
  assert.equal(feedingSection.error, "Feeding style must be one of the supported options.");
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

  const sexSection = model.sections[1];
  assert.equal(sexSection?.kind, "choice");
  if (sexSection?.kind !== "choice") {
    return;
  }

  assert.equal(sexSection.field, "sex");
  assert.equal(sexSection.label, "Sex");
  assert.equal(
    sexSection.options.find((option) => option.selected)?.label,
    "Prefer not to say",
  );
});
