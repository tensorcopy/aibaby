export type MobilePublicConfig = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  apiBaseUrl?: string;
  sessionToken?: string;
  currentBabyId?: string;
};

export type MobileExpoExtraConfig = {
  supabase: {
    url: string;
    anonKey: string;
    configured: boolean;
  };
  aibaby: {
    apiBaseUrl: string;
    sessionToken: string;
    currentBabyId: string;
    localBootstrapEnabled: boolean;
  };
};

export function readMobilePublicConfigEnv(
  env: Record<string, string | undefined> = process.env,
): MobilePublicConfig {
  return {
    supabaseUrl: normalizeOptionalString(env.EXPO_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: normalizeOptionalString(env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
    apiBaseUrl: normalizeOptionalString(env.EXPO_PUBLIC_AIBABY_API_BASE_URL),
    sessionToken: normalizeOptionalString(env.EXPO_PUBLIC_AIBABY_SESSION_TOKEN),
    currentBabyId: normalizeOptionalString(env.EXPO_PUBLIC_AIBABY_CURRENT_BABY_ID),
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
      apiBaseUrl: config.apiBaseUrl ?? "",
      sessionToken: config.sessionToken ?? "",
      currentBabyId: config.currentBabyId ?? "",
      localBootstrapEnabled: Boolean(config.sessionToken),
    },
  };
}

function normalizeOptionalString(value?: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}
