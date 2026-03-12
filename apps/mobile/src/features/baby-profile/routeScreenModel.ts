import type { BabyProfileScreenState } from "./screenShell.ts";
import {
  createBabyProfileRouteModel,
  type BabyProfileRouteModel,
} from "./routeModel.ts";

export type BabyProfileRouteScreenModel =
  | {
      kind: "loading";
      title: "Baby profile";
      loadingMessage: "Loading baby profile…";
    }
  | {
      kind: "error";
      title: "Baby profile";
      subtitle: "We couldn't load this profile right now. Try again to keep editing.";
      errorMessage: string;
      retryLabel: "Retry";
    }
  | {
      kind: "ready";
      route: BabyProfileRouteModel;
      requestErrorMessage: string | null;
      submitLabel: string;
      isSaving: boolean;
    };

export function createBabyProfileRouteScreenModel({
  state,
  isSaving,
}: {
  state: BabyProfileScreenState;
  isSaving: boolean;
}): BabyProfileRouteScreenModel {
  if (state.status === "loading") {
    return {
      kind: "loading",
      title: "Baby profile",
      loadingMessage: "Loading baby profile…",
    };
  }

  if (state.status === "error") {
    return {
      kind: "error",
      title: "Baby profile",
      subtitle: "We couldn't load this profile right now. Try again to keep editing.",
      errorMessage: state.message,
      retryLabel: "Retry",
    };
  }

  const route = createBabyProfileRouteModel(state);

  return {
    kind: "ready",
    route,
    requestErrorMessage: state.requestErrorMessage,
    submitLabel: isSaving ? "Saving…" : route.submitLabel,
    isSaving,
  };
}
