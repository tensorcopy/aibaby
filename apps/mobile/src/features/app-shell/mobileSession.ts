import type { BabyProfileAuth } from "../baby-profile/transport.ts";

export type MobileSessionBootstrapInput = {
  ownerUserId?: string | null;
  currentBabyId?: string | null;
  apiBaseUrl?: string | null;
};

export type MobileSessionCurrentBabyIdSetter = (babyId?: string) => void;

export type MobileSessionContextValue = {
  ownerUserId?: string;
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
  const ownerUserId = normalizeOptionalString(input.ownerUserId);
  const currentBabyId = normalizeOptionalString(input.currentBabyId);
  const apiBaseUrl = normalizeOptionalString(input.apiBaseUrl);

  return {
    ownerUserId,
    currentBabyId,
    apiBaseUrl,
    auth: ownerUserId ? { ownerUserId } : undefined,
    setCurrentBabyId: options.setCurrentBabyId ?? (() => {}),
  };
}

export function readMobileSessionBootstrapEnv(
  env: Record<string, string | undefined> = process.env,
): MobileSessionBootstrapInput {
  return {
    ownerUserId: env.EXPO_PUBLIC_AIBABY_OWNER_USER_ID,
    currentBabyId: env.EXPO_PUBLIC_AIBABY_CURRENT_BABY_ID,
    apiBaseUrl: env.EXPO_PUBLIC_AIBABY_API_BASE_URL,
  };
}

function normalizeOptionalString(value?: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}
