import test from "node:test";
import assert from "node:assert/strict";

import { createBabyProfileRouteScreenModel } from "./routeScreenModel.ts";
import {
  createBabyProfileScreenErrorState,
  createBabyProfileScreenState,
} from "./screenShell.ts";
import { BabyProfileTransportError } from "./transport.ts";

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

test("createBabyProfileRouteScreenModel exposes the route loading copy", () => {
  const model = createBabyProfileRouteScreenModel({
    state: {
      status: "loading",
      loadTarget: "current",
      babyId: undefined,
      form: null,
      ageSummary: null,
      submission: null,
    },
    isSaving: false,
  });

  assert.deepEqual(model, {
    kind: "loading",
    title: "Baby profile",
    loadingMessage: "Loading baby profile…",
  });
});

test("createBabyProfileRouteScreenModel exposes inline retry copy for route transport failures", () => {
  const model = createBabyProfileRouteScreenModel({
    state: createBabyProfileScreenErrorState({
      babyId: "baby_123",
      loadTarget: "explicit",
      error: new BabyProfileTransportError({
        message: "Request timed out",
        status: 504,
        payload: { error: "Request timed out" },
      }),
    }),
    isSaving: false,
  });

  assert.deepEqual(model, {
    kind: "error",
    title: "Baby profile",
    subtitle: "We couldn't load this profile right now. Try again to keep editing.",
    errorMessage: "Request timed out",
    retryLabel: "Retry",
  });
});

test("createBabyProfileRouteScreenModel keeps inline save errors visible while preserving the save label", () => {
  const model = createBabyProfileRouteScreenModel({
    state: {
      ...createBabyProfileScreenState(profile, "explicit"),
      requestErrorMessage: "Failed to reach the baby profile API",
    },
    isSaving: false,
  });

  assert.equal(model.kind, "ready");
  if (model.kind !== "ready") {
    return;
  }

  assert.equal(model.route.title, "Baby profile");
  assert.equal(model.requestErrorMessage, "Failed to reach the baby profile API");
  assert.equal(model.submitLabel, "Save profile");
  assert.equal(model.inputsDisabled, false);
});

test("createBabyProfileRouteScreenModel hides stale inline save errors while a retry is in flight", () => {
  const model = createBabyProfileRouteScreenModel({
    state: {
      ...createBabyProfileScreenState(profile, "explicit"),
      requestErrorMessage: "Failed to reach the baby profile API",
    },
    isSaving: true,
  });

  assert.equal(model.kind, "ready");
  if (model.kind !== "ready") {
    return;
  }

  assert.equal(model.requestErrorMessage, null);
  assert.equal(model.submitLabel, "Saving…");
  assert.equal(model.inputsDisabled, true);
});

test("createBabyProfileRouteScreenModel swaps the submit label while a retry is in flight", () => {
  const model = createBabyProfileRouteScreenModel({
    state: createBabyProfileScreenState(profile, "explicit"),
    isSaving: true,
  });

  assert.equal(model.kind, "ready");
  if (model.kind !== "ready") {
    return;
  }

  assert.equal(model.submitLabel, "Saving…");
  assert.equal(model.inputsDisabled, true);
  assert.equal(model.isSaving, true);
});
