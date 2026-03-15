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
import { executeMealRecordConfirmationFlow } from "../src/features/chat-input/meal-record-confirm.ts";
import {
  appendMealRecordCorrectionItem,
  createMealRecordCorrectionDraft,
  mealRecordTypeOptions,
  removeMealRecordCorrectionItem,
  updateMealRecordCorrectionItemField,
  updateMealRecordCorrectionMealType,
  type MealRecord,
  type MealRecordCorrectionDraft,
  type MealRecordItem,
  type MealRecordType,
} from "../src/features/chat-input/meal-record-confirmation.ts";
import { executeMealUploadFlow } from "../src/features/chat-input/upload.ts";
import { executeTextMealParseFlow } from "../src/features/chat-input/text-submit.ts";
import {
  BrandScrollView,
  brandColors,
  brandLayout,
  brandShadow,
} from "../src/design/brand.tsx";

type MealThreadEntry = MealComposerSubmission & {
  deliveryStatus: "local" | "uploading" | "uploaded" | "error";
  detailText: string;
  remoteMessageId?: string;
  mealRecord?: MealRecord;
  correctionDraft?: MealRecordCorrectionDraft;
  isEditingCorrection?: boolean;
  confirmationStatus?: "draft" | "saving" | "confirmed";
  correctionError?: string | null;
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

  function updateThreadEntry(
    entryId: string,
    updater: (entry: MealThreadEntry) => MealThreadEntry,
  ) {
    setThread((currentThread) =>
      currentThread.map((entry) => (entry.id === entryId ? updater(entry) : entry)),
    );
  }

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

        setThread((currentThread) =>
          currentThread.map((entry) =>
            entry.id === result.submission.id
              ? {
                  ...entry,
                  deliveryStatus: "uploaded",
                  remoteMessageId: parsed.messageId,
                  mealRecord: parsed.draftRecord,
                  correctionDraft: createMealRecordCorrectionDraft({
                    mealRecord: parsed.draftRecord,
                  }),
                  isEditingCorrection: Boolean(parsed.parsedCandidate.followUpQuestion),
                  confirmationStatus:
                    parsed.draftRecord.status === "confirmed" ? "confirmed" : "draft",
                  correctionError: null,
                  detailText: buildDraftRecordThreadDetail(parsed),
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

  function handleOpenCorrectionEditor(entryId: string) {
    updateThreadEntry(entryId, (entry) =>
      entry.mealRecord
        ? {
            ...entry,
            isEditingCorrection: true,
            correctionDraft: createMealRecordCorrectionDraft({
              mealRecord: entry.mealRecord,
            }),
            correctionError: null,
          }
        : entry,
    );
  }

  function handleCancelCorrectionEditor(entryId: string) {
    updateThreadEntry(entryId, (entry) =>
      entry.mealRecord
        ? {
            ...entry,
            isEditingCorrection: false,
            correctionDraft: createMealRecordCorrectionDraft({
              mealRecord: entry.mealRecord,
            }),
            correctionError: null,
          }
        : entry,
    );
  }

  function handleChangeCorrectionMealType(entryId: string, mealType: MealRecordType) {
    updateThreadEntry(entryId, (entry) =>
      entry.correctionDraft
        ? {
            ...entry,
            correctionDraft: updateMealRecordCorrectionMealType({
              draft: entry.correctionDraft,
              mealType,
            }),
          }
        : entry,
    );
  }

  function handleChangeCorrectionItemField(
    entryId: string,
    itemId: string,
    field: "foodName" | "amountText",
    value: string,
  ) {
    updateThreadEntry(entryId, (entry) =>
      entry.correctionDraft
        ? {
            ...entry,
            correctionDraft: updateMealRecordCorrectionItemField({
              draft: entry.correctionDraft,
              itemId,
              field,
              value,
            }),
          }
        : entry,
    );
  }

  function handleAddCorrectionItem(entryId: string) {
    updateThreadEntry(entryId, (entry) =>
      entry.correctionDraft
        ? {
            ...entry,
            correctionDraft: appendMealRecordCorrectionItem(entry.correctionDraft),
          }
        : entry,
    );
  }

  function handleRemoveCorrectionItem(entryId: string, itemId: string) {
    updateThreadEntry(entryId, (entry) =>
      entry.correctionDraft
        ? {
            ...entry,
            correctionDraft: removeMealRecordCorrectionItem({
              draft: entry.correctionDraft,
              itemId,
            }),
          }
        : entry,
    );
  }

  async function handleConfirmDraft(entryId: string) {
    const entry = thread.find((candidate) => candidate.id === entryId);

    if (!entry?.mealRecord) {
      return;
    }

    const correctionDraft =
      entry.correctionDraft ??
      createMealRecordCorrectionDraft({
        mealRecord: entry.mealRecord,
      });

    updateThreadEntry(entryId, (current) => ({
      ...current,
      confirmationStatus: "saving",
      correctionError: null,
    }));

    try {
      const confirmed = await executeMealRecordConfirmationFlow({
        mealRecordId: entry.mealRecord.id,
        correctionDraft,
        auth: session.auth,
        apiBaseUrl: session.apiBaseUrl,
      });

      updateThreadEntry(entryId, (current) => ({
        ...current,
        mealRecord: confirmed.mealRecord,
        correctionDraft: createMealRecordCorrectionDraft({
          mealRecord: confirmed.mealRecord,
        }),
        isEditingCorrection: false,
        confirmationStatus: "confirmed",
        correctionError: null,
        detailText: buildConfirmedMealRecordThreadDetail(confirmed.mealRecord),
      }));
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : "We couldn't confirm this record right now.";

      updateThreadEntry(entryId, (current) => ({
        ...current,
        confirmationStatus: current.mealRecord?.status === "confirmed" ? "confirmed" : "draft",
        correctionError: message,
      }));
    }
  }

  const homeHref = babyId ? `/?babyId=${encodeURIComponent(babyId)}` : "/";

  return (
    <BrandScrollView keyboardShouldPersistTaps="handled">
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Baby mealtime studio</Text>
        <Text style={styles.title}>{model.title}</Text>
        <Text style={styles.subtitle}>{model.subtitle}</Text>
        <View style={styles.heroPillRow}>
          <View style={[styles.heroPill, styles.heroPillWarm]}>
            <Text style={styles.heroPillText}>Photo-first capture</Text>
          </View>
          <View style={[styles.heroPill, styles.heroPillMint]}>
            <Text style={styles.heroPillText}>Quick text note</Text>
          </View>
        </View>
      </View>

      {!babyId ? (
        <View style={styles.warningBanner}>
          <Text style={styles.warningBannerTitle}>Baby profile still required</Text>
          <Text style={styles.warningBannerMessage}>{model.helperText}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderCopy}>
            <Text style={styles.cardEyebrow}>Compose</Text>
            <Text style={styles.cardTitle}>Meal draft</Text>
            <Text style={styles.cardSubtitle}>{model.helperText}</Text>
          </View>
          <View style={styles.cardBadge}>
            <Text style={styles.cardBadgeText}>
              {draft.attachments.length > 0 ? `${draft.attachments.length} photos` : "Text note"}
            </Text>
          </View>
        </View>

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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.attachmentRow}
          >
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
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderCopy}>
            <Text style={styles.cardEyebrow}>Review</Text>
            <Text style={styles.cardTitle}>Meal draft thread</Text>
            <Text style={styles.cardSubtitle}>{model.emptyStateMessage}</Text>
          </View>
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
                <Text
                  style={[
                    styles.threadFootnote,
                    submission.deliveryStatus === "error" ? styles.threadFootnoteError : null,
                  ]}
                >
                  {submission.detailText}
                </Text>
                {submission.mealRecord ? (
                  <View style={styles.threadRecordSection}>
                    <View style={styles.threadStatusRow}>
                      <Text
                        style={[
                          styles.threadStatusBadge,
                          submission.confirmationStatus === "confirmed"
                            ? styles.threadStatusBadgeConfirmed
                            : styles.threadStatusBadgePending,
                        ]}
                      >
                        {submission.confirmationStatus === "confirmed" ? "Confirmed" : "Needs confirmation"}
                      </Text>
                    </View>

                    <View style={styles.threadItemList}>
                      {submission.mealRecord.items.map((item) => (
                        <Text key={item.id} style={styles.threadItemText}>
                          {formatMealRecordItem(item)}
                        </Text>
                      ))}
                    </View>

                    {submission.correctionError ? (
                      <Text style={styles.errorMessage}>{submission.correctionError}</Text>
                    ) : null}

                    {submission.confirmationStatus !== "confirmed" && submission.correctionDraft ? (
                      submission.isEditingCorrection ? (
                        <View style={styles.correctionEditor}>
                          <Text style={styles.correctionEditorTitle}>Confirm or correct this draft</Text>

                          <View style={styles.quickActionRow}>
                            {mealRecordTypeOptions.map((option) => {
                              const isSelected = submission.correctionDraft?.mealType === option.key;

                              return (
                                <Pressable
                                  key={`${submission.id}:${option.key}`}
                                  accessibilityRole="button"
                                  disabled={submission.confirmationStatus === "saving"}
                                  onPress={() => handleChangeCorrectionMealType(submission.id, option.key)}
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
                                    {option.label}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>

                          {submission.correctionDraft.items.map((item) => (
                            <View key={item.id} style={styles.correctionItemCard}>
                              <TextInput
                                editable={submission.confirmationStatus !== "saving"}
                                placeholder="Food item"
                                placeholderTextColor="#94a3b8"
                                style={styles.correctionItemInput}
                                value={item.foodName}
                                onChangeText={(value) =>
                                  handleChangeCorrectionItemField(
                                    submission.id,
                                    item.id,
                                    "foodName",
                                    value,
                                  )
                                }
                              />
                              <TextInput
                                editable={submission.confirmationStatus !== "saving"}
                                placeholder="Amount or note"
                                placeholderTextColor="#94a3b8"
                                style={styles.correctionItemInput}
                                value={item.amountText}
                                onChangeText={(value) =>
                                  handleChangeCorrectionItemField(
                                    submission.id,
                                    item.id,
                                    "amountText",
                                    value,
                                  )
                                }
                              />
                              <Pressable
                                accessibilityRole="button"
                                disabled={submission.confirmationStatus === "saving"}
                                onPress={() => handleRemoveCorrectionItem(submission.id, item.id)}
                                style={styles.inlineGhostButton}
                              >
                                <Text style={styles.inlineGhostButtonText}>Remove</Text>
                              </Pressable>
                            </View>
                          ))}

                          <View style={styles.threadActionRow}>
                            <Pressable
                              accessibilityRole="button"
                              disabled={submission.confirmationStatus === "saving"}
                              onPress={() => handleAddCorrectionItem(submission.id)}
                              style={styles.inlineGhostButton}
                            >
                              <Text style={styles.inlineGhostButtonText}>Add item</Text>
                            </Pressable>
                            <Pressable
                              accessibilityRole="button"
                              disabled={submission.confirmationStatus === "saving"}
                              onPress={() => handleCancelCorrectionEditor(submission.id)}
                              style={styles.inlineGhostButton}
                            >
                              <Text style={styles.inlineGhostButtonText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                              accessibilityRole="button"
                              disabled={submission.confirmationStatus === "saving"}
                              onPress={() => {
                                void handleConfirmDraft(submission.id);
                              }}
                              style={[
                                styles.inlinePrimaryButton,
                                submission.confirmationStatus === "saving"
                                  ? styles.buttonDisabled
                                  : null,
                              ]}
                            >
                              <Text style={styles.inlinePrimaryButtonText}>
                                {submission.confirmationStatus === "saving"
                                  ? "Saving…"
                                  : "Save & confirm"}
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.threadActionRow}>
                          <Pressable
                            accessibilityRole="button"
                            disabled={submission.confirmationStatus === "saving"}
                            onPress={() => handleOpenCorrectionEditor(submission.id)}
                            style={styles.inlineGhostButton}
                          >
                            <Text style={styles.inlineGhostButtonText}>Edit draft</Text>
                          </Pressable>
                          <Pressable
                            accessibilityRole="button"
                            disabled={submission.confirmationStatus === "saving"}
                            onPress={() => {
                              void handleConfirmDraft(submission.id);
                            }}
                            style={[
                              styles.inlinePrimaryButton,
                              submission.confirmationStatus === "saving"
                                ? styles.buttonDisabled
                                : null,
                            ]}
                          >
                            <Text style={styles.inlinePrimaryButtonText}>
                              {submission.confirmationStatus === "saving"
                                ? "Saving…"
                                : "Confirm"}
                            </Text>
                          </Pressable>
                        </View>
                      )
                    ) : null}
                  </View>
                ) : null}
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
    </BrandScrollView>
  );
}

function buildDraftRecordThreadDetail(parsed: Awaited<ReturnType<typeof executeTextMealParseFlow>>) {
  const itemCount = parsed.draftRecord.items.length;
  const itemLabel = `${itemCount} item${itemCount === 1 ? "" : "s"}`;
  const draftSummary = `Draft record ${parsed.draftRecord.id} saved as ${parsed.draftRecord.mealType} with ${itemLabel}.`;

  if (parsed.parsedCandidate.followUpQuestion) {
    return `${draftSummary} ${parsed.parsedCandidate.summary} Follow-up: ${parsed.parsedCandidate.followUpQuestion}`;
  }

  return `${draftSummary} ${parsed.parsedCandidate.summary}`;
}

function buildConfirmedMealRecordThreadDetail(mealRecord: MealRecord) {
  const itemCount = mealRecord.items.length;
  const itemLabel = `${itemCount} item${itemCount === 1 ? "" : "s"}`;
  return `Confirmed ${mealRecord.mealType} record ${mealRecord.id} with ${itemLabel}. ${mealRecord.aiSummary}`;
}

function formatMealRecordItem(item: MealRecordItem) {
  return item.amountText?.trim()
    ? `• ${item.foodName} (${item.amountText})`
    : `• ${item.foodName}`;
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
  heroCard: {
    gap: 12,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: "#f5c9b1",
    backgroundColor: "#fff0e5",
    padding: 24,
    ...brandShadow,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#c25e29",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: brandColors.text,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: brandColors.textMuted,
  },
  heroPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  heroPill: {
    borderRadius: brandLayout.pillRadius,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  heroPillWarm: {
    backgroundColor: brandColors.white,
  },
  heroPillMint: {
    backgroundColor: "#dff5ec",
  },
  heroPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: brandColors.text,
  },
  warningBanner: {
    gap: 6,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f2d3ae",
    backgroundColor: brandColors.warningSurface,
    padding: 18,
  },
  warningBannerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: brandColors.warningText,
  },
  warningBannerMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: brandColors.warningText,
  },
  card: {
    gap: 14,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: brandColors.borderSoft,
    backgroundColor: brandColors.surface,
    padding: 22,
    ...brandShadow,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cardHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  cardEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#2d7288",
  },
  cardBadge: {
    alignSelf: "flex-start",
    borderRadius: brandLayout.pillRadius,
    backgroundColor: "#edf9f4",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cardBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: brandColors.mintDeep,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: brandColors.text,
  },
  cardSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: brandColors.textMuted,
  },
  quickActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickActionChip: {
    borderRadius: brandLayout.pillRadius,
    borderWidth: 1,
    borderColor: "#edd3c7",
    backgroundColor: "#fff7f1",
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  quickActionChipSelected: {
    borderColor: "#f5b497",
    backgroundColor: "#ffe1d2",
  },
  quickActionChipText: {
    fontSize: 14,
    fontWeight: "700",
    color: brandColors.textMuted,
  },
  quickActionChipTextSelected: {
    color: "#b6552f",
  },
  input: {
    minHeight: 120,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#edd3c7",
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    lineHeight: 22,
    color: brandColors.text,
    backgroundColor: brandColors.white,
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
    borderRadius: 20,
    backgroundColor: "#ffe2d0",
  },
  attachmentRemoveButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#edd3c7",
    paddingVertical: 9,
  },
  attachmentRemoveButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: brandColors.textMuted,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: brandColors.borderSoft,
    paddingVertical: 15,
    backgroundColor: brandColors.white,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: brandColors.text,
  },
  primaryButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    paddingVertical: 15,
    backgroundColor: brandColors.primary,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: brandColors.white,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  errorMessage: {
    fontSize: 13,
    lineHeight: 18,
    color: brandColors.dangerText,
  },
  emptyState: {
    gap: 6,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#f4c7b5",
    backgroundColor: "#fff9f4",
    padding: 18,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: brandColors.text,
  },
  emptyStateMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: brandColors.textMuted,
  },
  threadList: {
    gap: 14,
  },
  threadCard: {
    gap: 10,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#b7deef",
    backgroundColor: "#f2faff",
    padding: 18,
  },
  threadMeta: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#2d7288",
  },
  threadText: {
    fontSize: 15,
    lineHeight: 22,
    color: brandColors.text,
  },
  threadAttachmentRow: {
    gap: 10,
  },
  threadAttachmentImage: {
    width: 96,
    height: 96,
    borderRadius: 16,
    backgroundColor: "#dff0ff",
  },
  threadFootnote: {
    fontSize: 13,
    lineHeight: 18,
    color: brandColors.textMuted,
  },
  threadFootnoteError: {
    color: brandColors.dangerText,
  },
  threadRecordSection: {
    gap: 10,
  },
  threadStatusRow: {
    flexDirection: "row",
  },
  threadStatusBadge: {
    borderRadius: brandLayout.pillRadius,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
  },
  threadStatusBadgePending: {
    backgroundColor: "#fff1db",
    color: brandColors.warningText,
  },
  threadStatusBadgeConfirmed: {
    backgroundColor: brandColors.successSurface,
    color: brandColors.successText,
  },
  threadItemList: {
    gap: 4,
  },
  threadItemText: {
    fontSize: 14,
    lineHeight: 20,
    color: brandColors.text,
  },
  correctionEditor: {
    gap: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#cde3ee",
    backgroundColor: brandColors.white,
    padding: 14,
  },
  correctionEditorTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: brandColors.text,
  },
  correctionItemCard: {
    gap: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#d8eaf2",
    backgroundColor: "#f8fcff",
    padding: 12,
  },
  correctionItemInput: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d8e1e8",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: brandColors.text,
    backgroundColor: brandColors.white,
  },
  threadActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  inlineGhostButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: brandColors.borderSoft,
    backgroundColor: brandColors.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inlineGhostButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: brandColors.text,
  },
  inlinePrimaryButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: brandColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inlinePrimaryButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: brandColors.white,
  },
  homeButton: {
    marginTop: 4,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    paddingVertical: 16,
    backgroundColor: brandColors.text,
  },
  homeButtonText: {
    color: brandColors.white,
    fontSize: 15,
    fontWeight: "800",
  },
});
