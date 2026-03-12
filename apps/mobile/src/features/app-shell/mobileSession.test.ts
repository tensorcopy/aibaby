import test from "node:test";
import assert from "node:assert/strict";

import {
  createMobileSessionContextValue,
  readMobileSessionBootstrapEnv,
} from "./mobileSession.ts";

test("createMobileSessionContextValue normalizes owner-scoped bootstrap fields", () => {
  assert.deepEqual(
    createMobileSessionContextValue({
      ownerUserId: " user_123 ",
      currentBabyId: " baby_123 ",
    }),
    {
      ownerUserId: "user_123",
      currentBabyId: "baby_123",
      auth: {
        ownerUserId: "user_123",
      },
    },
  );
});

test("createMobileSessionContextValue omits auth when no owner user id is bootstrapped", () => {
  assert.deepEqual(
    createMobileSessionContextValue({
      ownerUserId: "   ",
      currentBabyId: " baby_123 ",
    }),
    {
      ownerUserId: undefined,
      currentBabyId: "baby_123",
      auth: undefined,
    },
  );
});

test("readMobileSessionBootstrapEnv pulls the mobile-safe Expo shell bootstrap values", () => {
  assert.deepEqual(
    readMobileSessionBootstrapEnv({
      EXPO_PUBLIC_AIBABY_OWNER_USER_ID: "user_123",
      EXPO_PUBLIC_AIBABY_CURRENT_BABY_ID: "baby_123",
    }),
    {
      ownerUserId: "user_123",
      currentBabyId: "baby_123",
    },
  );
});
