import test from "node:test";
import assert from "node:assert/strict";

import {
  createBabyProfileRouteScreenLoadState,
  createBabyProfileRouteScreenSavingState,
  loadBabyProfileRouteScreenState,
  saveBabyProfileRouteScreenState,
} from "./routeScreenController.ts";
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

test("createBabyProfileRouteScreenLoadState reuses the loading shell defaults for the route", () => {
  assert.deepEqual(createBabyProfileRouteScreenLoadState(" baby_123 "), {
    status: "loading",
    loadTarget: "explicit",
    babyId: "baby_123",
    form: null,
    ageSummary: null,
    submission: null,
  });
});

test("loadBabyProfileRouteScreenState lets the route retry an inline transport error into a ready state", async () => {
  const currentBabyIds: Array<string | undefined> = [];
  let loadCalls = 0;

  const first = await loadBabyProfileRouteScreenState({
    babyId: "baby_123",
    setCurrentBabyId(babyId) {
      currentBabyIds.push(babyId);
    },
    async loadScreenState() {
      loadCalls += 1;

      return createBabyProfileScreenErrorState({
        babyId: "baby_123",
        loadTarget: "explicit",
        error: new BabyProfileTransportError({
          message: "Request timed out",
          status: 504,
          payload: { error: "Request timed out" },
        }),
      });
    },
  });

  assert.equal(loadCalls, 1);
  assert.equal(first.status, "error");
  assert.deepEqual(currentBabyIds, []);

  const second = await loadBabyProfileRouteScreenState({
    babyId: "baby_123",
    setCurrentBabyId(babyId) {
      currentBabyIds.push(babyId);
    },
    async loadScreenState() {
      loadCalls += 1;
      return createBabyProfileScreenState(profile, "explicit");
    },
  });

  assert.equal(loadCalls, 2);
  assert.equal(second.status, "ready");
  assert.equal(second.babyId, "baby_123");
  assert.deepEqual(currentBabyIds, ["baby_123"]);
});

test("createBabyProfileRouteScreenSavingState clears stale inline save feedback before a retry", () => {
  const saving = createBabyProfileRouteScreenSavingState({
    ...createBabyProfileScreenState(profile, "explicit"),
    submission: {
      outcome: "updated",
      changedFields: ["timezone"],
    },
    requestErrorMessage: "Failed to reach the baby profile API",
  });

  assert.equal(saving.submission, null);
  assert.equal(saving.requestErrorMessage, null);
  assert.equal(saving.form.values.timezone, "America/Los_Angeles");
});

test("saveBabyProfileRouteScreenState keeps inline save errors on the returned route state", async () => {
  const currentBabyIds: Array<string | undefined> = [];
  const saved = await saveBabyProfileRouteScreenState({
    state: createBabyProfileScreenState(profile, "explicit"),
    setCurrentBabyId(babyId) {
      currentBabyIds.push(babyId);
    },
    async saveScreenState() {
      return {
        ...createBabyProfileScreenState(profile, "explicit"),
        requestErrorMessage: "Failed to reach the baby profile API",
      };
    },
  });

  assert.equal(saved.requestErrorMessage, "Failed to reach the baby profile API");
  assert.equal(saved.submission, null);
  assert.deepEqual(currentBabyIds, ["baby_123"]);
});
