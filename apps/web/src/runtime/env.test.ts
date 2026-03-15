import assert from "node:assert/strict";
import test from "node:test";

import { getWebRuntimeStatus, readWebRuntimeEnv } from "./env.ts";

test("readWebRuntimeEnv trims the server env contract", () => {
  assert.deepEqual(
    readWebRuntimeEnv({
      DATABASE_URL: " postgres://app ",
      DIRECT_URL: " postgres://direct ",
      SUPABASE_URL: " https://supabase.example.co ",
      SUPABASE_ANON_KEY: " anon-key ",
      SUPABASE_SERVICE_ROLE_KEY: " service-role ",
      TRIGGER_SECRET_KEY: " trigger-secret ",
    }),
    {
      databaseUrl: "postgres://app",
      directUrl: "postgres://direct",
      supabaseUrl: "https://supabase.example.co",
      supabaseAnonKey: "anon-key",
      supabaseServiceRoleKey: "service-role",
      triggerSecretKey: "trigger-secret",
    },
  );
});

test("getWebRuntimeStatus reports a hosted-ready runtime when all server config is present", () => {
  assert.deepEqual(
    getWebRuntimeStatus({
      databaseUrl: "postgres://app",
      directUrl: "postgres://direct",
      supabaseUrl: "https://supabase.example.co",
      supabaseAnonKey: "anon-key",
      supabaseServiceRoleKey: "service-role",
      triggerSecretKey: "trigger-secret",
    }),
    {
      mode: "hosted-ready",
      databaseConfigured: true,
      supabasePublicConfigured: true,
      supabaseServerConfigured: true,
      storageConfigured: true,
      jobsConfigured: true,
    },
  );
});

test("getWebRuntimeStatus falls back to local-dev when hosted config is incomplete", () => {
  assert.deepEqual(getWebRuntimeStatus({}), {
    mode: "local-dev",
    databaseConfigured: false,
    supabasePublicConfigured: false,
    supabaseServerConfigured: false,
    storageConfigured: false,
    jobsConfigured: false,
  });
});
