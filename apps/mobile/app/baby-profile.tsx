import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
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
import type {
  BabyProfileFeedingStyle,
  BabyProfileFormInput,
  BabyProfileSex,
} from "@aibaby/ui";

import {
  createLoadingBabyProfileScreenState,
  loadBabyProfileScreenState,
  saveBabyProfileScreenState,
  updateBabyProfileScreenField,
  type BabyProfileScreenReadyState,
  type BabyProfileScreenState,
} from "../src/features/baby-profile/screenShell.ts";
import { createBabyProfileRouteModel } from "../src/features/baby-profile/routeModel.ts";

export default function BabyProfileRoute() {
  const params = useLocalSearchParams<{ babyId?: string | string[] }>();
  const babyId = Array.isArray(params.babyId) ? params.babyId[0] : params.babyId;

  return <BabyProfileRouteScreen babyId={babyId} />;
}

export function BabyProfileRouteScreen({ babyId }: { babyId?: string }) {
  const [state, setState] = useState<BabyProfileScreenState>(() =>
    createLoadingBabyProfileScreenState(babyId),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setState(createLoadingBabyProfileScreenState(babyId));
    setLoadError(null);

    void loadBabyProfileScreenState({ babyId })
      .then((nextState) => {
        if (!cancelled) {
          setState(nextState);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Failed to load baby profile.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [babyId]);

  if (state.status === "loading") {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Loading baby profile…</Text>
      </View>
    );
  }

  const model = createBabyProfileRouteModel(state);

  async function onSavePress() {
    setIsSaving(true);

    try {
      const saved = await saveBabyProfileScreenState({ state });
      setState(saved);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{model.title}</Text>
      <Text style={styles.subtitle}>{loadError ?? model.subtitle}</Text>

      {model.textFields.slice(0, 2).map((field) => (
        <FormTextField key={field.key} state={state} field={field} setState={setState} />
      ))}

      <ChoiceField
        label="Sex"
        options={model.sexOptions}
        onSelect={(value) => setState((current) => updateReadyStateField(current, "sex", value))}
      />

      <ChoiceField
        label="Feeding style"
        options={model.feedingStyleOptions}
        onSelect={(value) =>
          setState((current) => updateReadyStateField(current, "feedingStyle", value))
        }
      />

      {model.textFields.slice(2).map((field) => (
        <FormTextField key={field.key} state={state} field={field} setState={setState} />
      ))}

      {model.statusMessage ? <Text style={styles.status}>{model.statusMessage}</Text> : null}

      <Pressable
        accessibilityRole="button"
        disabled={isSaving}
        onPress={() => {
          void onSavePress();
        }}
        style={[styles.submitButton, isSaving ? styles.submitButtonDisabled : null]}
      >
        <Text style={styles.submitButtonText}>
          {isSaving ? "Saving…" : model.submitLabel}
        </Text>
      </Pressable>
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

function FormTextField({
  state,
  field,
  setState,
}: {
  state: BabyProfileScreenReadyState;
  field: ReturnType<typeof createBabyProfileRouteModel>["textFields"][number];
  setState: Dispatch<SetStateAction<BabyProfileScreenState>>;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{field.label}</Text>
      <TextInput
        autoCapitalize="sentences"
        multiline={field.kind === "textarea"}
        onChangeText={(value) => {
          setState((current) => updateReadyStateField(current, field.key, value));
        }}
        placeholder={field.placeholder}
        style={[styles.textInput, field.kind === "textarea" ? styles.textarea : null]}
        value={state.form.values[field.key]}
      />
      {field.error ? <Text style={styles.errorText}>{field.error}</Text> : null}
    </View>
  );
}

function ChoiceField<T extends string>({
  label,
  options,
  onSelect,
}: {
  label: string;
  options: Array<{ value: T; label: string; selected: boolean }>;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.choiceRow}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            onPress={() => onSelect(option.value)}
            style={[styles.choiceChip, option.selected ? styles.choiceChipSelected : null]}
          >
            <Text style={option.selected ? styles.choiceChipSelectedText : styles.choiceChipText}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
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
  textarea: {
    minHeight: 92,
    textAlignVertical: "top",
  },
  choiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  choiceChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 12,
    paddingVertical: 8,
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
});
