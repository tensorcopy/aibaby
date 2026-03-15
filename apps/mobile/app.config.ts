import type { ExpoConfig } from "expo/config";
import { createMobileExpoExtra } from "./src/features/app-shell/publicConfig.ts";

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
  extra: createMobileExpoExtra(),
};

export default config;
