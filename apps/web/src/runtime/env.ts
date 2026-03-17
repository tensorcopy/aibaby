export type WebRuntimeEnv = {
  environment: WebRuntimeEnvironment;
  webUrl?: string;
  databaseUrl?: string;
  directUrl?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseServiceRoleKey?: string;
  supabaseMealMediaBucket?: string;
  supabaseDerivedMediaBucket?: string;
  triggerSecretKey?: string;
};

export type WebRuntimeEnvironment = "development" | "staging" | "production";

export type WebRuntimeStatus = {
  environment: WebRuntimeEnvironment;
  mode: "local-dev" | "hosted-ready";
  appUrlConfigured: boolean;
  databaseConfigured: boolean;
  supabasePublicConfigured: boolean;
  supabaseServerConfigured: boolean;
  storageConfigured: boolean;
  derivedStorageConfigured: boolean;
  jobsConfigured: boolean;
  missingHostedEnv: string[];
};

export function readWebRuntimeEnv(
  env: Record<string, string | undefined> = process.env,
): WebRuntimeEnv {
  return {
    environment: normalizeWebRuntimeEnvironment(env.AIBABY_ENV),
    webUrl: normalizeOptionalString(env.AIBABY_WEB_URL),
    databaseUrl: normalizeOptionalString(env.DATABASE_URL),
    directUrl: normalizeOptionalString(env.DIRECT_URL),
    supabaseUrl: normalizeOptionalString(env.SUPABASE_URL),
    supabaseAnonKey: normalizeOptionalString(env.SUPABASE_ANON_KEY),
    supabaseServiceRoleKey: normalizeOptionalString(env.SUPABASE_SERVICE_ROLE_KEY),
    supabaseMealMediaBucket: normalizeOptionalString(
      env.SUPABASE_STORAGE_BUCKET_MEAL_MEDIA,
    ),
    supabaseDerivedMediaBucket: normalizeOptionalString(
      env.SUPABASE_STORAGE_BUCKET_DERIVED_MEDIA,
    ),
    triggerSecretKey: normalizeOptionalString(env.TRIGGER_SECRET_KEY),
  };
}

export function getWebRuntimeStatus(config: WebRuntimeEnv): WebRuntimeStatus {
  const appUrlConfigured = Boolean(config.webUrl);
  const databaseConfigured = Boolean(config.databaseUrl && config.directUrl);
  const supabasePublicConfigured = Boolean(config.supabaseUrl && config.supabaseAnonKey);
  const supabaseServerConfigured = Boolean(
    supabasePublicConfigured && config.supabaseServiceRoleKey,
  );
  const storageConfigured = Boolean(
    supabaseServerConfigured && config.supabaseMealMediaBucket,
  );
  const derivedStorageConfigured = Boolean(
    supabaseServerConfigured && config.supabaseDerivedMediaBucket,
  );
  const missingHostedEnv = getMissingHostedEnv(config);

  return {
    environment: config.environment,
    mode:
      appUrlConfigured && databaseConfigured && storageConfigured
        ? "hosted-ready"
        : "local-dev",
    appUrlConfigured,
    databaseConfigured,
    supabasePublicConfigured,
    supabaseServerConfigured,
    storageConfigured,
    derivedStorageConfigured,
    jobsConfigured: Boolean(config.triggerSecretKey),
    missingHostedEnv,
  };
}

export function normalizeWebRuntimeEnvironment(
  value?: string | null,
): WebRuntimeEnvironment {
  switch (normalizeOptionalString(value)) {
    case "staging":
      return "staging";
    case "production":
      return "production";
    default:
      return "development";
  }
}

function getMissingHostedEnv(config: WebRuntimeEnv): string[] {
  const missing: string[] = [];

  if (!config.webUrl) {
    missing.push("AIBABY_WEB_URL");
  }

  if (!config.databaseUrl) {
    missing.push("DATABASE_URL");
  }

  if (!config.directUrl) {
    missing.push("DIRECT_URL");
  }

  if (!config.supabaseUrl) {
    missing.push("SUPABASE_URL");
  }

  if (!config.supabaseAnonKey) {
    missing.push("SUPABASE_ANON_KEY");
  }

  if (!config.supabaseServiceRoleKey) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }

  if (!config.supabaseMealMediaBucket) {
    missing.push("SUPABASE_STORAGE_BUCKET_MEAL_MEDIA");
  }

  return missing;
}

function normalizeOptionalString(value?: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}
