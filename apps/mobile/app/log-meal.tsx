import { useMemo, useState } from "react";
import { Link, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useMobileSession } from "../src/features/app-shell/MobileSessionContext.tsx";
import {
  appendMealComposerAttachments,
  createMealComposerDraft,
  createMealComposerScreenModel,
  formatMealComposerSubmissionMeta,
  mealComposerQuickActions,
  removeMealComposerAttachment,
  submitMealComposerDraft,
  toggleMealComposerQuickAction,
  type MealComposerAttachment,
  type MealComposerSubmission,
} from "../src/features/chat-input/composer.ts";

export default function LogMealRoute() {
  const params = useLocalSearchParams<{ babyId?: string | string[] }>();
  const session = useMobileSession();
  const routeBabyId = Array.isArray(params.babyId) ? params.babyId[0] : params.babyId;
  const babyId = routeBabyId ?? session.currentBabyId;

  const [draft, setDraft] = useState(createMealComposerDraft);
  const [thread, setThread] = useState<MealComposerSubmission[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isPickingImages, setIsPickingImages] = useState(false);

  const model = useMemo(
    () =>
      createMealComposerScreenModel({
        babyId,
        draft,
      }),
    [babyId, draft],
  );

  async function handlePickImages() {
    if (!model.canAttachPhotos || isPickingImages) {
      return;
    }

    setAttachmentError(null);
    setIsPickingImages(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5,
      });

      if (result.canceled) {
        return;
      }

      const attachments = result.assets.map((asset, index) =>
        toMealComposerAttachment(asset, index),
      );
      setDraft((currentDraft) => appendMealComposerAttachments(currentDraft, attachments));
    } catch (error) {
      setAttachmentError(
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : "We couldn't open the photo library right now.",
      );
    } finally {
      setIsPickingImages(false);
    }
  }

  function handleSubmit() {
    const result = submitMealComposerDraft({
      draft,
    });

    setThread((currentThread) => [result.submission, ...currentThread]);
    setDraft(result.nextDraft);
    setAttachmentError(null);
  }

  const homeHref = babyId ? `/?babyId=${encodeURIComponent(babyId)}` : "/";

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{model.title}</Text>
      <Text style={styles.subtitle}>{model.subtitle}</Text>

      {!babyId ? (
        <View style={styles.warningBanner}>
          <Text style={styles.warningBannerTitle}>Baby profile still required</Text>
          <Text style={styles.warningBannerMessage}>{model.helperText}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Meal draft</Text>
        <Text style={styles.cardSubtitle}>{model.helperText}</Text>

        <View style={styles.quickActionRow}>
          {mealComposerQuickActions.map((action) => {
            const isSelected = draft.quickAction === action.key;

            return (
              <Pressable
                key={action.key}
                accessibilityRole="button"
                disabled={!babyId}
                onPress={() =>
                  setDraft((currentDraft) => toggleMealComposerQuickAction(currentDraft, action.key))
                }
                style={[styles.quickActionChip, isSelected ? styles.quickActionChipSelected : null]}
              >
                <Text
                  style={[
                    styles.quickActionChipText,
                    isSelected ? styles.quickActionChipTextSelected : null,
                  ]}
                >
                  {action.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          multiline
          editable={Boolean(babyId)}
          placeholder="Add a short note like ‘half a bowl of noodles and two pieces of beef’"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={draft.text}
          onChangeText={(text) => setDraft((currentDraft) => ({ ...currentDraft, text }))}
        />

        {draft.attachments.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.attachmentRow}>
            {draft.attachments.map((attachment) => (
              <View key={attachment.id} style={styles.attachmentCard}>
                <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    setDraft((currentDraft) =>
                      removeMealComposerAttachment(currentDraft, attachment.id),
                    )
                  }
                  style={styles.attachmentRemoveButton}
                >
                  <Text style={styles.attachmentRemoveButtonText}>Remove</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            disabled={!model.canAttachPhotos || isPickingImages}
            onPress={handlePickImages}
            style={[styles.secondaryButton, !model.canAttachPhotos ? styles.buttonDisabled : null]}
          >
            <Text style={styles.secondaryButtonText}>
              {isPickingImages ? "Opening photos…" : "Attach photos"}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={model.submitDisabled}
            onPress={handleSubmit}
            style={[styles.primaryButton, model.submitDisabled ? styles.buttonDisabled : null]}
          >
            <Text style={styles.primaryButtonText}>{model.submitLabel}</Text>
          </Pressable>
        </View>

        {attachmentError ? <Text style={styles.errorMessage}>{attachmentError}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Local draft thread</Text>
        <Text style={styles.cardSubtitle}>{model.emptyStateMessage}</Text>

        {thread.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>{model.emptyStateTitle}</Text>
            <Text style={styles.emptyStateMessage}>{model.emptyStateMessage}</Text>
          </View>
        ) : (
          <View style={styles.threadList}>
            {thread.map((submission) => (
              <View key={submission.id} style={styles.threadCard}>
                <Text style={styles.threadMeta}>{formatMealComposerSubmissionMeta(submission)}</Text>
                {submission.text ? <Text style={styles.threadText}>{submission.text}</Text> : null}
                {submission.attachments.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.threadAttachmentRow}
                  >
                    {submission.attachments.map((attachment) => (
                      <Image
                        key={attachment.id}
                        source={{ uri: attachment.uri }}
                        style={styles.threadAttachmentImage}
                      />
                    ))}
                  </ScrollView>
                ) : null}
                <Text style={styles.threadFootnote}>
                  Submission captured locally for the next upload and parsing slices.
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <Link asChild href={homeHref}>
        <Pressable accessibilityRole="button" style={styles.homeButton}>
          <Text style={styles.homeButtonText}>Back to app home</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

function toMealComposerAttachment(
  asset: ImagePicker.ImagePickerAsset,
  index: number,
): MealComposerAttachment {
  const fileName = asset.fileName ?? asset.uri.split("/").pop() ?? `photo-${index + 1}.jpg`;

  return {
    id: asset.assetId ?? `${asset.uri}:${index}`,
    uri: asset.uri,
    fileName,
    width: asset.width,
    height: asset.height,
  };
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    gap: 16,
    backgroundColor: "#f8fafc",
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
  warningBanner: {
    gap: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fdba74",
    backgroundColor: "#fff7ed",
    padding: 16,
  },
  warningBannerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#9a3412",
  },
  warningBannerMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: "#9a3412",
  },
  card: {
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    padding: 18,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  cardSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#475569",
  },
  quickActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickActionChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickActionChipSelected: {
    borderColor: "#2563eb",
    backgroundColor: "#dbeafe",
  },
  quickActionChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  quickActionChipTextSelected: {
    color: "#1d4ed8",
  },
  input: {
    minHeight: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    lineHeight: 22,
    color: "#0f172a",
    backgroundColor: "#ffffff",
    textAlignVertical: "top",
  },
  attachmentRow: {
    gap: 12,
  },
  attachmentCard: {
    width: 132,
    gap: 8,
  },
  attachmentImage: {
    width: 132,
    height: 132,
    borderRadius: 16,
    backgroundColor: "#e2e8f0",
  },
  attachmentRemoveButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingVertical: 8,
  },
  attachmentRemoveButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingVertical: 14,
    backgroundColor: "#ffffff",
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
  },
  primaryButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: "#2563eb",
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  errorMessage: {
    fontSize: 13,
    lineHeight: 18,
    color: "#b91c1c",
  },
  emptyState: {
    gap: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    padding: 16,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  emptyStateMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: "#475569",
  },
  threadList: {
    gap: 12,
  },
  threadCard: {
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#eff6ff",
    padding: 16,
  },
  threadMeta: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: "#1d4ed8",
  },
  threadText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#0f172a",
  },
  threadAttachmentRow: {
    gap: 10,
  },
  threadAttachmentImage: {
    width: 96,
    height: 96,
    borderRadius: 14,
    backgroundColor: "#bfdbfe",
  },
  threadFootnote: {
    fontSize: 13,
    lineHeight: 18,
    color: "#475569",
  },
  homeButton: {
    marginTop: 8,
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
