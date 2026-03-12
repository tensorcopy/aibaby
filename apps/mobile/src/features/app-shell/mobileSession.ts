import type { BabyProfileAuth } from "../baby-profile/transport.ts";

export type MobileSessionBootstrapInput = {
  ownerUserId?: string | null;
  currentBabyId?: string | null;
};

export type MobileSessionContextValue = {
  ownerUserId?: string;
  currentBabyId?: string;
  auth?: BabyProfileAuth;
};

export function createMobileSessionContextValue(
  input: MobileSessionBootstrapInput = {},
): MobileSessionContextValue {
  const ownerUserId = normalizeOptionalString(input.ownerUserId);
  const currentBabyId = normalizeOptionalString(input.currentBabyId);

  return {
    ownerUserId,
    currentBabyId,
    auth: ownerUserId ? { ownerUserId } : undefined,
  };
}

export function readMobileSessionBootstrapEnv(
  env: Record<string, string | undefined> = process.env,
): MobileSessionBootstrapInput {
  return {
    ownerUserId: env.EXPO_PUBLIC_AIBABY_OWNER_USER_ID,
    currentBabyId: env.EXPO_PUBLIC_AIBABY_CURRENT_BABY_ID,
  };
}

function normalizeOptionalString(value?: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}
