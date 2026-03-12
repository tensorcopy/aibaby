import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import type { BabyProfileFormInput } from "@aibaby/ui";

import {
  updateBabyProfileScreenField,
  type BabyProfileScreenReadyState,
  type BabyProfileScreenState,
} from "../src/features/baby-profile/screenShell.ts";
import {
  createBabyProfileRouteScreenLoadState,
  createBabyProfileRouteScreenSavingState,
  loadBabyProfileRouteScreenState,
  saveBabyProfileRouteScreenState,
} from "../src/features/baby-profile/routeScreenController.ts";
import {
  createBabyProfileRouteModel,
  type BabyProfileRouteChoiceSection,
  type BabyProfileRouteModel,
} from "../src/features/baby-profile/routeModel.ts";
import { createBabyProfileRouteScreenModel } from "../src/features/baby-profile/routeScreenModel.ts";
import {
  createBabyProfileRouteChoiceChipChrome,
  createBabyProfileRouteErrorChrome,
  createBabyProfileRouteLoadingChrome,
  createBabyProfileRouteRequestErrorBanner,
  createBabyProfileRouteSaveButtonChrome,
  createBabyProfileRouteTextInputChrome,
} from "../src/features/baby-profile/routeScreenChrome.ts";
import { useMobileSession } from "../src/features/app-shell/MobileSessionContext.tsx";

export default function BabyProfileRoute() {
  const params = useLocalSearchParams<{ babyId?: string | string[] }>();
  const session = useMobileSession();
  const routeBabyId = Array.isArray(params.babyId) ? params.babyId[0] : params.babyId;

  return <BabyProfileRouteScreen babyId={routeBabyId ?? session.currentBabyId} />;
}

export function BabyProfileRouteScreen({ babyId }: { babyId?: string }) {
  const session = useMobileSession();
  const auth = useMemo(
    () => (session.ownerUserId ? { ownerUserId: session.ownerUserId } : undefined),
    [session.ownerUserId],
  );
  const [state, setState] = useState<BabyProfileScreenState>(() =>
    createBabyProfileRouteScreenLoadState(babyId),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isRetryingLoad, setIsRetryingLoad] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setState(createBabyProfileRouteScreenLoadState(babyId));

    void loadBabyProfileRouteScreenState({
      babyId,
      auth,
      setCurrentBabyId: session.setCurrentBabyId,
    }).then((nextState) => {
      if (!cancelled) {
        setState(nextState);
        setIsRetryingLoad(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [auth, babyId, loadAttempt, session.setCurrentBabyId]);

  const screenModel = createBabyProfileRouteScreenModel({ state, isSaving, isRetryingLoad });

  if (screenModel.kind === "loading") {
    const chrome = createBabyProfileRouteLoadingChrome({
      loadingMessage: screenModel.loadingMessage,
    });

    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>{chrome.loadingMessage}</Text>
      </View>
    );
  }

  if (screenModel.kind === "error") {
    const chrome = createBabyProfileRouteErrorChrome({
      title: screenModel.title,
      subtitle: screenModel.subtitle,
      errorMessage: screenModel.errorMessage,
      retryLabel: screenModel.retryLabel,
      retryDisabled: screenModel.retryDisabled,
    });

    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{chrome.title}</Text>
        <Text style={styles.subtitle}>{chrome.subtitle}</Text>
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{chrome.errorMessage}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={chrome.retryDisabled}
          onPress={() => {
            setIsRetryingLoad(true);
            setLoadAttempt((current) => current + 1);
          }}
          style={[styles.retryButton, chrome.retryDisabled ? styles.retryButtonDisabled : null]}
        >
          {chrome.showRetrySpinner ? (
            <ActivityIndicator color="#0f172a" size="small" />
          ) : null}
          <Text style={styles.retryButtonText}>{chrome.retryLabel}</Text>
        </Pressable>
      </ScrollView>
    );
  }

  const { route: model } = screenModel;

  async function onSavePress() {
    const savingState = createBabyProfileRouteScreenSavingState(state);
    setState(savingState);
    setIsSaving(true);

    try {
      const saved = await saveBabyProfileRouteScreenState({
        state: savingState,
        auth,
        setCurrentBabyId: session.setCurrentBabyId,
      });
      setState(saved);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{model.title}</Text>
      <Text style={styles.subtitle}>{model.subtitle}</Text>

      {(() => {
        const requestErrorBanner = createBabyProfileRouteRequestErrorBanner(
          screenModel.requestErrorMessage,
        );

        return requestErrorBanner ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{requestErrorBanner.message}</Text>
          </View>
        ) : null;
      })()}

      {model.sections.map((section) => (
        <RouteSection
          key={section.key}
          disabled={screenModel.inputsDisabled}
          section={section}
          state={state}
          setState={setState}
        />
      ))}

      {model.statusMessage ? <Text style={styles.status}>{model.statusMessage}</Text> : null}

      {(() => {
        const saveButton = createBabyProfileRouteSaveButtonChrome({
          label: screenModel.submitLabel,
          disabled: screenModel.submitDisabled,
          isSaving: screenModel.isSaving,
        });

        return (
          <Pressable
            accessibilityRole="button"
            disabled={saveButton.disabled}
            onPress={() => {
              void onSavePress();
            }}
            style={[styles.submitButton, saveButton.disabled ? styles.submitButtonDisabled : null]}
          >
            {saveButton.showSavingSpinner ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : null}
            <Text style={styles.submitButtonText}>{saveButton.label}</Text>
          </Pressable>
        );
      })()}
    </ScrollView>
  );
}

function updateReadyStateField<K extends keyof BabyProfileFormInput>(
  state: BabyProfileScreenState,
  field: K,
  value: BabyProfileFormInput[K],
): BabyProfileScreenReadyState {
  return updateBabyProfileScreenField(assertReadyState(state), field, value);
}

function assertReadyState(state: BabyProfileScreenState): BabyProfileScreenReadyState {
  if (state.status !== "ready") {
    throw new Error("Baby profile screen is not ready");
  }

  return state;
}

function RouteSection({
  disabled,
  section,
  state,
  setState,
}: {
  disabled: boolean;
  section: BabyProfileRouteModel["sections"][number];
  state: BabyProfileScreenReadyState;
  setState: Dispatch<SetStateAction<BabyProfileScreenState>>;
}) {
  return (
    <View style={styles.sectionGroup}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {section.kind === "text-fields"
        ? section.fields.map((field) => (
            <FormTextField
              key={field.key}
              disabled={disabled}
              state={state}
              field={field}
              setState={setState}
            />
          ))
        : renderChoiceSection({ disabled, section, setState })}
    </View>
  );
}

function renderChoiceSection({
  disabled,
  section,
  setState,
}: {
  disabled: boolean;
  section: BabyProfileRouteChoiceSection;
  setState: Dispatch<SetStateAction<BabyProfileScreenState>>;
}) {
  return (
    <ChoiceField
      disabled={disabled}
      label={section.label}
      error={section.error}
      options={section.options}
      onSelect={(value) => setState((current) => updateReadyStateField(current, section.field, value))}
    />
  );
}

function FormTextField({
  disabled,
  state,
  field,
  setState,
}: {
  disabled: boolean;
  state: BabyProfileScreenReadyState;
  field: ReturnType<typeof createBabyProfileRouteModel>["textFields"][number];
  setState: Dispatch<SetStateAction<BabyProfileScreenState>>;
}) {
  const chrome = createBabyProfileRouteTextInputChrome(field, { disabled });

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{field.label}</Text>
      <TextInput
        accessibilityHint={chrome.accessibilityHint}
        accessibilityLabel={field.label}
        accessibilityState={chrome.accessibilityState}
        autoCapitalize={chrome.autoCapitalize}
        autoCorrect={chrome.autoCorrect}
        editable={!disabled}
        keyboardType={chrome.keyboardType}
        maxLength={chrome.maxLength}
        multiline={field.kind === "textarea"}
        onChangeText={(value) => {
          setState((current) => updateReadyStateField(current, field.key, value));
        }}
        placeholder={field.placeholder}
        style={[
          styles.textInput,
          field.kind === "textarea" ? styles.textarea : null,
          chrome.showInvalidOutline ? styles.textInputInvalid : null,
          disabled ? styles.fieldDisabled : null,
        ]}
        value={state.form.values[field.key]}
      />
      {field.error ? <Text style={styles.errorText}>{field.error}</Text> : null}
    </View>
  );
}

