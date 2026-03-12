import {
  type BabyProfileAgeSummary,
  type BabyProfileFormErrors,
  type BabyProfileFormInput,
  type BabyProfileFormMode,
  createBabyProfileFormInput,
  getBabyProfileAgeSummary,
  hasBabyProfileFormErrors,
  toBabyProfilePayload,
  validateBabyProfileFormInput,
} from "@aibaby/ui";

export type BabyProfileCreateEditState = {
  mode: BabyProfileFormMode;
  values: BabyProfileFormInput;
  errors: BabyProfileFormErrors;
};

export function createBabyProfileCreateEditState(
  mode: BabyProfileFormMode,
  initialValues?: Partial<ReturnType<typeof toBabyProfilePayload>>,
): BabyProfileCreateEditState {
  return {
    mode,
    values: createBabyProfileFormInput(initialValues),
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
  | { ok: true; payload: ReturnType<typeof toBabyProfilePayload> } {
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

  return {
    ok: true,
    payload: toBabyProfilePayload(state.values),
  };
}

export function selectBabyProfileCreateEditAgeSummary(
  state: BabyProfileCreateEditState,
  now?: Date,
): BabyProfileAgeSummary | null {
  return getBabyProfileAgeSummary(state.values.birthDate, now);
}
