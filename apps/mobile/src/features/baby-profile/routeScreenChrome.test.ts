import test from "node:test";
import assert from "node:assert/strict";

import {
  createBabyProfileRouteChoiceChipChrome,
  createBabyProfileRouteErrorChrome,
  createBabyProfileRouteLoadingChrome,
  createBabyProfileRouteRequestErrorBanner,
  createBabyProfileRouteSaveButtonChrome,
  createBabyProfileRouteTextInputChrome,
} from "./routeScreenChrome.ts";

test("createBabyProfileRouteLoadingChrome keeps the retry loading copy inline", () => {
  assert.deepEqual(
    createBabyProfileRouteLoadingChrome({
      loadingMessage: "Retrying baby profile…",
    }),
    {
      kind: "loading",
      loadingMessage: "Retrying baby profile…",
    },
  );
});

test("createBabyProfileRouteErrorChrome keeps the retry button disabled and labeled while retrying", () => {
  assert.deepEqual(
    createBabyProfileRouteErrorChrome({
      title: "Baby profile",
      subtitle: "We couldn't load this profile right now. Try again to keep editing.",
      errorMessage: "Request timed out",
      retryLabel: "Retrying…",
      retryDisabled: true,
    }),
    {
      kind: "error",
      title: "Baby profile",
      subtitle: "We couldn't load this profile right now. Try again to keep editing.",
      errorMessage: "Request timed out",
      retryLabel: "Retrying…",
      retryDisabled: true,
      showRetrySpinner: true,
    },
  );
});

test("createBabyProfileRouteRequestErrorBanner returns null when there is no inline save error", () => {
  assert.equal(
    createBabyProfileRouteRequestErrorBanner({
      message: null,
      retryDisabled: false,
      homeHref: "/?babyId=baby_123",
    }),
    null,
  );
});

test("createBabyProfileRouteRequestErrorBanner renders the inline save error copy when present", () => {
  assert.deepEqual(
    createBabyProfileRouteRequestErrorBanner({
      message: "Failed to reach the baby profile API",
      retryDisabled: false,
      homeHref: "/?babyId=baby_123",
    }),
    {
      kind: "request-error-banner",
      title: "Profile save failed",
      message: "Failed to reach the baby profile API",
      retryLabel: "Try again",
      retryDisabled: false,
      showRetrySpinner: false,
      dismissLabel: "Back to AI Baby",
      dismissHref: "/?babyId=baby_123",
    },
  );
});

test("createBabyProfileRouteSaveButtonChrome swaps to the saving label and disabled state", () => {
  assert.deepEqual(
    createBabyProfileRouteSaveButtonChrome({
      label: "Saving…",
      disabled: true,
      isSaving: true,
    }),
    {
      kind: "save-button",
      label: "Saving…",
      disabled: true,
      showSavingSpinner: true,
    },
  );
});

test("createBabyProfileRouteTextInputChrome gives the birth-date field a constrained keyboard and picker affordance", () => {
  assert.deepEqual(
    createBabyProfileRouteTextInputChrome(
      {
        key: "birthDate",
        label: "Birth date",
        value: "2025-10-15",
        kind: "date",
      },
      { disabled: false },
    ),
    {
      inputDisabled: false,
      autoCapitalize: "none",
      autoCorrect: false,
      keyboardType: "numbers-and-punctuation",
      maxLength: 10,
      accessibilityHint: "Type YYYY-MM-DD or use the date picker.",
      supportingText: "Type YYYY-MM-DD or use the date picker.",
      showDatePickerAffordance: true,
      datePickerLabel: "Choose date",
      datePickerAccessibilityHint: "Opens a date picker for the birth date.",
      datePickerDisabled: false,
      showInvalidOutline: false,
      accessibilityState: {
        disabled: false,
        invalid: false,
      },
    },
  );
});

test("createBabyProfileRouteTextInputChrome reuses required-field hints for assistive tech before submit", () => {
  assert.deepEqual(
    createBabyProfileRouteTextInputChrome(
      {
        key: "birthDate",
        label: "Birth date",
        value: "",
        kind: "date",
        hint: "Required. Use YYYY-MM-DD.",
      },
      { disabled: false },
    ),
    {
      inputDisabled: false,
      autoCapitalize: "none",
      autoCorrect: false,
      keyboardType: "numbers-and-punctuation",
      maxLength: 10,
      accessibilityHint: "Required. Use YYYY-MM-DD.",
      supportingText: "Required. Use YYYY-MM-DD.",
      showDatePickerAffordance: true,
      datePickerLabel: "Choose date",
      datePickerAccessibilityHint: "Opens a date picker for the birth date.",
      datePickerDisabled: false,
      showInvalidOutline: false,
      accessibilityState: {
        disabled: false,
        invalid: false,
      },
    },
  );
});