function ChoiceField<T extends string>({
  disabled,
  label,
  error,
  options,
  onSelect,
}: {
  disabled: boolean;
  label: string;
  error?: string;
  options: Array<{ value: T; label: string; selected: boolean }>;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View
        accessibilityHint={error}
        accessibilityLabel={label}
        accessibilityRole="radiogroup"
        style={[styles.choiceRow, error ? styles.choiceRowInvalid : null]}
      >
        {options.map((option) => {
          const chrome = createBabyProfileRouteChoiceChipChrome({
            disabled,
            selected: option.selected,
            error,
          });

          return (
            <Pressable
              key={option.value}
              accessibilityLabel={`${label}: ${option.label}`}
              accessibilityRole={chrome.accessibilityRole}
              accessibilityState={chrome.accessibilityState}
              disabled={disabled}
              onPress={() => onSelect(option.value)}
              style={[
                styles.choiceChip,
                chrome.showInvalidOutline ? styles.choiceChipInvalid : null,
                option.selected ? styles.choiceChipSelected : null,
                disabled ? styles.fieldDisabled : null,
              ]}
            >
              <Text style={option.selected ? styles.choiceChipSelectedText : styles.choiceChipText}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  loadingText: {
    color: "#475569",
  },
  container: {
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#475569",
  },
  errorBanner: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorBannerText: {
    color: "#b91c1c",
    fontSize: 14,
    lineHeight: 20,
  },
  sectionGroup: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  textInputInvalid: {
    borderColor: "#dc2626",
    backgroundColor: "#fef2f2",
  },
  textarea: {
    minHeight: 92,
    textAlignVertical: "top",
  },
  choiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  choiceRowInvalid: {
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    padding: 8,
    backgroundColor: "#fef2f2",
  },
  choiceChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
  },
  choiceChipInvalid: {
    borderColor: "#dc2626",
    backgroundColor: "#ffffff",
  },
  choiceChipSelected: {
    borderColor: "#2563eb",
    backgroundColor: "#dbeafe",
  },
  choiceChipText: {
    color: "#334155",
  },
  choiceChipSelectedText: {
    color: "#1d4ed8",
    fontWeight: "600",
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 13,
  },
  status: {
    color: "#166534",
    fontSize: 14,
  },
  retryButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: "#e2e8f0",
    gap: 8,
  },
  retryButtonDisabled: {
    opacity: 0.8,
  },
  retryButtonText: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "700",
  },
  submitButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: "#2563eb",
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  fieldDisabled: {
    opacity: 0.6,
  },
});
