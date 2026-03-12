import test from "node:test";
import assert from "node:assert/strict";

import {
  canSubmitBabyProfileCreateEditState,
  createBabyProfileCreateEditState,
  hasBabyProfileCreateEditUnsavedChanges,
  selectBabyProfileCreateEditAgeSummary,
  submitBabyProfileCreateEditState,
  updateBabyProfileField,
} from "./createEditFlow.ts";

test("create state starts with the shared baby profile defaults", () => {
  const state = createBabyProfileCreateEditState("create");

  assert.equal(state.values.sex, "unknown");
  assert.equal(state.values.feedingStyle, "solids_started");
  assert.equal(state.values.primaryCaregiver, "");
  assert.deepEqual(state.initialPayload, {
    name: "",
    birthDate: "",
    sex: null,
    feedingStyle: "solids_started",
    allergies: [],
    supplements: [],
    timezone: "UTC",
    primaryCaregiver: null,
  });
});

test("submitBabyProfileCreateEditState returns a create payload aligned with the DB contract", () => {
  let state = createBabyProfileCreateEditState("create");
  state = updateBabyProfileField(state, "name", "  Yiyi  ");
  state = updateBabyProfileField(state, "birthDate", "2025-10-15");
  state = updateBabyProfileField(state, "feedingStyle", "mixed");
  state = updateBabyProfileField(state, "allergiesText", "egg, dairy, egg");
  state = updateBabyProfileField(state, "supplementsText", "iron, vitamin D, iron");
  state = updateBabyProfileField(state, "timezone", " America/Los_Angeles ");
  state = updateBabyProfileField(state, "primaryCaregiver", "  Zhen ");

  const result = submitBabyProfileCreateEditState(
    state,
    new Date("2026-03-12T00:00:00.000Z"),
  );

  assert.deepEqual(result, {
    ok: true,
    mode: "create",
    payload: {
      name: "Yiyi",
      birthDate: "2025-10-15",
      sex: null,
      feedingStyle: "mixed",
      allergies: ["dairy", "egg"],
      supplements: ["iron", "vitamin D"],
      timezone: "America/Los_Angeles",
      primaryCaregiver: "Zhen",
    },
  });
});

test("submitBabyProfileCreateEditState returns an edit patch with only changed fields", () => {
  let state = createBabyProfileCreateEditState("edit", {
    name: "Yiyi",
    birthDate: "2025-10-15",
    sex: null,
    feedingStyle: "mixed",
    allergies: ["dairy", "egg"],
    supplements: ["iron"],
    timezone: "America/Los_Angeles",
    primaryCaregiver: "Zhen",
  });

  state = updateBabyProfileField(state, "sex", "female");
  state = updateBabyProfileField(state, "supplementsText", "iron, vitamin D");
  state = updateBabyProfileField(state, "primaryCaregiver", "");

  const result = submitBabyProfileCreateEditState(
    state,
    new Date("2026-03-12T00:00:00.000Z"),
  );

  assert.deepEqual(result, {
    ok: true,
    mode: "edit",
    payload: {
      name: "Yiyi",
      birthDate: "2025-10-15",
      sex: "female",
      feedingStyle: "mixed",
      allergies: ["dairy", "egg"],
      supplements: ["iron", "vitamin D"],
      timezone: "America/Los_Angeles",
      primaryCaregiver: null,
    },
    patch: {
      sex: "female",
      supplements: ["iron", "vitamin D"],
      primaryCaregiver: null,
    },
    hasChanges: true,
  });
});

test("hasBabyProfileCreateEditUnsavedChanges keeps create mode submittable and edit mode dirty-aware", () => {
  const createState = createBabyProfileCreateEditState("create");
  assert.equal(hasBabyProfileCreateEditUnsavedChanges(createState), true);

  const editState = createBabyProfileCreateEditState("edit", {
    name: "Yiyi",
    birthDate: "2025-10-15",
    sex: null,
    feedingStyle: "mixed",
    allergies: ["egg"],
    supplements: ["iron"],
    timezone: "America/Los_Angeles",
    primaryCaregiver: "Zhen",
  });
  assert.equal(hasBabyProfileCreateEditUnsavedChanges(editState), false);

  const changedState = updateBabyProfileField(editState, "timezone", "America/New_York");
  assert.equal(hasBabyProfileCreateEditUnsavedChanges(changedState), true);
});

test("canSubmitBabyProfileCreateEditState requires a valid form and unsaved changes", () => {
  let createState = createBabyProfileCreateEditState("create");
  assert.equal(canSubmitBabyProfileCreateEditState(createState), false);

  createState = updateBabyProfileField(createState, "name", "Yiyi");
  createState = updateBabyProfileField(createState, "birthDate", "2025-10-15");
  createState = updateBabyProfileField(createState, "timezone", "America/Los_Angeles");
  assert.equal(canSubmitBabyProfileCreateEditState(createState), true);

  const editState = createBabyProfileCreateEditState("edit", {
    name: "Yiyi",
    birthDate: "2025-10-15",
    sex: null,
    feedingStyle: "mixed",
    allergies: ["egg"],
    supplements: ["iron"],
    timezone: "America/Los_Angeles",
    primaryCaregiver: "Zhen",
  });
  assert.equal(canSubmitBabyProfileCreateEditState(editState), false);

  const invalidEditState = updateBabyProfileField(editState, "birthDate", "3026-03-12");
  assert.equal(canSubmitBabyProfileCreateEditState(invalidEditState), false);

  const validEditState = updateBabyProfileField(editState, "timezone", "America/New_York");
  assert.equal(canSubmitBabyProfileCreateEditState(validEditState), true);
});

test("selectBabyProfileCreateEditAgeSummary derives a display label from the chosen birth date", () => {
  let state = createBabyProfileCreateEditState("create");
  state = updateBabyProfileField(state, "birthDate", "2025-10-15");

  assert.deepEqual(
    selectBabyProfileCreateEditAgeSummary(state, new Date("2026-03-12T04:15:00.000Z")),
    {
      days: 148,
      weeks: 21,
      months: 4,
      displayLabel: "4 months",
    },
  );
});
