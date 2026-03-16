export type MobilePublicConfig = {
  appEnv: MobileAppEnvironment;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  apiBaseUrl?: string;
  sessionToken?: string;
  currentBabyId?: string;
  localBootstrapEnabled: boolean;
};

export type MobileAppEnvironment = "development" | "staging" | "production";

export type MobileExpoExtraConfig = {
  supabase: {
    url: string;
    anonKey: string;
    configured: boolean;
  };
  aibaby: {
    environment: MobileAppEnvironment;
    apiBaseUrl: string;
    sessionToken: string;
    currentBabyId: string;
    localBootstrapEnabled: boolean;
  };
};

export function readMobilePublicConfigEnv(
  env: Record<string, string | undefined> = process.env,
): MobilePublicConfig {
  const appEnv = normalizeMobileAppEnvironment(env.EXPO_PUBLIC_AIBABY_ENV);
  const sessionToken = normalizeOptionalString(env.EXPO_PUBLIC_AIBABY_SESSION_TOKEN);

  return {
    appEnv,
    supabaseUrl: normalizeOptionalString(env.EXPO_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: normalizeOptionalString(env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
    apiBaseUrl: normalizeOptionalString(env.EXPO_PUBLIC_AIBABY_API_BASE_URL),
    sessionToken,
    currentBabyId: normalizeOptionalString(env.EXPO_PUBLIC_AIBABY_CURRENT_BABY_ID),
    localBootstrapEnabled:
      normalizeBooleanFlag(env.EXPO_PUBLIC_AIBABY_ENABLE_LOCAL_BOOTSTRAP) ??
      (appEnv === "development" && Boolean(sessionToken)),
  };
}

export function createMobileExpoExtra(
  env: Record<string, string | undefined> = process.env,
): MobileExpoExtraConfig {
  const config = readMobilePublicConfigEnv(env);

  return {
    supabase: {
      url: config.supabaseUrl ?? "",
      anonKey: config.supabaseAnonKey ?? "",
      configured: Boolean(config.supabaseUrl && config.supabaseAnonKey),
    },
    aibaby: {
      environment: config.appEnv,
      apiBaseUrl: config.apiBaseUrl ?? "",
      sessionToken: config.sessionToken ?? "",
      currentBabyId: config.currentBabyId ?? "",
      localBootstrapEnabled: config.localBootstrapEnabled,
    },
  };
}

export function normalizeMobileAppEnvironment(value?: string | null): MobileAppEnvironment {
  switch (normalizeOptionalString(value)) {
    case "staging":
      return "staging";
    case "production":
      return "production";
    default:
      return "development";
  }
}

function normalizeBooleanFlag(value?: string | null): boolean | undefined {
  const normalized = normalizeOptionalString(value)?.toLowerCase();

  if (!normalized) {
    return undefined;
  }

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return undefined;
}

function normalizeOptionalString(value?: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}
