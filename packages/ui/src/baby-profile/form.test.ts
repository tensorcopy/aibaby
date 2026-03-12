import test from "node:test";
import assert from "node:assert/strict";

import {
  BABY_PROFILE_DEFAULT_TIMEZONE,
  createBabyProfileFormInput,
  diffBabyProfilePayload,
  hasBabyProfileUpdateChanges,
  toBabyProfilePayload,
  validateBabyProfileFormInput,
} from "./form.ts";

test("createBabyProfileFormInput uses defaults aligned with the DB profile contract", () => {
  assert.deepEqual(createBabyProfileFormInput(), {
    name: "",
    birthDate: "",
    sex: "unknown",
    feedingStyle: "solids_started",
    allergiesText: "",
    supplementsText: "",
    timezone: BABY_PROFILE_DEFAULT_TIMEZONE,
    primaryCaregiver: "",
  });
});

test("toBabyProfilePayload normalizes optional values and deduplicates list text", () => {
  assert.deepEqual(
    toBabyProfilePayload({
      name: "  Yiyi  ",
      birthDate: "2025-10-15",
      sex: "unknown",
      feedingStyle: "mixed",
      allergiesText: " egg, dairy, egg ",
      supplementsText: " vitamin D, iron, iron ",
      timezone: " America/Los_Angeles ",
      primaryCaregiver: "  Zhen ",
    }),
    {
      name: "Yiyi",
      birthDate: "2025-10-15",
      sex: null,
      feedingStyle: "mixed",
      allergies: ["dairy", "egg"],
      supplements: ["iron", "vitamin D"],
      timezone: "America/Los_Angeles",
      primaryCaregiver: "Zhen",
    },
  );
});

test("diffBabyProfilePayload returns only changed fields for edit submissions", () => {
  const patch = diffBabyProfilePayload(
    {
      name: "Yiyi",
      birthDate: "2025-10-15",
      sex: null,
      feedingStyle: "mixed",
      allergies: ["dairy", "egg"],
      supplements: ["iron"],
      timezone: "America/Los_Angeles",
      primaryCaregiver: "Zhen",
    },
    {
      name: "Yiyi",
      birthDate: "2025-10-15",
      sex: "female",
      feedingStyle: "mixed",
      allergies: ["dairy", "egg"],
      supplements: ["iron", "vitamin D"],
      timezone: "America/New_York",
      primaryCaregiver: null,
    },
  );

  assert.deepEqual(patch, {
    sex: "female",
    supplements: ["iron", "vitamin D"],
    timezone: "America/New_York",
    primaryCaregiver: null,
  });
  assert.equal(hasBabyProfileUpdateChanges(patch), true);
  assert.equal(hasBabyProfileUpdateChanges({}), false);
});

test("validateBabyProfileFormInput accepts the shared unknown sex state", () => {
  assert.deepEqual(
    validateBabyProfileFormInput(
      {
        name: "Yiyi",
        birthDate: "2025-10-15",
        sex: "unknown",
        feedingStyle: "solids_started",
        allergiesText: "",
        supplementsText: "",
        timezone: "America/Los_Angeles",
        primaryCaregiver: "",
      },
      new Date("2026-03-12T00:00:00.000Z"),
    ),
    {},
  );
});
