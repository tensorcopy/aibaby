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
};

export type BabyProfileRouteChoiceChipChrome = {
  accessibilityRole: "radio";
  accessibilityState: {
    disabled: boolean;
    selected: boolean;
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
): BabyProfileRouteTextInputChrome {
  if (field.kind === "date") {
    return {
      autoCapitalize: "none",
      autoCorrect: false,
      keyboardType: "numbers-and-punctuation",
      maxLength: 10,
    };
  }

  if (field.key === "timezone") {
    return {
      autoCapitalize: "none",
      autoCorrect: false,
      keyboardType: "default",
    };
  }

  return {
    autoCapitalize: "words",
    autoCorrect: false,
    keyboardType: "default",
  };
}

export function createBabyProfileRouteChoiceChipChrome({
  disabled,
  selected,
}: {
  disabled: boolean;
  selected: boolean;
}): BabyProfileRouteChoiceChipChrome {
  return {
    accessibilityRole: "radio",
    accessibilityState: {
      disabled,
      selected,
    },
  };
}
