import {
  BABY_PROFILE_FEEDING_STYLE_OPTIONS,
  BABY_PROFILE_SEX_OPTIONS,
  type BabyProfileFeedingStyle,
  type BabyProfileFormInput,
  type BabyProfileSex,
} from "@aibaby/ui";

import type { BabyProfileScreenReadyState } from "./screenShell.ts";

export type BabyProfileRouteField = {
  key: keyof BabyProfileFormInput;
  label: string;
  value: string;
  placeholder?: string;
  error?: string;
  kind: "text" | "date" | "textarea" | "choice";
};

export type BabyProfileRouteChoiceOption<T extends string> = {
  value: T;
  label: string;
  selected: boolean;
};

export type BabyProfileRouteModel = {
  title: string;
  subtitle: string;
  submitLabel: string;
  isEditMode: boolean;
  statusMessage?: string;
  textFields: BabyProfileRouteField[];
  sexOptions: BabyProfileRouteChoiceOption<BabyProfileSex>[];
  feedingStyleOptions: BabyProfileRouteChoiceOption<BabyProfileFeedingStyle>[];
};

export function createBabyProfileRouteModel(
  state: BabyProfileScreenReadyState,
): BabyProfileRouteModel {
  const { values, errors, mode } = state.form;
  const isEditMode = mode === "edit";

  return {
    title: isEditMode ? "Baby profile" : "Create baby profile",
    subtitle: state.ageSummary
      ? `Current age: ${state.ageSummary.displayLabel}`
      : "Add the basics so summaries and reminders use the right age stage.",
    submitLabel: isEditMode ? "Save profile" : "Create profile",
    isEditMode,
    statusMessage: getSubmissionMessage(state),
    textFields: [
      {
        key: "name",
        label: "Baby name",
        value: values.name,
        placeholder: "Yiyi",
        error: errors.name,
        kind: "text",
      },
      {
        key: "birthDate",
        label: "Birth date",
        value: values.birthDate,
        placeholder: "YYYY-MM-DD",
        error: errors.birthDate,
        kind: "date",
      },
      {
        key: "allergiesText",
        label: "Allergies",
        value: values.allergiesText,
        placeholder: "Egg, dairy",
        error: errors.allergiesText,
        kind: "textarea",
      },
      {
        key: "supplementsText",
        label: "Supplements",
        value: values.supplementsText,
        placeholder: "Iron, vitamin D",
        error: errors.supplementsText,
        kind: "textarea",
      },
      {
        key: "timezone",
        label: "Timezone",
        value: values.timezone,
        placeholder: "America/Los_Angeles",
        error: errors.timezone,
        kind: "text",
      },
      {
        key: "primaryCaregiver",
        label: "Primary caregiver",
        value: values.primaryCaregiver,
        placeholder: "Zhen",
        error: errors.primaryCaregiver,
        kind: "text",
      },
    ],
    sexOptions: BABY_PROFILE_SEX_OPTIONS.map((value) => ({
      value,
      label: SEX_LABELS[value],
      selected: values.sex === value,
    })),
    feedingStyleOptions: BABY_PROFILE_FEEDING_STYLE_OPTIONS.map((value) => ({
      value,
      label: FEEDING_STYLE_LABELS[value],
      selected: values.feedingStyle === value,
    })),
  };
}

const SEX_LABELS: Record<BabyProfileSex, string> = {
  female: "Female",
  male: "Male",
  other: "Other",
  unknown: "Prefer not to say",
};

const FEEDING_STYLE_LABELS: Record<BabyProfileFeedingStyle, string> = {
  breast_milk: "Breast milk",
  formula: "Formula",
  mixed: "Mixed",
  solids_started: "Solids started",
};

function getSubmissionMessage(
  state: BabyProfileScreenReadyState,
): string | undefined {
  if (!state.submission) {
    return undefined;
  }

  if (state.submission.outcome === "created") {
    return "Profile created.";
  }

  if (state.submission.outcome === "updated") {
    return state.submission.changedFields.length > 0
      ? `Saved ${state.submission.changedFields.length} profile field${state.submission.changedFields.length === 1 ? "" : "s"}.`
      : "Profile saved.";
  }

  return "No profile changes to save.";
}
