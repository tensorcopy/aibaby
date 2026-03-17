import assert from "node:assert/strict";
import test from "node:test";

import {
  getWebRuntimeStatus,
  normalizeWebRuntimeEnvironment,
  readWebRuntimeEnv,
} from "./env.ts";

test("readWebRuntimeEnv trims the server env contract", () => {
  assert.deepEqual(
    readWebRuntimeEnv({
      AIBABY_ENV: " staging ",
      AIBABY_WEB_URL: " https://api.example.test/ ",
      DATABASE_URL: " postgres://app ",
      DIRECT_URL: " postgres://direct ",
      SUPABASE_URL: " https://supabase.example.co ",
      SUPABASE_ANON_KEY: " anon-key ",
      SUPABASE_SERVICE_ROLE_KEY: " service-role ",
      SUPABASE_STORAGE_BUCKET_MEAL_MEDIA: " meal-media ",
      SUPABASE_STORAGE_BUCKET_DERIVED_MEDIA: " derived-media ",
      TRIGGER_SECRET_KEY: " trigger-secret ",
    }),
    {
      environment: "staging",
      webUrl: "https://api.example.test/",
      databaseUrl: "postgres://app",
      directUrl: "postgres://direct",
      supabaseUrl: "https://supabase.example.co",
      supabaseAnonKey: "anon-key",
      supabaseServiceRoleKey: "service-role",
      supabaseMealMediaBucket: "meal-media",
      supabaseDerivedMediaBucket: "derived-media",
      triggerSecretKey: "trigger-secret",
    },
  );
});

test("getWebRuntimeStatus reports a hosted-ready runtime when all server config is present", () => {
  assert.deepEqual(
    getWebRuntimeStatus({
      environment: "staging",
      webUrl: "https://api.example.test",
      databaseUrl: "postgres://app",
      directUrl: "postgres://direct",
      supabaseUrl: "https://supabase.example.co",
      supabaseAnonKey: "anon-key",
      supabaseServiceRoleKey: "service-role",
      supabaseMealMediaBucket: "meal-media",
      supabaseDerivedMediaBucket: "derived-media",
      triggerSecretKey: "trigger-secret",
    }),
    {
      environment: "staging",
      mode: "hosted-ready",
      appUrlConfigured: true,
      databaseConfigured: true,
      supabasePublicConfigured: true,
      supabaseServerConfigured: true,
      storageConfigured: true,
      derivedStorageConfigured: true,
      jobsConfigured: true,
      missingHostedEnv: [],
    },
  );
});

test("getWebRuntimeStatus falls back to local-dev when hosted config is incomplete", () => {
  assert.deepEqual(getWebRuntimeStatus({ environment: "development" }), {
    environment: "development",
    mode: "local-dev",
    appUrlConfigured: false,
    databaseConfigured: false,
    supabasePublicConfigured: false,
    supabaseServerConfigured: false,
    storageConfigured: false,
    derivedStorageConfigured: false,
    jobsConfigured: false,
    missingHostedEnv: [
      "AIBABY_WEB_URL",
      "DATABASE_URL",
      "DIRECT_URL",
      "SUPABASE_URL",
      "SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "SUPABASE_STORAGE_BUCKET_MEAL_MEDIA",
    ],
  });
});

test("normalizeWebRuntimeEnvironment falls back to development for unknown values", () => {
  assert.equal(normalizeWebRuntimeEnvironment(" production "), "production");
  assert.equal(normalizeWebRuntimeEnvironment("unknown"), "development");
});