test("createBabyProfileRouteTextInputChrome locks the birth-date field behind confirm/cancel while the iOS picker is open", () => {
  assert.deepEqual(
    createBabyProfileRouteTextInputChrome(
      {
        key: "birthDate",
        label: "Birth date",
        value: "2025-10-15",
        kind: "date",
      },
      { disabled: false, hasPendingBirthDateDraft: true },
    ),
    {
      inputDisabled: true,
      autoCapitalize: "none",
      autoCorrect: false,
      keyboardType: "numbers-and-punctuation",
      maxLength: 10,
      accessibilityHint:
        "Birth date picker is open. Confirm or cancel the pending date to keep editing.",
      supportingText:
        "Birth date picker is open. Confirm or cancel the pending date to keep editing.",
      showDatePickerAffordance: true,
      datePickerLabel: "Editing date",
      datePickerAccessibilityHint:
        "Birth date picker is already open. Confirm or cancel the pending date first.",
      datePickerDisabled: true,
      showInvalidOutline: false,
      accessibilityState: {
        disabled: true,
        invalid: false,
      },
    },
  );
});

test("createBabyProfileRouteTextInputChrome disables the picker affordance while saving", () => {
  assert.deepEqual(
    createBabyProfileRouteTextInputChrome(
      {
        key: "birthDate",
        label: "Birth date",
        value: "2025-10-15",
        kind: "date",
      },
      { disabled: true },
    ),
    {
      inputDisabled: true,
      autoCapitalize: "none",
      autoCorrect: false,
      keyboardType: "numbers-and-punctuation",
      maxLength: 10,
      accessibilityHint: "Type YYYY-MM-DD or use the date picker.",
      supportingText: "Type YYYY-MM-DD or use the date picker.",
      showDatePickerAffordance: true,
      datePickerLabel: "Choose date",
      datePickerAccessibilityHint: "Birth date picker is unavailable while the profile is saving.",
      datePickerDisabled: true,
      showInvalidOutline: false,
      accessibilityState: {
        disabled: true,
        invalid: false,
      },
    },
  );
});

test("createBabyProfileRouteTextInputChrome keeps the timezone field case-stable", () => {
  assert.deepEqual(
    createBabyProfileRouteTextInputChrome(
      {
        key: "timezone",
        label: "Timezone",
        value: "America/Los_Angeles",
        kind: "text",
      },
      { disabled: true },
    ),
    {
      inputDisabled: true,
      autoCapitalize: "none",
      autoCorrect: false,
      keyboardType: "default",
      accessibilityHint: undefined,
      supportingText: undefined,
      datePickerDisabled: false,
      showInvalidOutline: false,
      accessibilityState: {
        disabled: true,
        invalid: false,
      },
    },
  );
});

test("createBabyProfileRouteTextInputChrome marks invalid fields for assistive tech", () => {
  assert.deepEqual(
    createBabyProfileRouteTextInputChrome(
      {
        key: "name",
        label: "Baby name",
        value: "",
        kind: "text",
        error: "Name is required.",
      },
      { disabled: false },
    ),
    {
      inputDisabled: false,
      autoCapitalize: "words",
      autoCorrect: false,
      keyboardType: "default",
      accessibilityHint: "Name is required.",
      supportingText: "Name is required.",
      datePickerDisabled: false,
      showInvalidOutline: true,
      accessibilityState: {
        disabled: false,
        invalid: true,
      },
    },
  );
});

test("createBabyProfileRouteChoiceChipChrome exposes radio selection state for grouped options", () => {
  assert.deepEqual(
    createBabyProfileRouteChoiceChipChrome({
      disabled: true,
      selected: true,
      error: "Choose a supported option.",
    }),
    {
      accessibilityRole: "radio",
      accessibilityHint: "Choose a supported option.",
      showInvalidOutline: true,
      accessibilityState: {
        disabled: true,
        selected: true,
        invalid: true,
      },
    },
  );
});
