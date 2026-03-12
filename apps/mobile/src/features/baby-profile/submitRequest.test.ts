import test from "node:test";
import assert from "node:assert/strict";

import {
  createBabyProfileCreateEditState,
  submitBabyProfileCreateEditState,
  updateBabyProfileField,
} from "./createEditFlow.ts";
import { toBabyProfileSubmitRequest } from "./submitRequest.ts";

test("toBabyProfileSubmitRequest builds a create request for valid create submissions", () => {
  let state = createBabyProfileCreateEditState("create");
  state = updateBabyProfileField(state, "name", "Yiyi");
  state = updateBabyProfileField(state, "birthDate", "2025-10-15");

  const submission = submitBabyProfileCreateEditState(
    state,
    new Date("2026-03-12T00:00:00.000Z"),
  );

  assert.equal(submission.ok, true);
  if (!submission.ok) {
    return;
  }

  assert.deepEqual(toBabyProfileSubmitRequest(submission), {
    method: "POST",
    path: "/api/babies",
    body: {
      name: "Yiyi",
      birthDate: "2025-10-15",
      sex: null,
      feedingStyle: "solids_started",
      allergies: [],
      supplements: [],
      timezone: "UTC",
      primaryCaregiver: null,
    },
  });
});

test("toBabyProfileSubmitRequest builds a patch request for changed edit submissions", () => {
  let state = createBabyProfileCreateEditState("edit", {
    name: "Yiyi",
    birthDate: "2025-10-15",
    sex: null,
    feedingStyle: "mixed",
    allergies: [],
    supplements: ["iron"],
    timezone: "America/Los_Angeles",
    primaryCaregiver: "Zhen",
  });
  state = updateBabyProfileField(state, "supplementsText", "iron, vitamin D");

  const submission = submitBabyProfileCreateEditState(
    state,
    new Date("2026-03-12T00:00:00.000Z"),
  );

  assert.equal(submission.ok, true);
  if (!submission.ok) {
    return;
  }

  assert.deepEqual(toBabyProfileSubmitRequest(submission, " baby_123 "), {
    method: "PATCH",
    path: "/api/babies/baby_123",
    body: {
      supplements: ["iron", "vitamin D"],
    },
  });
});

test("toBabyProfileSubmitRequest returns null when an edit submission has no changes", () => {
  const state = createBabyProfileCreateEditState("edit", {
    name: "Yiyi",
    birthDate: "2025-10-15",
    sex: null,
    feedingStyle: "mixed",
    allergies: [],
    supplements: ["iron"],
    timezone: "America/Los_Angeles",
    primaryCaregiver: "Zhen",
  });

  const submission = submitBabyProfileCreateEditState(
    state,
    new Date("2026-03-12T00:00:00.000Z"),
  );

  assert.equal(submission.ok, true);
  if (!submission.ok) {
    return;
  }

  assert.equal(toBabyProfileSubmitRequest(submission, "baby_123"), null);
});

test("toBabyProfileSubmitRequest requires a baby id for changed edit submissions", () => {
  let state = createBabyProfileCreateEditState("edit", {
    name: "Yiyi",
    birthDate: "2025-10-15",
    sex: null,
    feedingStyle: "mixed",
    allergies: [],
    supplements: ["iron"],
    timezone: "America/Los_Angeles",
    primaryCaregiver: "Zhen",
  });
  state = updateBabyProfileField(state, "timezone", "America/New_York");

  const submission = submitBabyProfileCreateEditState(
    state,
    new Date("2026-03-12T00:00:00.000Z"),
  );

  assert.equal(submission.ok, true);
  if (!submission.ok) {
    return;
  }

  assert.throws(() => toBabyProfileSubmitRequest(submission), {
    message: /baby id is required/i,
  });
});
