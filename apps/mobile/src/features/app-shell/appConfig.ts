import type { ExpoConfig } from "expo/config";

import {
  createMobileExpoExtra,
  normalizeMobileAppEnvironment,
  type MobileAppEnvironment,
} from "./publicConfig.ts";

export type MobileExpoAppIdentity = {
  name: string;
  slug: string;
  scheme: string;
  iosBundleIdentifier: string;
  androidPackage: string;
};

export function createMobileExpoConfig(
  env: Record<string, string | undefined> = process.env,
): ExpoConfig {
  const appEnvironment = normalizeMobileAppEnvironment(env.EXPO_PUBLIC_AIBABY_ENV);
  const identity = getMobileExpoAppIdentity(appEnvironment);

  return {
    name: identity.name,
    slug: identity.slug,
    scheme: identity.scheme,
    version: "0.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    plugins: ["expo-router"],
    experiments: {
      typedRoutes: false,
    },
    ios: {
      bundleIdentifier: identity.iosBundleIdentifier,
    },
    android: {
      package: identity.androidPackage,
    },
    extra: createMobileExpoExtra(env),
  };
}

export function getMobileExpoAppIdentity(
  appEnvironment: MobileAppEnvironment,
): MobileExpoAppIdentity {
  switch (appEnvironment) {
    case "staging":
      return {
        name: "AIbaby Staging",
        slug: "aibaby-staging",
        scheme: "aibaby-staging",
        iosBundleIdentifier: "com.aibaby.staging",
        androidPackage: "com.aibaby.staging",
      };
    case "production":
      return {
        name: "AIbaby",
        slug: "aibaby",
        scheme: "aibaby",
        iosBundleIdentifier: "com.aibaby.app",
        androidPackage: "com.aibaby.app",
      };
    default:
      return {
        name: "AIbaby Dev",
        slug: "aibaby-dev",
        scheme: "aibaby-dev",
        iosBundleIdentifier: "com.aibaby.dev",
        androidPackage: "com.aibaby.dev",
      };
  }
}
