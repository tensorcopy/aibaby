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
  message: string;
};

export type BabyProfileRouteSaveButtonChrome = {
  kind: "save-button";
  label: string;
  disabled: boolean;
  showSavingSpinner: boolean;
};

export type BabyProfileRouteTextInputChrome = {
  autoCapitalize: "none" | "words";
  autoCorrect: boolean;
  keyboardType: "default" | "numbers-and-punctuation";
  maxLength?: number;
  accessibilityHint?: string;
  supportingText?: string;
  showDatePickerAffordance?: boolean;
  datePickerLabel?: string;
  datePickerAccessibilityHint?: string;
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
  message: string | null,
): BabyProfileRouteRequestErrorBanner | null {
  if (!message) {
    return null;
  }

  return {
    kind: "request-error-banner",
    message,
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
  { disabled }: { disabled: boolean },
): BabyProfileRouteTextInputChrome {
  if (field.kind === "date") {
    return {
      autoCapitalize: "none",
      autoCorrect: false,
      keyboardType: "numbers-and-punctuation",
      maxLength: 10,
      accessibilityHint:
        field.error ?? field.hint ?? "Type YYYY-MM-DD or use the date picker.",
      supportingText:
        field.error ?? field.hint ?? "Type YYYY-MM-DD or use the date picker.",
      showDatePickerAffordance: true,
      datePickerLabel: "Choose date",
      datePickerAccessibilityHint: "Opens a date picker for the birth date.",
      showInvalidOutline: Boolean(field.error),
      accessibilityState: {
        disabled,
        invalid: Boolean(field.error),
      },
    };
  }

  if (field.key === "timezone") {
    return {
      autoCapitalize: "none",
      autoCorrect: false,
      keyboardType: "default",
      accessibilityHint: field.error ?? field.hint,
      supportingText: field.error ?? field.hint,
      showInvalidOutline: Boolean(field.error),
      accessibilityState: {
        disabled,
        invalid: Boolean(field.error),
      },
    };
  }

  return {
    autoCapitalize: "words",
    autoCorrect: false,
    keyboardType: "default",
    accessibilityHint: field.error ?? field.hint,
    supportingText: field.error ?? field.hint,
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
