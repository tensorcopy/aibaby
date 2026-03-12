import test from "node:test";
import assert from "node:assert/strict";

import {
  createBabyProfileScreenErrorState,
  createBabyProfileScreenState,
  createLoadingBabyProfileScreenState,
  loadBabyProfileScreenState,
  saveBabyProfileScreenState,
  updateBabyProfileScreenField,
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

test("createLoadingBabyProfileScreenState captures whether the shell is loading the current or explicit profile", () => {
  assert.deepEqual(createLoadingBabyProfileScreenState(), {
    status: "loading",
    loadTarget: "current",
    babyId: undefined,
    form: null,
    ageSummary: null,
    submission: null,
  });

  assert.deepEqual(createLoadingBabyProfileScreenState(" baby_123 "), {
    status: "loading",
    loadTarget: "explicit",
    babyId: "baby_123",
    form: null,
    ageSummary: null,
    submission: null,
  });
});

test("createBabyProfileScreenState bootstraps edit mode from a stored profile", () => {
  const state = createBabyProfileScreenState(profile, "explicit");

  assert.equal(state.status, "ready");
  assert.equal(state.loadTarget, "explicit");
  assert.equal(state.form.mode, "edit");
  assert.equal(state.babyId, "baby_123");
  assert.equal(state.ageSummary?.displayLabel, "4 months");
});

test("loadBabyProfileScreenState falls back to an empty create flow when the current profile is missing", async () => {
  const state = await loadBabyProfileScreenState({
    async executeLoadRequest() {
      throw new BabyProfileTransportError({
        message: "Baby profile not found",
        status: 404,
        payload: { error: "Baby profile not found" },
      });
    },
  });

  assert.equal(state.loadTarget, "current");
  assert.equal(state.form.mode, "create");
  assert.equal(state.babyId, undefined);
  assert.equal(state.ageSummary, null);
});

test("loadBabyProfileScreenState loads the explicit baby id through the transport layer", async () => {
  const calls: Array<unknown> = [];

  const state = await loadBabyProfileScreenState({
    babyId: " baby_123 ",
    auth: { ownerUserId: "user_123" },
    async executeLoadRequest(args) {
      calls.push(args);
      return profile;
    },
  });

  assert.deepEqual(calls, [
    {
      request: {
        method: "GET",
        path: "/api/babies/baby_123",
        target: "explicit",
        babyId: "baby_123",
      },
      auth: { ownerUserId: "user_123" },
    },
  ]);
  assert.equal(state.form.mode, "edit");
  assert.equal(state.babyId, "baby_123");
});

test("updateBabyProfileScreenField keeps the derived age summary in sync", () => {
  const nextState = updateBabyProfileScreenField(
    createBabyProfileScreenState(),
    "birthDate",
    "2026-03-05",
  );

  assert.equal(nextState.form.values.birthDate, "2026-03-05");
  assert.equal(nextState.ageSummary?.displayLabel, "1 week");
});

test("saveBabyProfileScreenState creates a profile and switches the screen into edit mode", async () => {
  const calls: Array<unknown> = [];
  let state = createBabyProfileScreenState();
  state = updateBabyProfileScreenField(state, "name", "Yiyi");
  state = updateBabyProfileScreenField(state, "birthDate", "2025-10-15");
  state = updateBabyProfileScreenField(state, "feedingStyle", "mixed");
  state = updateBabyProfileScreenField(state, "timezone", "America/Los_Angeles");

  const saved = await saveBabyProfileScreenState({
    state,
    auth: { ownerUserId: "user_123" },
    async executeSubmitRequest(args) {
      calls.push(args);
      return profile;
    },
  });

  assert.deepEqual(calls, [
    {
      request: {
        method: "POST",
        path: "/api/babies",
        body: {
          name: "Yiyi",
          birthDate: "2025-10-15",
          sex: null,
          feedingStyle: "mixed",
          allergies: [],
          supplements: [],
          timezone: "America/Los_Angeles",
          primaryCaregiver: null,
        },
      },
      auth: { ownerUserId: "user_123" },
    },
  ]);
  assert.equal(saved.form.mode, "edit");
  assert.equal(saved.babyId, "baby_123");
  assert.deepEqual(saved.submission, {
    outcome: "created",
    request: calls[0] && (calls[0] as { request: unknown }).request,
    changedFields: [
      "allergies",
      "birthDate",
      "feedingStyle",
      "name",
      "primaryCaregiver",
      "sex",
      "supplements",
      "timezone",
    ],
  });
});

test("saveBabyProfileScreenState skips transport for edit submissions with no changes", async () => {
  const state = createBabyProfileScreenState(profile, "explicit");

  const saved = await saveBabyProfileScreenState({
    state,
    async executeSubmitRequest() {
      throw new Error("should not submit");
    },
  });

  assert.deepEqual(saved.submission, {
    outcome: "noop",
    changedFields: [],
  });
});

test("saveBabyProfileScreenState PATCHes only changed fields for edit mode", async () => {
  const calls: Array<unknown> = [];
  const state = updateBabyProfileScreenField(
    createBabyProfileScreenState(profile, "explicit"),
    "timezone",
    "America/New_York",
  );

  const saved = await saveBabyProfileScreenState({
    state,
    async executeSubmitRequest(args) {
      calls.push(args);
      return {
        ...profile,
        timezone: "America/New_York",
        updatedAt: "2026-03-12T08:00:00.000Z",
      };
    },
  });

  assert.deepEqual(calls, [
    {
      request: {
        method: "PATCH",
        path: "/api/babies/baby_123",
        body: {
          timezone: "America/New_York",
        },
      },
      auth: undefined,
    },
  ]);
  assert.equal(saved.form.mode, "edit");
  assert.equal(saved.form.values.timezone, "America/New_York");
  assert.deepEqual(saved.submission, {
    outcome: "updated",
    request: calls[0] && (calls[0] as { request: unknown }).request,
    changedFields: ["timezone"],
  });
});


test("createBabyProfileScreenErrorState captures the failed load message inline", () => {
  const state = createBabyProfileScreenErrorState({
    babyId: "baby_123",
    loadTarget: "explicit",
    error: new BabyProfileTransportError({
      message: "Baby profile not found",
      status: 404,
      payload: { error: "Baby profile not found" },
    }),
  });

  assert.deepEqual(state, {
    status: "error",
    loadTarget: "explicit",
    babyId: "baby_123",
    form: null,
    ageSummary: null,
    submission: null,
    message: "Baby profile not found",
  });
});

test("loadBabyProfileScreenState returns an inline error state when an explicit profile load fails", async () => {
  const state = await loadBabyProfileScreenState({
    babyId: "baby_123",
    async executeLoadRequest() {
      throw new BabyProfileTransportError({
        message: "Request timed out",
        status: 504,
        payload: { error: "Request timed out" },
      });
    },
  });

  assert.equal(state.status, "error");
  assert.equal(state.loadTarget, "explicit");
  assert.equal(state.babyId, "baby_123");
  assert.equal(state.message, "Request timed out");
});

test("saveBabyProfileScreenState keeps the form and surfaces inline save errors", async () => {
  let state = createBabyProfileScreenState(profile, "explicit");
  state = updateBabyProfileScreenField(state, "timezone", "America/New_York");

  const saved = await saveBabyProfileScreenState({
    state,
    async executeSubmitRequest() {
      throw new BabyProfileTransportError({
        message: "Failed to reach the baby profile API",
        status: 503,
        payload: { error: "Failed to reach the baby profile API" },
      });
    },
  });

  assert.equal(saved.status, "ready");
  assert.equal(saved.form.values.timezone, "America/New_York");
  assert.equal(saved.submission, null);
  assert.equal(saved.requestErrorMessage, "Failed to reach the baby profile API");
});

test("updateBabyProfileScreenField clears inline save errors after the user edits again", () => {
  const nextState = updateBabyProfileScreenField(
    {
      ...createBabyProfileScreenState(profile, "explicit"),
      requestErrorMessage: "Failed to save baby profile.",
    },
    "timezone",
    "America/New_York",
  );

  assert.equal(nextState.requestErrorMessage, null);
});
