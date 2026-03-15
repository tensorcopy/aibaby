import type { BabyProfileAuth } from "../baby-profile/transport.ts";
import { readMobilePublicConfigEnv, type MobilePublicConfig } from "./publicConfig.ts";

export type MobileSessionBootstrapInput = Pick<
  MobilePublicConfig,
  "sessionToken" | "currentBabyId" | "apiBaseUrl"
>;

export type MobileSessionCurrentBabyIdSetter = (babyId?: string) => void;

export type MobileSessionContextValue = {
  sessionToken?: string;
  currentBabyId?: string;
  apiBaseUrl?: string;
  auth?: BabyProfileAuth;
  setCurrentBabyId: MobileSessionCurrentBabyIdSetter;
};

export function createMobileSessionContextValue(
  input: MobileSessionBootstrapInput = {},
  options: {
    setCurrentBabyId?: MobileSessionCurrentBabyIdSetter;
  } = {},
): MobileSessionContextValue {
  const sessionToken = normalizeOptionalString(input.sessionToken);
  const currentBabyId = normalizeOptionalString(input.currentBabyId);
  const apiBaseUrl = normalizeOptionalString(input.apiBaseUrl);
  const authorization = sessionToken ? `Bearer ${sessionToken}` : undefined;

  return {
    sessionToken,
    currentBabyId,
    apiBaseUrl,
    auth: authorization ? { authorization } : undefined,
    setCurrentBabyId: options.setCurrentBabyId ?? (() => {}),
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
  };
}

function normalizeOptionalString(value?: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}
