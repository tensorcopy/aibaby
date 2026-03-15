import assert from "node:assert/strict";
import test from "node:test";

import { createMobileExpoExtra, readMobilePublicConfigEnv } from "./publicConfig.ts";

test("readMobilePublicConfigEnv trims the supported Expo public env values", () => {
  assert.deepEqual(
    readMobilePublicConfigEnv({
      EXPO_PUBLIC_SUPABASE_URL: " https://supabase.example.co ",
      EXPO_PUBLIC_SUPABASE_ANON_KEY: " anon-key ",
      EXPO_PUBLIC_AIBABY_API_BASE_URL: " https://api.example.test ",
      EXPO_PUBLIC_AIBABY_SESSION_TOKEN: " aibaby-local-session.token ",
      EXPO_PUBLIC_AIBABY_CURRENT_BABY_ID: " baby_123 ",
    }),
    {
      supabaseUrl: "https://supabase.example.co",
      supabaseAnonKey: "anon-key",
      apiBaseUrl: "https://api.example.test",
      sessionToken: "aibaby-local-session.token",
      currentBabyId: "baby_123",
    },
  );
});

test("createMobileExpoExtra reports Supabase readiness and local bootstrap status", () => {
  assert.deepEqual(
    createMobileExpoExtra({
      EXPO_PUBLIC_SUPABASE_URL: "https://supabase.example.co",
      EXPO_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      EXPO_PUBLIC_AIBABY_API_BASE_URL: "https://api.example.test",
      EXPO_PUBLIC_AIBABY_SESSION_TOKEN: "aibaby-local-session.token",
      EXPO_PUBLIC_AIBABY_CURRENT_BABY_ID: "baby_123",
    }),
    {
      supabase: {
        url: "https://supabase.example.co",
        anonKey: "anon-key",
        configured: true,
      },
      aibaby: {
        apiBaseUrl: "https://api.example.test",
        sessionToken: "aibaby-local-session.token",
        currentBabyId: "baby_123",
        localBootstrapEnabled: true,
      },
    },
  );
});

test("createMobileExpoExtra leaves optional values as empty strings when public config is absent", () => {
  assert.deepEqual(createMobileExpoExtra({}), {
    supabase: {
      url: "",
      anonKey: "",
      configured: false,
    },
    aibaby: {
      apiBaseUrl: "",
      sessionToken: "",
      currentBabyId: "",
      localBootstrapEnabled: false,
    },
  });
});
