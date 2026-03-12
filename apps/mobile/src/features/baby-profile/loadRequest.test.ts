import test from "node:test";
import assert from "node:assert/strict";

import { toBabyProfileLoadRequest } from "./loadRequest.ts";

test("toBabyProfileLoadRequest targets the current owner-scoped profile when no baby id is provided", () => {
  assert.deepEqual(toBabyProfileLoadRequest(), {
    method: "GET",
    path: "/api/babies",
    target: "current",
  });

  assert.deepEqual(toBabyProfileLoadRequest("   "), {
    method: "GET",
    path: "/api/babies",
    target: "current",
  });
});

test("toBabyProfileLoadRequest targets an explicit baby resource when a baby id is provided", () => {
  assert.deepEqual(toBabyProfileLoadRequest(" baby_123 "), {
    method: "GET",
    path: "/api/babies/baby_123",
    target: "explicit",
    babyId: "baby_123",
  });
});

test("toBabyProfileLoadRequest URL-encodes explicit baby ids", () => {
  assert.deepEqual(toBabyProfileLoadRequest("baby 123/alpha"), {
    method: "GET",
    path: "/api/babies/baby%20123%2Falpha",
    target: "explicit",
    babyId: "baby 123/alpha",
  });
});
