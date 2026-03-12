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
  setCurrentBabyId,
  loadScreenState = loadBabyProfileScreenState,
}: {
  babyId?: string;
  auth?: BabyProfileAuth;
  setCurrentBabyId?: MobileSessionCurrentBabyIdSetter;
  loadScreenState?: typeof loadBabyProfileScreenState;
}): Promise<BabyProfileScreenState> {
  const nextState = await loadScreenState({ babyId, auth });

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
  setCurrentBabyId,
  saveScreenState = saveBabyProfileScreenState,
}: {
  state: BabyProfileScreenReadyState;
  auth?: BabyProfileAuth;
  setCurrentBabyId?: MobileSessionCurrentBabyIdSetter;
  saveScreenState?: typeof saveBabyProfileScreenState;
}): Promise<BabyProfileScreenReadyState> {
  const nextState = await saveScreenState({ state, auth });

  if (nextState.babyId) {
    setCurrentBabyId?.(nextState.babyId);
  }

  return nextState;
}
