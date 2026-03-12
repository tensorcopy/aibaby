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
  assert.equal(createBabyProfileRouteRequestErrorBanner(null), null);
});

test("createBabyProfileRouteRequestErrorBanner renders the inline save error copy when present", () => {
  assert.deepEqual(
    createBabyProfileRouteRequestErrorBanner("Failed to reach the baby profile API"),
    {
      kind: "request-error-banner",
      message: "Failed to reach the baby profile API",
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

test("createBabyProfileRouteTextInputChrome gives the birth-date field a constrained keyboard", () => {
  assert.deepEqual(
    createBabyProfileRouteTextInputChrome({
      key: "birthDate",
      label: "Birth date",
      value: "2025-10-15",
      kind: "date",
    }),
    {
      autoCapitalize: "none",
      autoCorrect: false,
      keyboardType: "numbers-and-punctuation",
      maxLength: 10,
    },
  );
});

test("createBabyProfileRouteTextInputChrome keeps the timezone field case-stable", () => {
  assert.deepEqual(
    createBabyProfileRouteTextInputChrome({
      key: "timezone",
      label: "Timezone",
      value: "America/Los_Angeles",
      kind: "text",
    }),
    {
      autoCapitalize: "none",
      autoCorrect: false,
      keyboardType: "default",
    },
  );
});

test("createBabyProfileRouteChoiceChipChrome exposes radio selection state for grouped options", () => {
  assert.deepEqual(
    createBabyProfileRouteChoiceChipChrome({
      disabled: true,
      selected: true,
    }),
    {
      accessibilityRole: "radio",
      accessibilityState: {
        disabled: true,
        selected: true,
      },
    },
  );
});
