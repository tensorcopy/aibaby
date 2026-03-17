import type { BabyProfileAuth } from "../baby-profile/transport.ts";
import { readMobilePublicConfigEnv, type MobilePublicConfig } from "./publicConfig.ts";
import {
  createSupabaseSessionAuth,
  readMobileSupabaseAuthConfig,
  type MobileSupabaseAuthConfig,
  type MobileSupabaseSession,
} from "./supabaseSession.ts";

export type MobileSessionBootstrapInput = Pick<
  MobilePublicConfig,
  "sessionToken" | "currentBabyId" | "apiBaseUrl" | "localBootstrapEnabled"
>;

export type MobileSessionCurrentBabyIdSetter = (babyId?: string) => void;

export type MobileSessionContextValue = {
  sessionToken?: string;
  currentBabyId?: string;
  apiBaseUrl?: string;
  auth?: BabyProfileAuth;
  authSource: "supabase" | "local-session" | "none";
  isLoadingAuth: boolean;
  hasSupabaseAuthConfig: boolean;
  setCurrentBabyId: MobileSessionCurrentBabyIdSetter;
  signOut: () => Promise<void>;
};

export function createMobileSessionContextValue(
  input: MobileSessionBootstrapInput & {
    supabaseSession?: MobileSupabaseSession | null;
    isLoadingAuth?: boolean;
    hasSupabaseAuthConfig?: boolean;
  } = {},
  options: {
    setCurrentBabyId?: MobileSessionCurrentBabyIdSetter;
    signOut?: () => Promise<void>;
  } = {},
): MobileSessionContextValue {
  const sessionToken = normalizeOptionalString(input.sessionToken);
  const currentBabyId = normalizeOptionalString(input.currentBabyId);
  const apiBaseUrl = normalizeOptionalString(input.apiBaseUrl);
  const supabaseAuth = createSupabaseSessionAuth(input.supabaseSession);
  const localSessionAuth =
    input.localBootstrapEnabled !== false && sessionToken
      ? ({ authorization: `Bearer ${sessionToken}` } satisfies BabyProfileAuth)
      : undefined;

  return {
    sessionToken,
    currentBabyId,
    apiBaseUrl,
    auth: supabaseAuth ?? localSessionAuth,
    authSource: supabaseAuth ? "supabase" : localSessionAuth ? "local-session" : "none",
    isLoadingAuth: input.isLoadingAuth ?? false,
    hasSupabaseAuthConfig: input.hasSupabaseAuthConfig ?? false,
    setCurrentBabyId: options.setCurrentBabyId ?? (() => {}),
    signOut: options.signOut ?? (async () => {}),
  };
}

export function readMobileSessionBootstrapEnv(
  env: Record<string, string | undefined> = process.env,
): MobileSessionBootstrapInput {
  const config = readMobilePublicConfigEnv(env);

  return {
    sessionToken: config.sessionToken,
    currentBabyId: config.currentBabyId,
    apiBaseUrl: config.apiBaseUrl,
    localBootstrapEnabled: config.localBootstrapEnabled,
  };
}

export function readMobileSessionSupabaseAuthConfig(
  env: Record<string, string | undefined> = process.env,
): MobileSupabaseAuthConfig | undefined {
  return readMobileSupabaseAuthConfig(env);
}

function normalizeOptionalString(value?: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}
