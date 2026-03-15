import type { BabyProfileRouteField } from "./routeModel.ts";

export type BabyProfileRouteLoadingChrome = {
  kind: "loading";
  loadingMessage: string;
};

export type BabyProfileRouteErrorChrome = {
  kind: "error";
  title: string;
  subtitle: string;
  errorMessage: string;
  retryLabel: string;
  retryDisabled: boolean;
  showRetrySpinner: boolean;
};

export type BabyProfileRouteRequestErrorBanner = {
  kind: "request-error-banner";
  title: string;
  message: string;
  retryLabel: string;
  retryDisabled: boolean;
  showRetrySpinner: boolean;
  dismissLabel: string;
  dismissHref: string;
};

export type BabyProfileRouteSaveButtonChrome = {
  kind: "save-button";
  label: string;
  disabled: boolean;
  showSavingSpinner: boolean;
};

export type BabyProfileRouteTextInputChrome = {
  inputDisabled: boolean;
  autoCapitalize: "none" | "words";
  autoCorrect: boolean;
  keyboardType: "default" | "numbers-and-punctuation";
  maxLength?: number;
  accessibilityHint?: string;
  supportingText?: string;
  showDatePickerAffordance?: boolean;
  datePickerLabel?: string;
  datePickerAccessibilityHint?: string;
  datePickerDisabled: boolean;
  showInvalidOutline: boolean;
  accessibilityState: {
    disabled: boolean;
    invalid: boolean;
  };
};

export type BabyProfileRouteChoiceChipChrome = {
  accessibilityRole: "radio";
  accessibilityHint?: string;
  showInvalidOutline: boolean;
  accessibilityState: {
    disabled: boolean;
    selected: boolean;
    invalid?: boolean;
  };
};

export function createBabyProfileRouteLoadingChrome({
  loadingMessage,
}: {
  loadingMessage: string;
}): BabyProfileRouteLoadingChrome {
  return {
    kind: "loading",
    loadingMessage,
  };
}

export function createBabyProfileRouteErrorChrome({
  title,
  subtitle,
  errorMessage,
  retryLabel,
  retryDisabled,
}: {
  title: string;
  subtitle: string;
  errorMessage: string;
  retryLabel: string;
  retryDisabled: boolean;
}): BabyProfileRouteErrorChrome {
  return {
    kind: "error",
    title,
    subtitle,
    errorMessage,
    retryLabel,
    retryDisabled,
    showRetrySpinner: retryDisabled,
  };
}

export function createBabyProfileRouteRequestErrorBanner(
  {
    message,
    retryDisabled,
    homeHref,
  }: {
    message: string | null;
    retryDisabled: boolean;
    homeHref: string;
  },
): BabyProfileRouteRequestErrorBanner | null {
  if (!message) {
    return null;
  }

  return {
    kind: "request-error-banner",
    title: "Profile save failed",
    message,
    retryLabel: retryDisabled ? "Retrying…" : "Try again",
    retryDisabled,
    showRetrySpinner: retryDisabled,
    dismissLabel: "Back to AI Baby",
    dismissHref: homeHref,
  };
}

export function createBabyProfileRouteSaveButtonChrome({
  label,
  disabled,
  isSaving,
}: {
  label: string;
  disabled: boolean;
  isSaving: boolean;
}): BabyProfileRouteSaveButtonChrome {
  return {
    kind: "save-button",
    label,
    disabled,
    showSavingSpinner: isSaving,
  };
}

export function createBabyProfileRouteTextInputChrome(
  field: BabyProfileRouteField,
  {
    disabled,
    hasPendingBirthDateDraft = false,
  }: {
    disabled: boolean;
    hasPendingBirthDateDraft?: boolean;
  },
): BabyProfileRouteTextInputChrome {
  if (field.kind === "date") {
    const inputDisabled = disabled || hasPendingBirthDateDraft;

    return {
      inputDisabled,
      autoCapitalize: "none",
      autoCorrect: false,
      keyboardType: "numbers-and-punctuation",
      maxLength: 10,
      accessibilityHint: hasPendingBirthDateDraft
        ? "Birth date picker is open. Confirm or cancel the pending date to keep editing."
        : field.error ?? field.hint ?? "Type YYYY-MM-DD or use the date picker.",
      supportingText: hasPendingBirthDateDraft
        ? "Birth date picker is open. Confirm or cancel the pending date to keep editing."
        : field.error ?? field.hint ?? "Type YYYY-MM-DD or use the date picker.",
      showDatePickerAffordance: true,
      datePickerLabel: hasPendingBirthDateDraft ? "Editing date" : "Choose date",
      datePickerAccessibilityHint: disabled
        ? "Birth date picker is unavailable while the profile is saving."
        : hasPendingBirthDateDraft
          ? "Birth date picker is already open. Confirm or cancel the pending date first."
          : "Opens a date picker for the birth date.",
      datePickerDisabled: inputDisabled,
      showInvalidOutline: Boolean(field.error),
      accessibilityState: {
        disabled: inputDisabled,
        invalid: Boolean(field.error),
      },
    };
  }

  if (field.key === "timezone") {
    return {
      inputDisabled: disabled,
      autoCapitalize: "none",
      autoCorrect: false,
      keyboardType: "default",
      accessibilityHint: field.error ?? field.hint,
      supportingText: field.error ?? field.hint,
      datePickerDisabled: false,
      showInvalidOutline: Boolean(field.error),
      accessibilityState: {
        disabled,
        invalid: Boolean(field.error),
      },
    };
  }

  return {
    inputDisabled: disabled,
    autoCapitalize: "words",
    autoCorrect: false,
    keyboardType: "default",
    accessibilityHint: field.error ?? field.hint,
    supportingText: field.error ?? field.hint,
    datePickerDisabled: false,
    showInvalidOutline: Boolean(field.error),
    accessibilityState: {
      disabled,
      invalid: Boolean(field.error),
    },
  };
}

export function createBabyProfileRouteChoiceChipChrome({
  disabled,
  selected,
  error,
}: {
  disabled: boolean;
  selected: boolean;
  error?: string;
}): BabyProfileRouteChoiceChipChrome {
  return {
    accessibilityRole: "radio",
    accessibilityHint: error,
    showInvalidOutline: Boolean(error),
    accessibilityState: {
      disabled,
      selected,
      invalid: error ? true : undefined,
    },
  };
}
