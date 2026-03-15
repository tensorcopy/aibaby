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

import {
  nurseryColors,
  nurseryRadii,
} from "../src/features/app-shell/nurseryTheme.ts";
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
} from "../src/features/chat-input/composer.ts";
import {
  addMealRecordConfirmationItem,
  createMealRecordConfirmationDraft,
  executeMealDraftGenerationFlow,
  executeMealRecordConfirmationFlow,
  removeMealRecordConfirmationItem,
  updateMealRecordConfirmationDraft,
} from "../src/features/chat-input/draft-confirmation.ts";
import { useMealThread } from "../src/features/chat-input/MealThreadContext.tsx";
import { executeTextMealParseFlow } from "../src/features/chat-input/text-submit.ts";
import {
  type MealThreadEntry,
} from "../src/features/chat-input/thread.ts";
import { executeMealUploadFlow } from "../src/features/chat-input/upload.ts";

export default function LogMealRoute() {
  const params = useLocalSearchParams<{ babyId?: string | string[] }>();
  const routeBabyId = Array.isArray(params.babyId) ? params.babyId[0] : params.babyId;

  return <MealChatExperience babyId={routeBabyId} showHomeButton />;
}

export function MealChatExperience({
  babyId: explicitBabyId,
  showHomeButton = false,
}: {
  babyId?: string;
  showHomeButton?: boolean;
}) {
  const session = useMobileSession();
  const babyId = explicitBabyId ?? session.currentBabyId;
  const { thread, prependEntry, updateEntry } = useMealThread(babyId);

  const [draft, setDraft] = useState(createMealComposerDraft);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isPickingImages, setIsPickingImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  async function handleSubmit() {
    const result = submitMealComposerDraft({
      draft,
    });

    const hasAttachments = result.submission.attachments.length > 0;
    const threadEntry: MealThreadEntry = {
      ...result.submission,
      deliveryStatus: hasAttachments ? "uploading" : "local",
      detailText: hasAttachments
        ? "Uploading photos to the negotiated storage target…"
        : "Sending the text note into the parsing flow…",
    };

    prependEntry(threadEntry);
    setDraft(result.nextDraft);
    setAttachmentError(null);

    if (!babyId) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (hasAttachments) {
        const uploaded = await executeMealUploadFlow({
          babyId,
          submission: result.submission,
          auth: session.auth,
          apiBaseUrl: session.apiBaseUrl,
        });

        updateEntry(result.submission.id, (entry) => ({
          ...entry,
          deliveryStatus: "uploaded",
          remoteMessageId: uploaded.messageId,
          detailText: `Uploaded ${uploaded.uploadedAssets.length} photo${uploaded.uploadedAssets.length === 1 ? "" : "s"} to ${uploaded.messageId}. Image parsing can build on this server-side message next.`,
        }));
      } else {
        const parsed = await executeTextMealParseFlow({
          babyId,
          submission: result.submission,
          auth: session.auth,
          apiBaseUrl: session.apiBaseUrl,
        });
        const generated = await executeMealDraftGenerationFlow({
          babyId,
          sourceMessageId: parsed.messageId,
          auth: session.auth,
          apiBaseUrl: session.apiBaseUrl,
        });

        updateEntry(result.submission.id, (entry) => ({
          ...entry,
          deliveryStatus: "uploaded",
          remoteMessageId: parsed.messageId,
          mealRecord: generated.mealRecord,
          confirmationDraft: createMealRecordConfirmationDraft(generated.mealRecord),
          confirmationState: "idle",
          detailText: generated.mealRecord.followUpQuestion
            ? `${generated.mealRecord.aiSummary} Follow-up: ${generated.mealRecord.followUpQuestion}`
            : generated.mealRecord.aiSummary,
        }));
      }
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : "We couldn't finish the upload handoff right now.";

      setAttachmentError(message);
      updateEntry(result.submission.id, (entry) => ({
        ...entry,
        deliveryStatus: "error",
        detailText: message,
      }));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirm(entryId: string) {
    if (!babyId) {
      return;
    }

    const entry = thread.find((candidate) => candidate.id === entryId);
    if (!entry?.mealRecord || !entry.confirmationDraft) {
      return;
    }

    setAttachmentError(null);
    updateEntry(entryId, (candidate) => ({
      ...candidate,
      confirmationState: "saving",
    }));

    try {
      const confirmed = await executeMealRecordConfirmationFlow({
        babyId,
        mealRecordId: entry.mealRecord.id,
        draft: entry.confirmationDraft,
        auth: session.auth,
        apiBaseUrl: session.apiBaseUrl,
      });

      updateEntry(entryId, (candidate) => ({
        ...candidate,
        mealRecord: confirmed.mealRecord,
        confirmationDraft: createMealRecordConfirmationDraft(confirmed.mealRecord),
        confirmationState: "confirmed",
        detailText: confirmed.mealRecord.aiSummary,
      }));
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : "We couldn't confirm the meal record right now.";
      setAttachmentError(message);
      updateEntry(entryId, (candidate) => ({
        ...candidate,
        confirmationState: "editing",
        detailText: message,
      }));
    }
  }

  const homeHref = babyId ? `/?babyId=${encodeURIComponent(babyId)}` : "/";
  const profileHref = babyId
    ? `/baby-profile?babyId=${encodeURIComponent(babyId)}`
    : "/baby-profile";
  const todayHref = babyId ? `/today?babyId=${encodeURIComponent(babyId)}` : "/today";
  const summariesHref = babyId
    ? `/summaries?babyId=${encodeURIComponent(babyId)}`
    : "/summaries";

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.heroEyebrow}>Meal logging</Text>
      <Text style={styles.title}>Chat with AI Baby</Text>
      <Text style={styles.subtitle}>
        Send a meal note, a photo, or both together and let the assistant turn it into a feeding record.
      </Text>

      <View style={styles.entryShortcutRow}>
        <Link asChild href={profileHref}>
          <Pressable accessibilityRole="button" style={styles.entryShortcutChip}>
            <Text style={styles.entryShortcutText}>Profile</Text>
          </Pressable>
        </Link>
        <Link asChild href={todayHref}>
          <Pressable accessibilityRole="button" style={styles.entryShortcutChip}>
            <Text style={styles.entryShortcutText}>Today</Text>
          </Pressable>
        </Link>
        <Link asChild href={summariesHref}>
          <Pressable accessibilityRole="button" style={styles.entryShortcutChip}>
            <Text style={styles.entryShortcutText}>Summaries</Text>
          </Pressable>
        </Link>
      </View>

      {!babyId ? (
        <View style={styles.warningBanner}>
          <Text style={styles.warningBannerTitle}>Baby profile still required</Text>
          <Text style={styles.warningBannerMessage}>{model.helperText}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardEyebrow}>Compose</Text>
        <Text style={styles.cardTitle}>Send a message</Text>
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
            disabled={model.submitDisabled || isSubmitting}
            onPress={() => {
              void handleSubmit();
            }}
            style={[
              styles.primaryButton,
              model.submitDisabled || isSubmitting ? styles.buttonDisabled : null,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {isSubmitting ? "Uploading…" : model.submitLabel}
            </Text>
          </Pressable>
        </View>

        {attachmentError ? <Text style={styles.errorMessage}>{attachmentError}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardEyebrow}>Conversation</Text>
        <Text style={styles.cardTitle}>Persistent meal chat</Text>
        <Text style={styles.cardSubtitle}>
          Your messages stay here while you move through profile, timeline, and summaries.
        </Text>

        <View style={styles.assistantBubble}>
          <Text style={styles.assistantLabel}>AI Baby</Text>
          <Text style={styles.assistantText}>
            {babyId
              ? "Send a note, a photo, or both together. I’ll keep the meal context here and turn it into a draft record you can confirm."
              : "Create a baby profile first, then start chatting with a meal note or a photo."}
          </Text>
        </View>

        {thread.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>{model.emptyStateTitle}</Text>
            <Text style={styles.emptyStateMessage}>{model.emptyStateMessage}</Text>
          </View>
        ) : (
          <View style={styles.threadList}>
            {thread.map((submission) => (
              <View key={submission.id} style={styles.threadCard}>
                <View style={styles.userBubble}>
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
                </View>

                <View style={styles.assistantBubble}>
                  <Text style={styles.assistantLabel}>AI Baby</Text>
                  {submission.mealRecord ? (
                    <View style={styles.confirmationCard}>
                      <View style={styles.confirmationHeader}>
                        <Text style={styles.confirmationTitle}>Meal draft ready</Text>
                        <Text style={styles.confirmationStatus}>{submission.mealRecord.status}</Text>
                      </View>

                      {submission.confirmationState === "editing" || submission.confirmationState === "saving" ? (
                        <>
                          <View style={styles.quickActionRow}>
                            {mealComposerQuickActions.map((action) => {
                              const isSelected = submission.confirmationDraft?.mealType === action.key;
                              return (
                                <Pressable
                                  key={`${submission.id}:${action.key}`}
                                  accessibilityRole="button"
                                  disabled={submission.confirmationState === "saving"}
                                  onPress={() =>
                                    updateEntry(submission.id, (entry) =>
                                      entry.confirmationDraft
                                        ? {
                                            ...entry,
                                            confirmationDraft: updateMealRecordConfirmationDraft(
                                              entry.confirmationDraft,
                                              { mealType: action.key },
                                            ),
                                          }
                                        : entry,
                                    )
                                  }
                                  style={[
                                    styles.quickActionChip,
                                    isSelected ? styles.quickActionChipSelected : null,
                                  ]}
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

                          {submission.confirmationDraft?.items.map((item, index) => (
                            <View key={item.id} style={styles.editItemCard}>
                              <Text style={styles.editItemLabel}>Item {index + 1}</Text>
                              <TextInput
                                placeholder="Food name"
                                placeholderTextColor="#94a3b8"
                                style={styles.editInput}
                                value={item.foodName}
                                onChangeText={(value) =>
                                  updateEntry(submission.id, (entry) =>
                                    entry.confirmationDraft
                                      ? {
                                          ...entry,
                                          confirmationDraft: updateMealRecordConfirmationDraft(
                                            entry.confirmationDraft,
                                            {
                                              itemId: item.id,
                                              field: "foodName",
                                              value,
                                            },
                                          ),
                                        }
                                      : entry,
                                  )
                                }
                              />
                              <TextInput
                                placeholder="Amount"
                                placeholderTextColor="#94a3b8"
                                style={styles.editInput}
                                value={item.amountText}
                                onChangeText={(value) =>
                                  updateEntry(submission.id, (entry) =>
                                    entry.confirmationDraft
                                      ? {
                                          ...entry,
                                          confirmationDraft: updateMealRecordConfirmationDraft(
                                            entry.confirmationDraft,
                                            {
                                              itemId: item.id,
                                              field: "amountText",
                                              value,
                                            },
                                          ),
                                        }
                                      : entry,
                                  )
                                }
                              />
                              <Pressable
                                accessibilityRole="button"
                                onPress={() =>
                                  updateEntry(submission.id, (entry) =>
                                    entry.confirmationDraft
                                      ? {
                                          ...entry,
                                          confirmationDraft: removeMealRecordConfirmationItem(
                                            entry.confirmationDraft,
                                            item.id,
                                          ),
                                        }
                                      : entry,
                                  )
                                }
                                style={styles.inlineSecondaryButton}
                              >
                                <Text style={styles.inlineSecondaryButtonText}>Remove item</Text>
                              </Pressable>
                            </View>
                          ))}

                          <View style={styles.inlineActionRow}>
                            <Pressable
                              accessibilityRole="button"
                              onPress={() =>
                                updateEntry(submission.id, (entry) =>
                                  entry.confirmationDraft
                                    ? {
                                        ...entry,
                                        confirmationDraft: addMealRecordConfirmationItem(
                                          entry.confirmationDraft,
                                        ),
                                      }
                                    : entry,
                                )
                              }
                              style={styles.inlineSecondaryButton}
                            >
                              <Text style={styles.inlineSecondaryButtonText}>Add item</Text>
                            </Pressable>
                            <Pressable
                              accessibilityRole="button"
                              onPress={() =>
                                updateEntry(submission.id, (entry) =>
                                  entry.mealRecord
                                    ? {
                                        ...entry,
                                        confirmationDraft: createMealRecordConfirmationDraft(
                                          entry.mealRecord,
                                        ),
                                        confirmationState: "idle",
                                        detailText: entry.mealRecord.aiSummary,
                                      }
                                    : entry,
                                )
                              }
                              style={styles.inlineSecondaryButton}
                            >
                              <Text style={styles.inlineSecondaryButtonText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                              accessibilityRole="button"
                              disabled={submission.confirmationState === "saving"}
                              onPress={() => {
                                void handleConfirm(submission.id);
                              }}
                              style={styles.inlinePrimaryButton}
                            >
                              <Text style={styles.inlinePrimaryButtonText}>
                                {submission.confirmationState === "saving"
                                  ? "Saving…"
                                  : "Save changes"}
                              </Text>
                            </Pressable>
                          </View>
                        </>
                      ) : (
                        <>
                          <Text style={styles.confirmationMealType}>
                            Meal type: {submission.mealRecord.mealType}
                          </Text>
                          <View style={styles.confirmationItemList}>
                            {submission.mealRecord.items.map((item) => (
                              <Text key={item.id} style={styles.confirmationItemText}>
                                • {item.foodName}
                                {item.amountText ? ` — ${item.amountText}` : ""}
                              </Text>
                            ))}
                          </View>
                          <View style={styles.inlineActionRow}>
                            <Pressable
                              accessibilityRole="button"
                              onPress={() => {
                                void handleConfirm(submission.id);
                              }}
                              style={styles.inlinePrimaryButton}
                            >
                              <Text style={styles.inlinePrimaryButtonText}>Confirm draft</Text>
                            </Pressable>
                            <Pressable
                              accessibilityRole="button"
                              onPress={() =>
                                updateEntry(submission.id, (entry) => ({
                                  ...entry,
                                  confirmationState: "editing",
                                }))
                              }
                              style={styles.inlineSecondaryButton}
                            >
                              <Text style={styles.inlineSecondaryButtonText}>Edit draft</Text>
                            </Pressable>
                          </View>
                        </>
                      )}
                    </View>
                  ) : null}

                  <Text
                    style={[
                      styles.threadFootnote,
                      submission.deliveryStatus === "error" ? styles.threadFootnoteError : null,
                    ]}
                  >
                    {submission.detailText}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {showHomeButton ? (
        <Link asChild href={homeHref}>
          <Pressable accessibilityRole="button" style={styles.homeButton}>
            <Text style={styles.homeButtonText}>Back to chat home</Text>
          </Pressable>
        </Link>
      ) : null}
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
    mimeType: asset.mimeType ?? inferAttachmentMimeType(fileName),
    byteSize: asset.fileSize,
    width: asset.width,
    height: asset.height,
  };
}

function inferAttachmentMimeType(fileName: string): string {
  const normalized = fileName.toLowerCase();

  if (normalized.endsWith(".png")) {
    return "image/png";
  }

  if (normalized.endsWith(".webp")) {
    return "image/webp";
  }

  return "image/jpeg";
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    gap: 18,
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
    fontSize: 16,
    lineHeight: 24,
    color: nurseryColors.inkMuted,
  },
  entryShortcutRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  entryShortcutChip: {
    borderRadius: nurseryRadii.pill,
    borderWidth: 1,
    borderColor: nurseryColors.line,
    backgroundColor: nurseryColors.surfaceStrong,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  entryShortcutText: {
    fontSize: 14,
    fontWeight: "700",
    color: nurseryColors.primaryStrong,
  },
  warningBanner: {
    gap: 6,
    borderRadius: nurseryRadii.card,
    borderWidth: 1,
    borderColor: nurseryColors.peach,
    backgroundColor: nurseryColors.surface,
    padding: 18,
  },
  warningBannerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: nurseryColors.peachStrong,
  },
  warningBannerMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: nurseryColors.peachStrong,
  },
  card: {
    gap: 12,
    borderRadius: nurseryRadii.card,
    borderWidth: 1,
    borderColor: nurseryColors.line,
    backgroundColor: nurseryColors.surface,
    padding: 20,
  },
  cardEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: nurseryColors.inkMuted,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: nurseryColors.ink,
  },
  cardSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: nurseryColors.inkMuted,
  },
  quickActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickActionChip: {
    borderRadius: nurseryRadii.pill,
    borderWidth: 1,
    borderColor: nurseryColors.line,
    backgroundColor: nurseryColors.surfaceStrong,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickActionChipSelected: {
    borderColor: nurseryColors.berry,
    backgroundColor: nurseryColors.berry,
  },
  quickActionChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: nurseryColors.inkSoft,
  },
  quickActionChipTextSelected: {
    color: nurseryColors.berryStrong,
  },
  input: {
    minHeight: 120,
    borderRadius: nurseryRadii.card,
    borderWidth: 1,
    borderColor: nurseryColors.line,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    lineHeight: 22,
    color: nurseryColors.ink,
    backgroundColor: nurseryColors.surfaceStrong,
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
    borderRadius: nurseryRadii.card,
    backgroundColor: nurseryColors.primaryTint,
  },
  attachmentRemoveButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: nurseryRadii.field,
    borderWidth: 1,
    borderColor: nurseryColors.line,
    paddingVertical: 8,
    backgroundColor: nurseryColors.surfaceStrong,
  },
  attachmentRemoveButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: nurseryColors.inkSoft,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: nurseryRadii.button,
    borderWidth: 1,
    borderColor: nurseryColors.line,
    paddingVertical: 16,
    backgroundColor: nurseryColors.surfaceStrong,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: nurseryColors.inkSoft,
  },
  primaryButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: nurseryRadii.button,
    paddingVertical: 16,
    backgroundColor: nurseryColors.primary,
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
    color: nurseryColors.errorText,
  },
  emptyState: {
    gap: 6,
    borderRadius: nurseryRadii.card,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: nurseryColors.line,
    backgroundColor: nurseryColors.surfaceMuted,
    padding: 18,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: nurseryColors.ink,
  },
  emptyStateMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: nurseryColors.inkMuted,
  },
  threadList: {
    gap: 12,
  },
  threadCard: {
    gap: 10,
  },
  userBubble: {
    gap: 10,
    borderRadius: nurseryRadii.card,
    borderWidth: 1,
    borderColor: nurseryColors.line,
    backgroundColor: nurseryColors.primaryTint,
    padding: 18,
    alignSelf: "flex-end",
  },
  assistantBubble: {
    gap: 10,
    borderRadius: nurseryRadii.card,
    borderWidth: 1,
    borderColor: nurseryColors.line,
    backgroundColor: nurseryColors.surfaceStrong,
    padding: 18,
  },
  threadMeta: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: nurseryColors.peachStrong,
  },
  threadText: {
    fontSize: 15,
    lineHeight: 22,
    color: nurseryColors.ink,
  },
  threadAttachmentRow: {
    gap: 10,
  },
  threadAttachmentImage: {
    width: 96,
    height: 96,
    borderRadius: nurseryRadii.field,
    backgroundColor: nurseryColors.primaryTint,
  },
  assistantLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: nurseryColors.primaryStrong,
  },
  assistantText: {
    fontSize: 15,
    lineHeight: 22,
    color: nurseryColors.ink,
  },
  confirmationCard: {
    gap: 10,
    borderRadius: nurseryRadii.field,
    backgroundColor: nurseryColors.surfaceMuted,
    padding: 16,
  },
  confirmationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  confirmationTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: nurseryColors.ink,
  },
  confirmationStatus: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    color: nurseryColors.primaryStrong,
  },
  confirmationMealType: {
    fontSize: 14,
    fontWeight: "600",
    color: nurseryColors.inkSoft,
  },
  confirmationItemList: {
    gap: 4,
  },
  confirmationItemText: {
    fontSize: 14,
    lineHeight: 20,
    color: nurseryColors.inkSoft,
  },
  editItemCard: {
    gap: 8,
    borderRadius: nurseryRadii.field,
    backgroundColor: nurseryColors.surfaceStrong,
    padding: 12,
  },
  editItemLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: nurseryColors.inkSoft,
  },
  editInput: {
    borderRadius: nurseryRadii.field,
    borderWidth: 1,
    borderColor: nurseryColors.line,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: nurseryColors.ink,
    backgroundColor: nurseryColors.surfaceStrong,
  },
  inlineActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  inlinePrimaryButton: {
    borderRadius: nurseryRadii.field,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: nurseryColors.primary,
  },
  inlinePrimaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  inlineSecondaryButton: {
    borderRadius: nurseryRadii.field,
    borderWidth: 1,
    borderColor: nurseryColors.line,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: nurseryColors.surfaceStrong,
  },
  inlineSecondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: nurseryColors.inkSoft,
  },
  threadFootnote: {
    fontSize: 13,
    lineHeight: 18,
    color: nurseryColors.inkMuted,
  },
  threadFootnoteError: {
    color: nurseryColors.errorText,
  },
  homeButton: {
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: nurseryRadii.button,
    paddingVertical: 16,
    backgroundColor: nurseryColors.primaryStrong,
  },
  homeButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
