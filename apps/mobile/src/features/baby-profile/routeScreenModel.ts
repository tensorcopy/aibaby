import type { BabyProfileScreenState } from "./screenShell.ts";
import {
  createBabyProfileRouteModel,
  type BabyProfileRouteModel,
} from "./routeModel.ts";

export type BabyProfileRouteScreenModel =
  | {
      kind: "loading";
      title: "Baby profile";
      loadingMessage: "Loading baby profile…" | "Retrying baby profile…";
    }
  | {
      kind: "error";
      title: "Baby profile";
      subtitle: "We couldn't load this profile right now. Try again to keep editing.";
      errorMessage: string;
      retryLabel: "Retry" | "Retrying…";
      retryDisabled: boolean;
    }
  | {
      kind: "ready";
      route: BabyProfileRouteModel;
      requestErrorMessage: string | null;
      submitLabel: string;
      inputsDisabled: boolean;
      isSaving: boolean;
    };

export function createBabyProfileRouteScreenModel({
  state,
  isSaving,
  isRetryingLoad,
}: {
  state: BabyProfileScreenState;
  isSaving: boolean;
  isRetryingLoad: boolean;
}): BabyProfileRouteScreenModel {
  if (state.status === "loading") {
    return {
      kind: "loading",
      title: "Baby profile",
      loadingMessage: isRetryingLoad ? "Retrying baby profile…" : "Loading baby profile…",
    };
  }

  if (state.status === "error") {
    return {
      kind: "error",
      title: "Baby profile",
      subtitle: "We couldn't load this profile right now. Try again to keep editing.",
      errorMessage: state.message,
      retryLabel: isRetryingLoad ? "Retrying…" : "Retry",
      retryDisabled: isRetryingLoad,
    };
  }

  const route = createBabyProfileRouteModel(state);

  return {
    kind: "ready",
    route,
    requestErrorMessage: isSaving ? null : state.requestErrorMessage,
    submitLabel: isSaving ? "Saving…" : route.submitLabel,
    inputsDisabled: isSaving,
    isSaving,
  };
}
