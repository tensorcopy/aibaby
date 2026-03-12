import test from "node:test";
import assert from "node:assert/strict";

import { createBabyProfileCreateEditState, submitBabyProfileCreateEditState, updateBabyProfileField } from "./createEditFlow.ts";
import { toBabyProfileLoadRequest } from "./loadRequest.ts";
import { toBabyProfileSubmitRequest } from "./submitRequest.ts";
import {
  BabyProfileTransportError,
  buildOwnerScopedHeaders,
  executeBabyProfileLoadRequest,
  executeBabyProfileSubmitRequest,
} from "./transport.ts";

test("buildOwnerScopedHeaders prefers bearer auth and only adds content-type for JSON bodies", () => {
  assert.deepEqual(
    buildOwnerScopedHeaders({
      auth: {
        authorization: " Bearer dev-user:user_123 ",
        ownerUserId: "user_999",
      },
      hasJsonBody: true,
    }),
    {
      authorization: "Bearer dev-user:user_123",
      "content-type": "application/json",
    },
  );

  assert.deepEqual(
    buildOwnerScopedHeaders({
      auth: {
        ownerUserId: " user_123 ",
      },
      hasJsonBody: false,
    }),
    {
      "x-aibaby-owner-user-id": "user_123",
    },
  );
});

test("executeBabyProfileLoadRequest GETs the owner-scoped current profile route", async () => {
  const calls: Array<unknown> = [];

  const profile = await executeBabyProfileLoadRequest({
    request: toBabyProfileLoadRequest(),
    auth: { ownerUserId: "user_123" },
    async fetchImpl(url, options) {
      calls.push({ url, options });
      return new Response(
        JSON.stringify({
          id: "baby_123",
          ownerUserId: "user_123",
          name: "Yiyi",
          birthDate: "2025-10-15",
          sex: null,
          feedingStyle: "mixed",
          timezone: "America/Los_Angeles",
          allergies: ["dairy", "egg"],
          supplements: ["iron"],
          primaryCaregiver: "Zhen",
          createdAt: "2026-03-12T08:20:00.000Z",
          updatedAt: "2026-03-12T08:22:00.000Z",
        }),
        { status: 200 },
      );
    },
  });

  assert.deepEqual(calls, [
    {
      url: "/api/babies",
      options: {
        method: "GET",
        headers: {
          "x-aibaby-owner-user-id": "user_123",
        },
        body: undefined,
      },
    },
  ]);
  assert.equal(profile.id, "baby_123");
  assert.equal(profile.ownerUserId, "user_123");
  assert.equal(profile.name, "Yiyi");
});

test("executeBabyProfileLoadRequest GETs an explicit baby profile route with bearer auth", async () => {
  const calls: Array<unknown> = [];

  const profile = await executeBabyProfileLoadRequest({
    request: toBabyProfileLoadRequest(" baby_123 "),
    auth: " Bearer dev-user:user_123 ",
    async fetchImpl(url, options) {
      calls.push({ url, options });
      return new Response(
        JSON.stringify({
          profile: {
            id: "baby_123",
            ownerUserId: "user_123",
            name: "Yiyi",
            birthDate: "2025-10-15",
            sex: null,
            feedingStyle: "mixed",
            timezone: "America/Los_Angeles",
            allergies: [],
            supplements: [],
            primaryCaregiver: null,
          },
        }),
        { status: 200 },
      );
    },
  });

  assert.deepEqual(calls, [
    {
      url: "/api/babies/baby_123",
      options: {
        method: "GET",
        headers: {
          authorization: "Bearer dev-user:user_123",
        },
        body: undefined,
      },
    },
  ]);
  assert.equal(profile.id, "baby_123");
  assert.equal(profile.ownerUserId, "user_123");
});

test("executeBabyProfileSubmitRequest POSTs a validated create payload to the collection route", async () => {
  const calls: Array<unknown> = [];

  let state = createBabyProfileCreateEditState("create");
  state = updateBabyProfileField(state, "name", "Yiyi");
  state = updateBabyProfileField(state, "birthDate", "2025-10-15");
  state = updateBabyProfileField(state, "timezone", "America/Los_Angeles");

  const submission = submitBabyProfileCreateEditState(
    state,
    new Date("2026-03-12T00:00:00.000Z"),
  );

  assert.equal(submission.ok, true);
  if (!submission.ok) {
    return;
  }

  const request = toBabyProfileSubmitRequest(submission);
  assert.notEqual(request, null);
  if (!request) {
    return;
  }

  const profile = await executeBabyProfileSubmitRequest({
    request,
    auth: { ownerUserId: "user_123" },
    async fetchImpl(url, options) {
      calls.push({ url, options });
      return new Response(
        JSON.stringify({
          body: {
            id: "baby_123",
            ownerUserId: "user_123",
            name: "Yiyi",
            birthDate: "2025-10-15",
            sex: null,
            feedingStyle: "solids_started",
            timezone: "America/Los_Angeles",
            allergies: [],
            supplements: [],
            primaryCaregiver: null,
          },
        }),
        { status: 201 },
      );
    },
  });

  assert.deepEqual(calls, [
    {
      url: "/api/babies",
      options: {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-aibaby-owner-user-id": "user_123",
        },
        body: JSON.stringify({
          name: "Yiyi",
          birthDate: "2025-10-15",
          sex: null,
          feedingStyle: "solids_started",
          allergies: [],
          supplements: [],
          timezone: "America/Los_Angeles",
          primaryCaregiver: null,
        }),
      },
    },
  ]);
  assert.equal(profile.id, "baby_123");
  assert.equal(profile.name, "Yiyi");
});

test("executeBabyProfileSubmitRequest PATCHes a validated edit payload to the item route", async () => {
  const calls: Array<unknown> = [];

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

  const request = toBabyProfileSubmitRequest(submission, "baby_123");
  assert.notEqual(request, null);
  if (!request) {
    return;
  }

  const profile = await executeBabyProfileSubmitRequest({
    request,
    auth: "Bearer dev-user:user_123",
    async fetchImpl(url, options) {
      calls.push({ url, options });
      return new Response(
        JSON.stringify({
          id: "baby_123",
          ownerUserId: "user_123",
          name: "Yiyi",
          birthDate: "2025-10-15",
          sex: null,
          feedingStyle: "mixed",
          timezone: "America/New_York",
          allergies: [],
          supplements: ["iron"],
          primaryCaregiver: "Zhen",
        }),
        { status: 200 },
      );
    },
  });

  assert.deepEqual(calls, [
    {
      url: "/api/babies/baby_123",
      options: {
        method: "PATCH",
        headers: {
          authorization: "Bearer dev-user:user_123",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          timezone: "America/New_York",
        }),
      },
    },
  ]);
  assert.equal(profile.timezone, "America/New_York");
});

test("executeBabyProfileSubmitRequest surfaces route error payloads", async () => {
  await assert.rejects(
    executeBabyProfileSubmitRequest({
      request: {
        method: "PATCH",
        path: "/api/babies/baby_123",
        body: {
          timezone: "UTC",
        },
      },
      auth: { ownerUserId: "user_123" },
      async fetchImpl() {
        return new Response(JSON.stringify({ error: "Baby profile not found" }), {
          status: 404,
        });
      },
    }),
    (error) => {
      assert.ok(error instanceof BabyProfileTransportError);
      assert.equal(error.status, 404);
      assert.equal(error.message, "Baby profile not found");
      assert.deepEqual(error.payload, { error: "Baby profile not found" });
      return true;
    },
  );
});
