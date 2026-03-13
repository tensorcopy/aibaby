import { useEffect, useMemo, useState } from "react";
import { Link } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { toBabyProfileLoadRequest } from "../baby-profile/loadRequest.ts";
import {
  BabyProfileTransportError,
  executeBabyProfileLoadRequest,
  type BabyProfileResponse,
} from "../baby-profile/transport.ts";
import {
  appendMealLogImageDraft,
  canSubmitMealLogComposerDraft,
  createMealLogComposerDraft,
  createMealLogComposerSubmission,
  removeMealLogImageDraft,
  updateMealLogComposerText,
} from "./draft.ts";
import type { MobileSessionContextValue } from "../app-shell/mobileSession.ts";

type MealLogProfileState =
  | {
      status: "idle" | "loading";
      profile?: undefined;
      message?: undefined;
    }
  | {
      status: "ready";
      profile: BabyProfileResponse;
      message?: undefined;
    }
  | {
      status: "error";
      profile?: undefined;
      message: string;
    };

export function MealLogRoute({
  babyId,
  session,
}: {
  babyId?: string;
  session: MobileSessionContextValue;
}) {
  const [profileState, setProfileState] = useState<MealLogProfileState>({
    status: "idle",
  });
  const [draft, setDraft] = useState(createMealLogComposerDraft);
  const [lastSubmittedSummary, setLastSubmittedSummary] = useState<ReturnType<
    typeof createMealLogComposerSubmission
  > | null>(null);

  useEffect(() => {
    const shouldLoadProfile = Boolean(babyId || session.auth);

    if (!shouldLoadProfile) {
      setProfileState({ status: "idle" });
      return;
    }

    let cancelled = false;
    setProfileState({ status: "loading" });

    executeBabyProfileLoadRequest({
      request: toBabyProfileLoadRequest(babyId),
      auth: session.auth,
    })
      .then((profile) => {
        if (!cancelled) {
          setProfileState({ status: "ready", profile });
        }
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        if (error instanceof BabyProfileTransportError && error.status === 404) {
          setProfileState({
            status: "error",
            message: "Create a baby profile first so meal drafts attach to the right child.",
          });
          return;
        }

        setProfileState({
          status: "error",
          message: getMealLogProfileErrorMessage(error),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [babyId, session.auth]);

  const homeHref = babyId ? `/?babyId=${encodeURIComponent(babyId)}` : "/";
  const activeBabyLabel = useMemo(() => {
    if (profileState.status === "ready") {
      return `${profileState.profile.name} · ${profileState.profile.feedingStyle}`;
    }

    return babyId ? `Baby ID ${babyId}` : "No active baby profile";
  }, [babyId, profileState]);
  const submitDisabled = !canSubmitMealLogComposerDraft(draft) || profileState.status !== "ready";

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Log a meal</Text>
        <Text style={styles.subtitle}>
          Capture a quick feeding note with text, photo drafts, or both. This slice ships the
          mobile composer UI before the upload pipeline is wired in.
        </Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusEyebrow}>Active baby</Text>
        <Text style={styles.statusTitle}>{activeBabyLabel}</Text>
        <Text style={styles.statusMessage}>
          {profileState.status === "ready"
            ? "Drafts are scoped to the current baby profile so the next API slice can submit without changing this screen again."
            : profileState.status === "loading"
              ? "Loading the active baby profile…"
              : "This route needs a saved baby profile before meal drafts can be submitted."}
        </Text>
      </View>

      {profileState.status === "error" ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerTitle}>Meal logging is blocked</Text>
          <Text style={styles.errorBannerMessage}>{profileState.message}</Text>
        </View>
      ) : null}

      <View style={styles.composerCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Meal note</Text>
          <Text style={styles.sectionHelper}>
            Start with a sentence like “Lunch: half a bowl of noodles and two pieces of beef.”
          </Text>
        </View>
        <View style={styles.mealTypeRow}>
          {[
            { label: "Breakfast", prefix: "Breakfast: " },
            { label: "Lunch", prefix: "Lunch: " },
            { label: "Dinner", prefix: "Dinner: " },
            { label: "Snack", prefix: "Snack: " },
          ].map((chip) => (
            <Pressable
              key={chip.label}
              accessibilityRole="button"
              onPress={() => {
                setDraft((current) => {
                  if (current.text.trim().length > 0) {
                    return current;
                  }

                  return updateMealLogComposerText(current, chip.prefix);
                });
              }}
              style={styles.mealTypeChip}
            >
              <Text style={styles.mealTypeChipText}>{chip.label}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          accessibilityLabel="Meal note"
          multiline
          numberOfLines={5}
          placeholder="What did the baby eat? Add portions, supplements, or anything the AI should notice."
          placeholderTextColor="#94a3b8"
          style={styles.textInput}
          value={draft.text}
          onChangeText={(text) => {
            setDraft((current) => updateMealLogComposerText(current, text));
          }}
        />
      </View>

      <View style={styles.composerCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Image drafts</Text>
          <Text style={styles.sectionHelper}>
            Add the local photo slots you expect to send. AIB-022 will replace these placeholders
            with the real picker and upload flow.
          </Text>
        </View>
        <View style={styles.attachmentActionRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setDraft((current) => appendMealLogImageDraft(current, "plate"));
            }}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Add plate photo</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setDraft((current) => appendMealLogImageDraft(current, "detail"));
            }}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Add detail photo</Text>
          </Pressable>
        </View>
        {draft.attachments.length === 0 ? (
          <View style={styles.emptyAttachmentCard}>
            <Text style={styles.emptyAttachmentTitle}>No image drafts yet</Text>
            <Text style={styles.emptyAttachmentMessage}>
              The composer is ready for text-only logging now, and the image tray is ready for the
              real media picker next.
            </Text>
          </View>
        ) : (
          <View style={styles.attachmentList}>
            {draft.attachments.map((attachment) => (
              <View key={attachment.id} style={styles.attachmentCard}>
                <View style={styles.attachmentCopy}>
                  <Text style={styles.attachmentLabel}>{attachment.label}</Text>
                  <Text style={styles.attachmentMeta}>
                    {attachment.kind === "plate"
                      ? "Use for the full plate or bowl"
                      : "Use for labels, supplements, or close-up details"}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setDraft((current) => removeMealLogImageDraft(current, attachment.id));
                  }}
                  style={styles.removeAttachmentButton}
                >
                  <Text style={styles.removeAttachmentButtonText}>Remove</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.composerCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Submission preview</Text>
          <Text style={styles.sectionHelper}>
            Keep the send affordance honest before transport is connected.
          </Text>
        </View>
        <Text style={styles.previewMessage}>
          {canSubmitMealLogComposerDraft(draft)
            ? createMealLogComposerSubmission(draft).summary
            : "Add a meal note or at least one image draft to enable submission."}
        </Text>
        <Pressable
          accessibilityRole="button"
          disabled={submitDisabled}
          onPress={() => {
            const submission = createMealLogComposerSubmission(draft);
            setLastSubmittedSummary(submission);
            setDraft(createMealLogComposerDraft());
          }}
          style={[styles.primaryButton, submitDisabled ? styles.primaryButtonDisabled : null]}
        >
          <Text style={styles.primaryButtonText}>Queue local draft</Text>
        </Pressable>
      </View>

      {lastSubmittedSummary ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Last local draft</Text>
          <Text style={styles.resultSummary}>{lastSubmittedSummary.summary}</Text>
          <Text style={styles.resultMeta}>
            Text note: {lastSubmittedSummary.text ?? "none"}
          </Text>
          <Text style={styles.resultMeta}>
            Image drafts: {lastSubmittedSummary.attachmentLabels.join(", ") || "none"}
          </Text>
        </View>
      ) : null}

      <Link asChild href={homeHref}>
        <Pressable accessibilityRole="button" style={styles.homeButton}>
          <Text style={styles.homeButtonText}>Back to app home</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

function getMealLogProfileErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "We couldn't load the active baby profile right now.";
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    gap: 16,
    backgroundColor: "#f8fafc",
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: "#475569",
  },
  statusCard: {
    gap: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#eff6ff",
    padding: 18,
  },
  statusEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#1d4ed8",
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
  },
  statusMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: "#334155",
  },
  errorBanner: {
    gap: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
    padding: 16,
  },
  errorBannerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#b91c1c",
  },
  errorBannerMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: "#b91c1c",
  },
  composerCard: {
    gap: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    padding: 18,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  sectionHelper: {
    fontSize: 14,
    lineHeight: 20,
    color: "#475569",
  },
  mealTypeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  mealTypeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mealTypeChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  textInput: {
    minHeight: 132,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 14,
    paddingVertical: 14,
    textAlignVertical: "top",
    fontSize: 16,
    lineHeight: 22,
    color: "#0f172a",
  },
  attachmentActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#93c5fd",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1d4ed8",
  },
  emptyAttachmentCard: {
    gap: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    backgroundColor: "#f8fafc",
    padding: 16,
  },
  emptyAttachmentTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  emptyAttachmentMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: "#475569",
  },
  attachmentList: {
    gap: 10,
  },
  attachmentCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dbeafe",
    backgroundColor: "#f8fbff",
    padding: 14,
  },
  attachmentCopy: {
    flex: 1,
    gap: 4,
  },
  attachmentLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  attachmentMeta: {
    fontSize: 13,
    lineHeight: 18,
    color: "#475569",
  },
  removeAttachmentButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff1f2",
  },
  removeAttachmentButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#be123c",
  },
  previewMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: "#334155",
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: "#2563eb",
  },
  primaryButtonDisabled: {
    backgroundColor: "#93c5fd",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  resultCard: {
    gap: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#86efac",
    backgroundColor: "#f0fdf4",
    padding: 16,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#166534",
  },
  resultSummary: {
    fontSize: 14,
    lineHeight: 20,
    color: "#166534",
  },
  resultMeta: {
    fontSize: 13,
    lineHeight: 18,
    color: "#166534",
  },
  homeButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: "#0f172a",
  },
  homeButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
