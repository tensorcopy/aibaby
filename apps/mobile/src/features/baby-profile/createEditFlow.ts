import {
  type BabyProfileAgeSummary,
  type BabyProfileFormErrors,
  type BabyProfileFormInput,
  type BabyProfileFormMode,
  type BabyProfilePayload,
  type BabyProfileUpdatePayload,
  createBabyProfileFormInput,
  diffBabyProfilePayload,
  getBabyProfileAgeSummary,
  hasBabyProfileFormErrors,
  hasBabyProfileUpdateChanges,
  toBabyProfilePayload,
  validateBabyProfileFormInput,
} from "@aibaby/ui";

export type BabyProfileCreateEditState = {
  mode: BabyProfileFormMode;
  values: BabyProfileFormInput;
  initialPayload: BabyProfilePayload;
  errors: BabyProfileFormErrors;
};

export function createBabyProfileCreateEditState(
  mode: BabyProfileFormMode,
  initialValues?: Partial<BabyProfilePayload>,
): BabyProfileCreateEditState {
  const values = createBabyProfileFormInput(initialValues);

  return {
    mode,
    values,
    initialPayload: toBabyProfilePayload(values),
    errors: {},
  };
}

export function updateBabyProfileField<K extends keyof BabyProfileFormInput>(
  state: BabyProfileCreateEditState,
  field: K,
  value: BabyProfileFormInput[K],
): BabyProfileCreateEditState {
  return {
    ...state,
    values: {
      ...state.values,
      [field]: value,
    },
    errors: {
      ...state.errors,
      [field]: undefined,
    },
  };
}

export function submitBabyProfileCreateEditState(
  state: BabyProfileCreateEditState,
  now?: Date,
):
  | { ok: false; state: BabyProfileCreateEditState }
  | { ok: true; mode: "create"; payload: BabyProfilePayload }
  | {
      ok: true;
      mode: "edit";
      payload: BabyProfilePayload;
      patch: BabyProfileUpdatePayload;
      hasChanges: boolean;
    } {
  const errors = validateBabyProfileFormInput(state.values, now);

  if (hasBabyProfileFormErrors(errors)) {
    return {
      ok: false,
      state: {
        ...state,
        errors,
      },
    };
  }

  const payload = toBabyProfilePayload(state.values);

  if (state.mode === "edit") {
    const patch = diffBabyProfilePayload(state.initialPayload, payload);

    return {
      ok: true,
      mode: "edit",
      payload,
      patch,
      hasChanges: hasBabyProfileUpdateChanges(patch),
    };
  }

  return {
    ok: true,
    mode: "create",
    payload,
  };
}

export function selectBabyProfileCreateEditAgeSummary(
  state: BabyProfileCreateEditState,
  now?: Date,
): BabyProfileAgeSummary | null {
  return getBabyProfileAgeSummary(state.values.birthDate, now);
}
