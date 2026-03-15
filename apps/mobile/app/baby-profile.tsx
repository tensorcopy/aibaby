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
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import type { BabyProfileFormInput } from "@aibaby/ui";

import {
  nurseryColors,
  nurseryRadii,
} from "../src/features/app-shell/nurseryTheme.ts";
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
import { resolveBabyProfileDeviceTimezone } from "../src/features/baby-profile/deviceTimezone.ts";
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
import { createMobileHomeHref } from "../src/features/app-shell/rootNavigation.ts";
import {
  confirmBabyProfileBirthDatePickerDraft,
  createBabyProfileBirthDatePickerDraft,
  normalizeBabyProfileBirthDateSelection,
  resolveBabyProfileBirthDatePickerValue,
  updateBabyProfileBirthDatePickerDraft,
  type BabyProfileBirthDatePickerDraft,
} from "../src/features/baby-profile/birthDatePicker.ts";

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
  const [birthDatePickerDraft, setBirthDatePickerDraft] =
    useState<BabyProfileBirthDatePickerDraft | null>(null);
  const defaultTimezone = useMemo(
    () =>
      resolveBabyProfileDeviceTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone),
    [],
  );

  useEffect(() => {
    let cancelled = false;

    setBirthDatePickerDraft(null);
    setState(createBabyProfileRouteScreenLoadState(babyId));

    void loadBabyProfileRouteScreenState({
      babyId,
      auth,
      apiBaseUrl: session.apiBaseUrl,
      defaultTimezone,
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
  }, [auth, babyId, defaultTimezone, loadAttempt, session.setCurrentBabyId]);

  const screenModel = createBabyProfileRouteScreenModel({
    state,
    isSaving,
    isRetryingLoad,
    hasPendingBirthDateDraft: birthDatePickerDraft !== null,
  });

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
        <Text style={styles.heroEyebrow}>Baby profile</Text>
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
  const homeHref = createMobileHomeHref({
    babyId: state.status === "ready" ? state.babyId ?? babyId : babyId,
  });

  async function onSavePress() {
    setBirthDatePickerDraft(null);
    const savingState = createBabyProfileRouteScreenSavingState(state);
    setState(savingState);
    setIsSaving(true);

    try {
      const saved = await saveBabyProfileRouteScreenState({
        state: savingState,
        auth,
        apiBaseUrl: session.apiBaseUrl,
        setCurrentBabyId: session.setCurrentBabyId,
      });
      setState(saved);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heroEyebrow}>Baby profile</Text>
      <Text style={styles.title}>{model.title}</Text>
      <Text style={styles.subtitle}>{model.subtitle}</Text>

      {(() => {
        const requestErrorBanner = createBabyProfileRouteRequestErrorBanner(
          {
            message: screenModel.requestErrorMessage,
            retryDisabled: screenModel.isSaving,
            homeHref,
          },
        );

        return requestErrorBanner ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerTitle}>{requestErrorBanner.title}</Text>
            <Text style={styles.errorBannerText}>{requestErrorBanner.message}</Text>
            <Text style={styles.errorBannerHint}>
              Your edits are still on this screen. You can retry the save or go back without
              saving.
            </Text>
            <View style={styles.errorBannerActionRow}>
              <Pressable
                accessibilityRole="button"
                disabled={requestErrorBanner.retryDisabled}
                onPress={() => {
                  void onSavePress();
                }}
                style={[
                  styles.errorBannerRetryButton,
                  requestErrorBanner.retryDisabled ? styles.retryButtonDisabled : null,
                ]}
              >
                {requestErrorBanner.showRetrySpinner ? (
                  <ActivityIndicator color="#0f172a" size="small" />
                ) : null}
                <Text style={styles.errorBannerRetryButtonText}>
                  {requestErrorBanner.retryLabel}
                </Text>
              </Pressable>
              <Link asChild href={requestErrorBanner.dismissHref}>
                <Pressable accessibilityRole="button" style={styles.errorBannerDismissButton}>
                  <Text style={styles.errorBannerDismissButtonText}>
                    {requestErrorBanner.dismissLabel}
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
        ) : null;
      })()}

      {model.sections.map((section) => (
        <RouteSection
          key={section.key}
          disabled={screenModel.inputsDisabled}
          section={section}
          state={state}
          hasPendingBirthDateDraft={birthDatePickerDraft !== null}
          setState={setState}
          setBirthDatePickerDraft={setBirthDatePickerDraft}
        />
      ))}

      {model.statusMessage ? <Text style={styles.status}>{model.statusMessage}</Text> : null}

      {model.successHandoff ? (
        <View style={styles.successCard}>
          <Text style={styles.successCardTitle}>{model.successHandoff.message}</Text>
          <Link asChild href={model.successHandoff.href}>
            <Pressable accessibilityRole="button" style={styles.successCardButton}>
              <Text style={styles.successCardButtonText}>{model.successHandoff.label}</Text>
            </Pressable>
          </Link>
        </View>
      ) : null}

      {Platform.OS === "ios" && birthDatePickerDraft ? (
        <View style={styles.datePickerCard}>
          <Text style={styles.datePickerTitle}>Choose birth date</Text>
          <Text style={styles.datePickerSubtitle}>
            The form keeps the current birth date until you confirm this picker.
          </Text>
          <DateTimePicker
            display="spinner"
            maximumDate={new Date()}
            mode="date"
            onChange={(event, selectedDate) => {
              if (event.type !== "set") {
                return;
              }

              setBirthDatePickerDraft((current) =>
                current
                  ? updateBabyProfileBirthDatePickerDraft({
                      draft: current,
                      selectedDate,
                    })
                  : current,
              );
            }}
            value={birthDatePickerDraft.value}
          />
          <Text style={styles.datePickerPreview}>
            Pending date: {confirmBabyProfileBirthDatePickerDraft({ draft: birthDatePickerDraft })}
          </Text>
          <View style={styles.datePickerActions}>
            <Pressable
              accessibilityRole="button"
              disabled={screenModel.inputsDisabled}
              onPress={() => setBirthDatePickerDraft(null)}
              style={[
                styles.datePickerActionButton,
                styles.datePickerCancelButton,
                screenModel.inputsDisabled ? styles.datePickerActionButtonDisabled : null,
              ]}
            >
              <Text style={styles.datePickerCancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={screenModel.inputsDisabled}
              onPress={() => {
                setState((current) =>
                  updateReadyStateField(
                    current,
                    "birthDate",
                    confirmBabyProfileBirthDatePickerDraft({
                      draft: birthDatePickerDraft,
                    }),
                  ),
                );
                setBirthDatePickerDraft(null);
              }}
              style={[
                styles.datePickerActionButton,
                styles.datePickerConfirmButton,
                screenModel.inputsDisabled ? styles.datePickerActionButtonDisabled : null,
              ]}
            >
              <Text style={styles.datePickerConfirmButtonText}>Confirm</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

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
  hasPendingBirthDateDraft,
  setState,
  setBirthDatePickerDraft,
}: {
  disabled: boolean;
  section: BabyProfileRouteModel["sections"][number];
  state: BabyProfileScreenReadyState;
  hasPendingBirthDateDraft: boolean;
  setState: Dispatch<SetStateAction<BabyProfileScreenState>>;
  setBirthDatePickerDraft: Dispatch<SetStateAction<BabyProfileBirthDatePickerDraft | null>>;
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
              hasPendingBirthDateDraft={hasPendingBirthDateDraft}
              setState={setState}
              setBirthDatePickerDraft={setBirthDatePickerDraft}
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
  hasPendingBirthDateDraft,
  setState,
  setBirthDatePickerDraft,
}: {
  disabled: boolean;
  state: BabyProfileScreenReadyState;
  field: ReturnType<typeof createBabyProfileRouteModel>["textFields"][number];
  hasPendingBirthDateDraft: boolean;
  setState: Dispatch<SetStateAction<BabyProfileScreenState>>;
  setBirthDatePickerDraft: Dispatch<SetStateAction<BabyProfileBirthDatePickerDraft | null>>;
}) {
  const chrome = createBabyProfileRouteTextInputChrome(field, {
    disabled,
    hasPendingBirthDateDraft: field.key === "birthDate" ? hasPendingBirthDateDraft : false,
  });

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{field.label}</Text>
      <View style={field.kind === "date" ? styles.dateInputRow : null}>
        <TextInput
          accessibilityHint={chrome.accessibilityHint}
          accessibilityLabel={field.label}
          accessibilityState={chrome.accessibilityState}
          autoCapitalize={chrome.autoCapitalize}
          autoCorrect={chrome.autoCorrect}
          editable={!chrome.inputDisabled}
          keyboardType={chrome.keyboardType}
          maxLength={chrome.maxLength}
          multiline={field.kind === "textarea"}
          onChangeText={(value) => {
            if (field.key === "birthDate") {
              setBirthDatePickerDraft(null);
            }

            setState((current) => updateReadyStateField(current, field.key, value));
          }}
          placeholder={field.placeholder}
          style={[
            styles.textInput,
            field.kind === "date" ? styles.dateInput : null,
            field.kind === "textarea" ? styles.textarea : null,
            chrome.showInvalidOutline ? styles.textInputInvalid : null,
            chrome.inputDisabled ? styles.fieldDisabled : null,
          ]}
          value={state.form.values[field.key]}
        />
        {chrome.showDatePickerAffordance ? (
          <Pressable
            accessibilityHint={chrome.datePickerAccessibilityHint}
            accessibilityLabel={chrome.datePickerLabel}
            accessibilityRole="button"
            accessibilityState={{ disabled: chrome.datePickerDisabled }}
            disabled={chrome.datePickerDisabled}
            onPress={() => {
              if (chrome.datePickerDisabled) {
                return;
              }

              if (Platform.OS === "android") {
                DateTimePickerAndroid.open({
                  maximumDate: new Date(),
                  mode: "date",
                  value: resolveBabyProfileBirthDatePickerValue({
                    currentValue: state.form.values.birthDate,
                  }),
                  onChange(event, selectedDate) {
                    handleAndroidBirthDatePickerChange({
                      event,
                      selectedDate,
                      setState,
                    });
                  },
                });
                return;
              }

              setBirthDatePickerDraft(
                createBabyProfileBirthDatePickerDraft({
                  currentValue: state.form.values.birthDate,
                }),
              );
            }}
            style={[
              styles.datePickerButton,
              chrome.datePickerDisabled ? styles.datePickerButtonDisabled : null,
            ]}
          >
            <Text style={styles.datePickerButtonText}>{chrome.datePickerLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {chrome.supportingText ? (
        <Text style={field.error ? styles.errorText : styles.hintText}>{chrome.supportingText}</Text>
      ) : null}
    </View>
  );
}

function handleAndroidBirthDatePickerChange({
  event,
  selectedDate,
  setState,
}: {
  event: DateTimePickerEvent;
  selectedDate?: Date;
  setState: Dispatch<SetStateAction<BabyProfileScreenState>>;
}) {
  if (event.type !== "set" || !selectedDate) {
    return;
  }

  setState((current) =>
    updateReadyStateField(
      current,
      "birthDate",
      normalizeBabyProfileBirthDateSelection({ selectedDate }),
    ),
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
    backgroundColor: nurseryColors.canvas,
  },
  loadingText: {
    color: nurseryColors.inkMuted,
  },
  container: {
    padding: 20,
    gap: 16,
    backgroundColor: nurseryColors.canvas,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: nurseryColors.peachStrong,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: nurseryColors.ink,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: nurseryColors.inkMuted,
  },
  errorBanner: {
    gap: 10,
    borderRadius: nurseryRadii.card,
    borderWidth: 1,
    borderColor: nurseryColors.errorLine,
    backgroundColor: nurseryColors.errorTint,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  errorBannerTitle: {
    color: nurseryColors.errorText,
    fontSize: 16,
    fontWeight: "700",
  },
  errorBannerText: {
    color: nurseryColors.errorText,
    fontSize: 14,
    lineHeight: 20,
  },
  errorBannerHint: {
    color: nurseryColors.inkSoft,
    fontSize: 13,
    lineHeight: 18,
  },
  errorBannerActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  errorBannerRetryButton: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    borderRadius: nurseryRadii.field,
    backgroundColor: nurseryColors.surfaceStrong,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorBannerRetryButtonText: {
    color: nurseryColors.ink,
    fontWeight: "700",
  },
  errorBannerDismissButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: nurseryRadii.field,
    borderWidth: 1,
    borderColor: nurseryColors.line,
    backgroundColor: nurseryColors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorBannerDismissButtonText: {
    color: nurseryColors.inkSoft,
    fontWeight: "700",
  },
  sectionGroup: {
    gap: 12,
    borderRadius: nurseryRadii.card,
    borderWidth: 1,
    borderColor: nurseryColors.line,
    backgroundColor: nurseryColors.surface,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: nurseryColors.ink,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: nurseryColors.ink,
  },
  dateInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: nurseryColors.line,
    borderRadius: nurseryRadii.field,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: nurseryColors.ink,
    backgroundColor: nurseryColors.surfaceStrong,
  },
  textInputInvalid: {
    borderColor: nurseryColors.errorLine,
    backgroundColor: nurseryColors.errorTint,
  },
  dateInput: {
    flex: 1,
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
    borderColor: nurseryColors.errorLine,
    borderRadius: nurseryRadii.field,
    padding: 8,
    backgroundColor: nurseryColors.errorTint,
  },
  choiceChip: {
    borderRadius: nurseryRadii.pill,
    borderWidth: 1,
    borderColor: nurseryColors.line,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: nurseryColors.surfaceStrong,
  },
  choiceChipInvalid: {
    borderColor: nurseryColors.errorLine,
    backgroundColor: nurseryColors.surfaceStrong,
  },
  choiceChipSelected: {
    borderColor: nurseryColors.primary,
    backgroundColor: nurseryColors.primaryTint,
  },
  choiceChipText: {
    color: nurseryColors.inkSoft,
  },
  choiceChipSelectedText: {
    color: nurseryColors.primaryStrong,
    fontWeight: "600",
  },
  errorText: {
    color: nurseryColors.errorText,
    fontSize: 13,
  },
  datePickerButton: {
    borderRadius: nurseryRadii.field,
    borderWidth: 1,
    borderColor: nurseryColors.line,
    backgroundColor: nurseryColors.primaryTint,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  datePickerButtonDisabled: {
    opacity: 0.6,
  },
  datePickerButtonText: {
    color: nurseryColors.primaryStrong,
    fontWeight: "600",
  },
  hintText: {
    color: nurseryColors.inkMuted,
    fontSize: 13,
  },
  status: {
    color: nurseryColors.sageStrong,
    fontSize: 14,
  },
  datePickerCard: {
    gap: 12,
    borderWidth: 1,
    borderColor: nurseryColors.line,
    borderRadius: nurseryRadii.card,
    backgroundColor: nurseryColors.surfaceStrong,
    padding: 18,
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: nurseryColors.ink,
  },
  datePickerSubtitle: {
    color: nurseryColors.inkMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  datePickerPreview: {
    color: nurseryColors.ink,
    fontSize: 13,
    fontWeight: "600",
  },
  datePickerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  datePickerActionButton: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  datePickerActionButtonDisabled: {
    opacity: 0.6,
  },
  datePickerCancelButton: {
    backgroundColor: nurseryColors.surfaceMuted,
  },
  datePickerCancelButtonText: {
    color: nurseryColors.ink,
    fontWeight: "600",
  },
  datePickerConfirmButton: {
    backgroundColor: nurseryColors.primary,
  },
  datePickerConfirmButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  retryButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: nurseryRadii.button,
    paddingVertical: 16,
    backgroundColor: nurseryColors.surfaceMuted,
    gap: 8,
  },
  retryButtonDisabled: {
    opacity: 0.8,
  },
  retryButtonText: {
    color: nurseryColors.ink,
    fontSize: 16,
    fontWeight: "700",
  },
  submitButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: nurseryRadii.button,
    paddingVertical: 18,
    backgroundColor: nurseryColors.primary,
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
