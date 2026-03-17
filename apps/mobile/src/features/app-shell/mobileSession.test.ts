import test from "node:test";
import assert from "node:assert/strict";

import {
  createMobileSessionContextValue,
  readMobileSessionBootstrapEnv,
  readMobileSessionSupabaseAuthConfig,
} from "./mobileSession.ts";

test("createMobileSessionContextValue prefers a hydrated Supabase session over the local session token fallback", () => {
  const setCurrentBabyId = () => {};
  const signOut = async () => {};

  assert.deepEqual(
    createMobileSessionContextValue(
      {
        sessionToken: " aibaby-local-session.token ",
        currentBabyId: " baby_123 ",
        apiBaseUrl: " https://example.test ",
        supabaseSession: {
          accessToken: " supabase-access-token ",
          user: {
            id: " user_123 ",
          },
        },
        isLoadingAuth: true,
        hasSupabaseAuthConfig: true,
      },
      {
        setCurrentBabyId,
        signOut,
      },
    ),
    {
      sessionToken: "aibaby-local-session.token",
      currentBabyId: "baby_123",
      apiBaseUrl: "https://example.test",
      auth: {
        authorization: "Bearer supabase-access-token",
        ownerUserId: "user_123",
      },
      authSource: "supabase",
      isLoadingAuth: true,
      hasSupabaseAuthConfig: true,
      setCurrentBabyId,
      signOut,
    },
  );
});

test("createMobileSessionContextValue falls back to the local session token when there is no Supabase session", () => {
  const value = createMobileSessionContextValue({
    sessionToken: " aibaby-local-session.token ",
    currentBabyId: " baby_123 ",
  });

  assert.equal(value.currentBabyId, "baby_123");
  assert.deepEqual(value.auth, {
    authorization: "Bearer aibaby-local-session.token",
  });
  assert.equal(value.authSource, "local-session");
  assert.equal(value.isLoadingAuth, false);
  assert.equal(value.hasSupabaseAuthConfig, false);
  assert.equal(typeof value.setCurrentBabyId, "function");
  assert.equal(typeof value.signOut, "function");
});

test("createMobileSessionContextValue respects the local bootstrap disable flag", () => {
  const value = createMobileSessionContextValue({
    sessionToken: " aibaby-local-session.token ",
    localBootstrapEnabled: false,
  });

  assert.equal(value.auth, undefined);
  assert.equal(value.authSource, "none");
});

test("createMobileSessionContextValue omits auth when neither Supabase nor local session bootstrap exists", () => {
  const value = createMobileSessionContextValue({
    currentBabyId: " baby_123 ",
  });

  assert.equal(value.currentBabyId, "baby_123");
  assert.equal(value.auth, undefined);
  assert.equal(value.authSource, "none");
  assert.equal(value.isLoadingAuth, false);
  assert.equal(value.hasSupabaseAuthConfig, false);
  assert.equal(typeof value.setCurrentBabyId, "function");
  assert.equal(typeof value.signOut, "function");
});

test("readMobileSessionBootstrapEnv pulls the mobile-safe Expo shell bootstrap values", () => {
  assert.deepEqual(
    readMobileSessionBootstrapEnv({
      EXPO_PUBLIC_AIBABY_SESSION_TOKEN: "aibaby-local-session.token",
      EXPO_PUBLIC_AIBABY_CURRENT_BABY_ID: "baby_123",
      EXPO_PUBLIC_AIBABY_API_BASE_URL: "https://example.test",
    }),
    {
      sessionToken: "aibaby-local-session.token",
      currentBabyId: "baby_123",
      apiBaseUrl: "https://example.test",
      localBootstrapEnabled: true,
    },
  );
});

test("readMobileSessionSupabaseAuthConfig pulls the Expo-safe Supabase public config", () => {
  assert.deepEqual(
    readMobileSessionSupabaseAuthConfig({
      EXPO_PUBLIC_SUPABASE_URL: " https://supabase.example.co ",
      EXPO_PUBLIC_SUPABASE_ANON_KEY: " anon-key ",
    }),
    {
      url: "https://supabase.example.co",
      anonKey: "anon-key",
    },
  );

  assert.equal(readMobileSessionSupabaseAuthConfig({}), undefined);
});
