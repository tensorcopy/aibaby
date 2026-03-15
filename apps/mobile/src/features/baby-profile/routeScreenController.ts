import type { MobileSessionCurrentBabyIdSetter } from "../app-shell/mobileSession.ts";
import {
  createLoadingBabyProfileScreenState,
  loadBabyProfileScreenState,
  saveBabyProfileScreenState,
  type BabyProfileScreenReadyState,
  type BabyProfileScreenState,
} from "./screenShell.ts";
import type { BabyProfileAuth } from "./transport.ts";

export function createBabyProfileRouteScreenLoadState(
  babyId?: string,
): BabyProfileScreenState {
  return createLoadingBabyProfileScreenState(babyId);
}

export async function loadBabyProfileRouteScreenState({
  babyId,
  auth,
  apiBaseUrl,
  defaultTimezone,
  setCurrentBabyId,
  loadScreenState = loadBabyProfileScreenState,
}: {
  babyId?: string;
  auth?: BabyProfileAuth;
  apiBaseUrl?: string;
  defaultTimezone?: string;
  setCurrentBabyId?: MobileSessionCurrentBabyIdSetter;
  loadScreenState?: typeof loadBabyProfileScreenState;
}): Promise<BabyProfileScreenState> {
  const nextState = await loadScreenState({
    babyId,
    auth,
    apiBaseUrl,
    defaultTimezone,
  });

  if (nextState.status === "ready" && nextState.babyId) {
    setCurrentBabyId?.(nextState.babyId);
  }

  return nextState;
}

export function createBabyProfileRouteScreenSavingState(
  state: BabyProfileScreenReadyState,
): BabyProfileScreenReadyState {
  return {
    ...state,
    submission: null,
    requestErrorMessage: null,
  };
}

export async function saveBabyProfileRouteScreenState({
  state,
  auth,
  apiBaseUrl,
  setCurrentBabyId,
  saveScreenState = saveBabyProfileScreenState,
}: {
  state: BabyProfileScreenReadyState;
  auth?: BabyProfileAuth;
  apiBaseUrl?: string;
  setCurrentBabyId?: MobileSessionCurrentBabyIdSetter;
  saveScreenState?: typeof saveBabyProfileScreenState;
}): Promise<BabyProfileScreenReadyState> {
  const nextState = await saveScreenState({ state, auth, apiBaseUrl });

  if (nextState.babyId) {
    setCurrentBabyId?.(nextState.babyId);
  }

  return nextState;
}
