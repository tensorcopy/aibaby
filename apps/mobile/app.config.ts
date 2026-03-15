import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "AIbaby",
  slug: "aibaby",
  scheme: "aibaby",
  version: "0.0.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  plugins: ["expo-router"],
  experiments: {
    typedRoutes: false,
  },
  extra: {
    aibaby: {
      apiBaseUrl: process.env.EXPO_PUBLIC_AIBABY_API_BASE_URL ?? null,
      sessionToken: process.env.EXPO_PUBLIC_AIBABY_SESSION_TOKEN ?? null,
      currentBabyId: process.env.EXPO_PUBLIC_AIBABY_CURRENT_BABY_ID ?? null,
    },
  },
};

export default config;
