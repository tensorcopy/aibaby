import test from "node:test";
import assert from "node:assert/strict";

import {
  createMobileSessionContextValue,
  readMobileSessionBootstrapEnv,
} from "./mobileSession.ts";

test("createMobileSessionContextValue prefers a session token for auth bootstrap", () => {
  const setCurrentBabyId = () => {};

  assert.deepEqual(
    createMobileSessionContextValue(
      {
        ownerUserId: " user_123 ",
        sessionToken: " aibaby-local-session.token ",
        currentBabyId: " baby_123 ",
        apiBaseUrl: " https://example.test ",
      },
      {
        setCurrentBabyId,
      },
    ),
    {
      ownerUserId: "user_123",
      sessionToken: "aibaby-local-session.token",
      currentBabyId: "baby_123",
      apiBaseUrl: "https://example.test",
      auth: {
        authorization: "Bearer aibaby-local-session.token",
      },
      setCurrentBabyId,
    },
  );
});

test("createMobileSessionContextValue omits auth when no owner user id is bootstrapped", () => {
  const value = createMobileSessionContextValue({
    ownerUserId: "   ",
    currentBabyId: " baby_123 ",
  });

  assert.equal(value.ownerUserId, undefined);
  assert.equal(value.currentBabyId, "baby_123");
  assert.equal(value.auth, undefined);
  assert.equal(typeof value.setCurrentBabyId, "function");
});

test("readMobileSessionBootstrapEnv pulls the mobile-safe Expo shell bootstrap values", () => {
  assert.deepEqual(
    readMobileSessionBootstrapEnv({
      EXPO_PUBLIC_AIBABY_OWNER_USER_ID: "user_123",
      EXPO_PUBLIC_AIBABY_SESSION_TOKEN: "aibaby-local-session.token",
      EXPO_PUBLIC_AIBABY_CURRENT_BABY_ID: "baby_123",
      EXPO_PUBLIC_AIBABY_API_BASE_URL: "https://example.test",
    }),
    {
      ownerUserId: "user_123",
      sessionToken: "aibaby-local-session.token",
      currentBabyId: "baby_123",
      apiBaseUrl: "https://example.test",
    },
  );
});
