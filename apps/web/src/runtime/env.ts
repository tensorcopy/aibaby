export type WebRuntimeEnv = {
  databaseUrl?: string;
  directUrl?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseServiceRoleKey?: string;
  triggerSecretKey?: string;
};

export type WebRuntimeStatus = {
  mode: "local-dev" | "hosted-ready";
  databaseConfigured: boolean;
  supabasePublicConfigured: boolean;
  supabaseServerConfigured: boolean;
  storageConfigured: boolean;
  jobsConfigured: boolean;
};

export function readWebRuntimeEnv(
  env: Record<string, string | undefined> = process.env,
): WebRuntimeEnv {
  return {
    databaseUrl: normalizeOptionalString(env.DATABASE_URL),
    directUrl: normalizeOptionalString(env.DIRECT_URL),
    supabaseUrl: normalizeOptionalString(env.SUPABASE_URL),
    supabaseAnonKey: normalizeOptionalString(env.SUPABASE_ANON_KEY),
    supabaseServiceRoleKey: normalizeOptionalString(env.SUPABASE_SERVICE_ROLE_KEY),
    triggerSecretKey: normalizeOptionalString(env.TRIGGER_SECRET_KEY),
  };
}

export function getWebRuntimeStatus(config: WebRuntimeEnv): WebRuntimeStatus {
  const databaseConfigured = Boolean(config.databaseUrl && config.directUrl);
  const supabasePublicConfigured = Boolean(config.supabaseUrl && config.supabaseAnonKey);
  const supabaseServerConfigured = Boolean(
    supabasePublicConfigured && config.supabaseServiceRoleKey,
  );

  return {
    mode:
      databaseConfigured && supabaseServerConfigured ? "hosted-ready" : "local-dev",
    databaseConfigured,
    supabasePublicConfigured,
    supabaseServerConfigured,
    storageConfigured: supabaseServerConfigured,
    jobsConfigured: Boolean(config.triggerSecretKey),
  };
}

function normalizeOptionalString(value?: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}
