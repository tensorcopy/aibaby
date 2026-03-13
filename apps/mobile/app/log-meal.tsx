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
import {
  addMealRecordConfirmationItem,
  createMealRecordConfirmationDraft,
  executeMealDraftGenerationFlow,
  executeMealRecordConfirmationFlow,
  removeMealRecordConfirmationItem,
  updateMealRecordConfirmationDraft,
  type ConfirmableMealRecord,
  type MealRecordConfirmationDraft,
} from "../src/features/chat-input/draft-confirmation.ts";
import { executeTextMealParseFlow } from "../src/features/chat-input/text-submit.ts";
import { executeMealUploadFlow } from "../src/features/chat-input/upload.ts";

type MealThreadEntry = MealComposerSubmission & {
  deliveryStatus: "local" | "uploading" | "uploaded" | "error";
  detailText: string;
  remoteMessageId?: string;
  mealRecord?: ConfirmableMealRecord;
  confirmationDraft?: MealRecordConfirmationDraft;
  confirmationState?: "idle" | "editing" | "saving" | "confirmed";
};

export default function LogMealRoute() {
  const params = useLocalSearchParams<{ babyId?: string | string[] }>();
  const session = useMobileSession();
  const routeBabyId = Array.isArray(params.babyId) ? params.babyId[0] : params.babyId;
  const babyId = routeBabyId ?? session.currentBabyId;

  const [draft, setDraft] = useState(createMealComposerDraft);
  const [thread, setThread] = useState<MealThreadEntry[]>([]);
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

    setThread((currentThread) => [threadEntry, ...currentThread]);
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

        setThread((currentThread) =>
          currentThread.map((entry) =>
            entry.id === result.submission.id
              ? {
                  ...entry,
                  deliveryStatus: "uploaded",
                  remoteMessageId: uploaded.messageId,
                  detailText: `Uploaded ${uploaded.uploadedAssets.length} photo${uploaded.uploadedAssets.length === 1 ? "" : "s"} to ${uploaded.messageId}. Image parsing can build on this server-side message next.`,
                }
              : entry,
          ),
        );
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

        setThread((currentThread) =>
          currentThread.map((entry) =>
            entry.id === result.submission.id
              ? {
                  ...entry,
                  deliveryStatus: "uploaded",
                  remoteMessageId: parsed.messageId,
                  mealRecord: generated.mealRecord,
                  confirmationDraft: createMealRecordConfirmationDraft(generated.mealRecord),
                  confirmationState: "idle",
                  detailText: generated.mealRecord.followUpQuestion
                    ? `${generated.mealRecord.aiSummary} Follow-up: ${generated.mealRecord.followUpQuestion}`
                    : generated.mealRecord.aiSummary,
                }
              : entry,
          ),
        );
      }
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : "We couldn't finish the upload handoff right now.";

      setAttachmentError(message);
      setThread((currentThread) =>
        currentThread.map((entry) =>
          entry.id === result.submission.id
            ? {
                ...entry,
                deliveryStatus: "error",
                detailText: message,
              }
            : entry,
        ),
      );
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
    setThread((currentThread) =>
      currentThread.map((candidate) =>
        candidate.id === entryId
          ? {
              ...candidate,
              confirmationState: "saving",
            }
          : candidate,
      ),
    );

    try {
      const confirmed = await executeMealRecordConfirmationFlow({
        babyId,
        mealRecordId: entry.mealRecord.id,
        draft: entry.confirmationDraft,
        auth: session.auth,
        apiBaseUrl: session.apiBaseUrl,
      });

      setThread((currentThread) =>
        currentThread.map((candidate) =>
          candidate.id === entryId
            ? {
                ...candidate,
                mealRecord: confirmed.mealRecord,
                confirmationDraft: createMealRecordConfirmationDraft(confirmed.mealRecord),
                confirmationState: "confirmed",
                detailText: confirmed.mealRecord.aiSummary,
              }
            : candidate,
        ),
      );
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : "We couldn't confirm the meal record right now.";
      setAttachmentError(message);
      setThread((currentThread) =>
        currentThread.map((candidate) =>
          candidate.id === entryId
            ? {
                ...candidate,
                confirmationState: "editing",
                detailText: message,
              }
            : candidate,
        ),
      );
    }
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
        <Text style={styles.cardTitle}>Meal draft thread</Text>
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

                {submission.mealRecord ? (
                  <View style={styles.confirmationCard}>
                    <View style={styles.confirmationHeader}>
                      <Text style={styles.confirmationTitle}>AI meal draft</Text>
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
                                  setThread((currentThread) =>
                                    currentThread.map((entry) =>
                                      entry.id === submission.id && entry.confirmationDraft
                                        ? {
                                            ...entry,
                                            confirmationDraft: updateMealRecordConfirmationDraft(
                                              entry.confirmationDraft,
                                              { mealType: action.key },
                                            ),
                                          }
                                        : entry,
                                    ),
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
                                setThread((currentThread) =>
                                  currentThread.map((entry) =>
                                    entry.id === submission.id && entry.confirmationDraft
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
                                  ),
                                )
                              }
                            />
                            <TextInput
                              placeholder="Amount"
                              placeholderTextColor="#94a3b8"
                              style={styles.editInput}
                              value={item.amountText}
                              onChangeText={(value) =>
                                setThread((currentThread) =>
                                  currentThread.map((entry) =>
                                    entry.id === submission.id && entry.confirmationDraft
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
                                  ),
                                )
                              }
                            />
                            <Pressable
                              accessibilityRole="button"
                              onPress={() =>
                                setThread((currentThread) =>
                                  currentThread.map((entry) =>
                                    entry.id === submission.id && entry.confirmationDraft
                                      ? {
                                          ...entry,
                                          confirmationDraft: removeMealRecordConfirmationItem(
                                            entry.confirmationDraft,
                                            item.id,
                                          ),
                                        }
                                      : entry,
                                  ),
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
                              setThread((currentThread) =>
                                currentThread.map((entry) =>
                                  entry.id === submission.id && entry.confirmationDraft
                                    ? {
                                        ...entry,
                                        confirmationDraft: addMealRecordConfirmationItem(
                                          entry.confirmationDraft,
                                        ),
                                      }
                                    : entry,
                                ),
                              )
                            }
                            style={styles.inlineSecondaryButton}
                          >
                            <Text style={styles.inlineSecondaryButtonText}>Add item</Text>
                          </Pressable>
                          <Pressable
                            accessibilityRole="button"
                            onPress={() =>
                              setThread((currentThread) =>
                                currentThread.map((entry) =>
                                  entry.id === submission.id && entry.mealRecord
                                    ? {
                                        ...entry,
                                        confirmationDraft: createMealRecordConfirmationDraft(
                                          entry.mealRecord,
                                        ),
                                        confirmationState: "idle",
                                        detailText: entry.mealRecord.aiSummary,
                                      }
                                    : entry,
                                ),
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
                              setThread((currentThread) =>
                                currentThread.map((entry) =>
                                  entry.id === submission.id
                                    ? {
                                        ...entry,
                                        confirmationState: "editing",
                                      }
                                    : entry,
                                ),
                              )
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
  confirmationCard: {
    gap: 10,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    padding: 14,
  },
  confirmationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  confirmationTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  confirmationStatus: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    color: "#2563eb",
  },
  confirmationMealType: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  confirmationItemList: {
    gap: 4,
  },
  confirmationItemText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#334155",
  },
  editItemCard: {
    gap: 8,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    padding: 12,
  },
  editItemLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },
  editInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  inlineActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  inlinePrimaryButton: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#2563eb",
  },
  inlinePrimaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  inlineSecondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
  },
  inlineSecondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  threadFootnote: {
    fontSize: 13,
    lineHeight: 18,
    color: "#475569",
  },
  threadFootnoteError: {
    color: "#b91c1c",
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
