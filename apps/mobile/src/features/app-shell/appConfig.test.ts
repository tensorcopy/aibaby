import assert from "node:assert/strict";
import test from "node:test";

import {
  createMobileExpoConfig,
  getMobileExpoAppIdentity,
} from "./appConfig.ts";

test("getMobileExpoAppIdentity maps each app environment to a stable app variant", () => {
  assert.deepEqual(getMobileExpoAppIdentity("development"), {
    name: "AIbaby Dev",
    slug: "aibaby-dev",
    scheme: "aibaby-dev",
    iosBundleIdentifier: "com.aibaby.dev",
    androidPackage: "com.aibaby.dev",
  });

  assert.deepEqual(getMobileExpoAppIdentity("staging"), {
    name: "AIbaby Staging",
    slug: "aibaby-staging",
    scheme: "aibaby-staging",
    iosBundleIdentifier: "com.aibaby.staging",
    androidPackage: "com.aibaby.staging",
  });

  assert.deepEqual(getMobileExpoAppIdentity("production"), {
    name: "AIbaby",
    slug: "aibaby",
    scheme: "aibaby",
    iosBundleIdentifier: "com.aibaby.app",
    androidPackage: "com.aibaby.app",
  });
});

test("createMobileExpoConfig wires the environment-specific identity and public extra config", () => {
  assert.deepEqual(
    createMobileExpoConfig({
      EXPO_PUBLIC_AIBABY_ENV: " staging ",
      EXPO_PUBLIC_SUPABASE_URL: "https://supabase.example.co",
      EXPO_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      EXPO_PUBLIC_AIBABY_API_BASE_URL: "https://api.example.test",
      EXPO_PUBLIC_AIBABY_ENABLE_LOCAL_BOOTSTRAP: "false",
      EXPO_PUBLIC_AIBABY_SESSION_TOKEN: "local-token",
    }),
    {
      name: "AIbaby Staging",
      slug: "aibaby-staging",
      scheme: "aibaby-staging",
      version: "0.0.0",
      orientation: "portrait",
      userInterfaceStyle: "light",
      plugins: ["expo-router"],
      experiments: {
        typedRoutes: false,
      },
      ios: {
        bundleIdentifier: "com.aibaby.staging",
      },
      android: {
        package: "com.aibaby.staging",
      },
      extra: {
        supabase: {
          url: "https://supabase.example.co",
          anonKey: "anon-key",
          configured: true,
        },
        aibaby: {
          environment: "staging",
          apiBaseUrl: "https://api.example.test",
          sessionToken: "local-token",
          currentBabyId: "",
          localBootstrapEnabled: false,
        },
      },
    },
  );
});
