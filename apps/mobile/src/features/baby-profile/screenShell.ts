import type {
  BabyProfileFormInput,
  BabyProfilePayload,
} from "@aibaby/ui";

import {
  createBabyProfileCreateEditState,
  selectBabyProfileCreateEditAgeSummary,
  submitBabyProfileCreateEditState,
  updateBabyProfileField,
  type BabyProfileCreateEditState,
} from "./createEditFlow.ts";
import {
  toBabyProfileLoadRequest,
  type BabyProfileLoadRequest,
} from "./loadRequest.ts";
import {
  toBabyProfileSubmitRequest,
  type BabyProfileSubmitRequest,
} from "./submitRequest.ts";
import {
  BabyProfileTransportError,
  executeBabyProfileLoadRequest,
  executeBabyProfileSubmitRequest,
  type BabyProfileAuth,
  type BabyProfileResponse,
} from "./transport.ts";

export type BabyProfileScreenLoadingState = {
  status: "loading";
  loadTarget: BabyProfileLoadRequest["target"];
  babyId?: string;
  form: null;
  ageSummary: null;
  submission: null;
};

export type BabyProfileScreenErrorState = {
  status: "error";
  loadTarget: BabyProfileLoadRequest["target"];
  babyId?: string;
  form: null;
  ageSummary: null;
  submission: null;
  message: string;
};

export type BabyProfileScreenReadyState = {
  status: "ready";
  loadTarget: BabyProfileLoadRequest["target"];
  form: BabyProfileCreateEditState;
  babyId?: string;
  ageSummary: ReturnType<typeof selectBabyProfileCreateEditAgeSummary>;
  submission:
    | null
    | {
        outcome: "created" | "updated" | "noop";
        request?: BabyProfileSubmitRequest;
        changedFields: string[];
      };
  requestErrorMessage: string | null;
};

export type BabyProfileScreenState =
  | BabyProfileScreenLoadingState
  | BabyProfileScreenErrorState
  | BabyProfileScreenReadyState;

export function createLoadingBabyProfileScreenState(
  babyId?: string,
): BabyProfileScreenLoadingState {
  const request = toBabyProfileLoadRequest(babyId);

  return {
    status: "loading",
    loadTarget: request.target,
    babyId: request.target === "explicit" ? request.babyId : undefined,
    form: null,
    ageSummary: null,
    submission: null,
  };
}

export function createBabyProfileScreenErrorState({
  babyId,
  loadTarget,
  error,
}: {
  babyId?: string;
  loadTarget: BabyProfileLoadRequest["target"];
  error: unknown;
}): BabyProfileScreenErrorState {
  return {
    status: "error",
    loadTarget,
    babyId,
    form: null,
    ageSummary: null,
    submission: null,
    message: getErrorMessage(error, "Failed to load baby profile."),
  };
}

export function createBabyProfileScreenState(
  profile?: BabyProfileResponse,
  loadTarget: BabyProfileLoadRequest["target"] = "current",
): BabyProfileScreenReadyState {
  const form = profile
    ? createBabyProfileCreateEditState("edit", profile)
    : createBabyProfileCreateEditState("create");

  return {
    status: "ready",
    loadTarget,
    form,
    babyId: profile?.id,
    ageSummary: selectBabyProfileCreateEditAgeSummary(form),
    submission: null,
    requestErrorMessage: null,
  };
}

export function updateBabyProfileScreenField<K extends keyof BabyProfileFormInput>(
  state: BabyProfileScreenReadyState,
  field: K,
  value: BabyProfileFormInput[K],
): BabyProfileScreenReadyState {
  const form = updateBabyProfileField(state.form, field, value);

  return {
    ...state,
    form,
    ageSummary: selectBabyProfileCreateEditAgeSummary(form),
    submission: null,
    requestErrorMessage: null,
  };
}

export async function loadBabyProfileScreenState({
  babyId,
  auth,
  toLoadRequest = toBabyProfileLoadRequest,
  executeLoadRequest = executeBabyProfileLoadRequest,
}: {
  babyId?: string;
  auth?: BabyProfileAuth;
  toLoadRequest?: (babyId?: string) => BabyProfileLoadRequest;
  executeLoadRequest?: (args: {
    request: BabyProfileLoadRequest;
    auth?: BabyProfileAuth;
  }) => Promise<BabyProfileResponse>;
} = {}): Promise<BabyProfileScreenReadyState | BabyProfileScreenErrorState> {
  const request = toLoadRequest(babyId);

  try {
    const profile = await executeLoadRequest({ request, auth });
    return createBabyProfileScreenState(profile, request.target);
  } catch (error) {
    if (request.target === "current" && isNotFoundTransportError(error)) {
      return createBabyProfileScreenState(undefined, request.target);
    }

    return createBabyProfileScreenErrorState({
      babyId: request.target === "explicit" ? request.babyId : undefined,
      loadTarget: request.target,
      error,
    });
  }
}

export async function saveBabyProfileScreenState({
  state,
  auth,
  executeSubmitRequest = executeBabyProfileSubmitRequest,
}: {
  state: BabyProfileScreenReadyState;
  auth?: BabyProfileAuth;
  executeSubmitRequest?: (args: {
    request: BabyProfileSubmitRequest;
    auth?: BabyProfileAuth;
  }) => Promise<BabyProfileResponse>;
}): Promise<BabyProfileScreenReadyState> {
  const submission = submitBabyProfileCreateEditState(state.form);

  if (!submission.ok) {
    return {
      ...state,
      form: submission.state,
      ageSummary: selectBabyProfileCreateEditAgeSummary(submission.state),
      submission: null,
      requestErrorMessage: null,
    };
  }

  const request = toBabyProfileSubmitRequest(submission, state.babyId);

  if (!request) {
    return {
      ...state,
      submission: {
        outcome: "noop",
        changedFields: [],
      },
      requestErrorMessage: null,
    };
  }

  try {
    const profile = await executeSubmitRequest({ request, auth });
    const nextState = createBabyProfileScreenState(profile, state.loadTarget);

    return {
      ...nextState,
      submission: {
        outcome: submission.mode === "create" ? "created" : "updated",
        request,
        changedFields:
          request.method === "POST"
            ? [...EDITABLE_FIELD_NAMES]
            : Object.keys(request.body),
      },
    };
  } catch (error) {
    return {
      ...state,
      submission: null,
      requestErrorMessage: getErrorMessage(error, "Failed to save baby profile."),
    };
  }
}

const EDITABLE_FIELD_NAMES = [
  "allergies",
  "birthDate",
  "feedingStyle",
  "name",
  "primaryCaregiver",
  "sex",
  "supplements",
  "timezone",
] as const satisfies ReadonlyArray<keyof BabyProfilePayload>;

function isNotFoundTransportError(
  error: unknown,
): error is BabyProfileTransportError {
  return error instanceof BabyProfileTransportError && error.status === 404;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof BabyProfileTransportError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}
