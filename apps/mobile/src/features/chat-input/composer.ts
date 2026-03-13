export type MealComposerQuickAction =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "snack"
  | "milk";

export type MealComposerAttachment = {
  id: string;
  uri: string;
  fileName?: string;
  width?: number;
  height?: number;
};

export type MealComposerDraft = {
  text: string;
  quickAction?: MealComposerQuickAction;
  attachments: MealComposerAttachment[];
};

export type MealComposerSubmission = {
  id: string;
  text: string;
  quickAction?: MealComposerQuickAction;
  attachments: MealComposerAttachment[];
  submittedAt: string;
  messageType: "user_text" | "user_image" | "user_mixed";
};

export type MealComposerScreenModel = {
  title: string;
  subtitle: string;
  helperText: string;
  submitLabel: string;
  submitDisabled: boolean;
  canAttachPhotos: boolean;
  emptyStateTitle: string;
  emptyStateMessage: string;
};

export const mealComposerQuickActions: Array<{
  key: MealComposerQuickAction;
  label: string;
  prompt: string;
}> = [
  {
    key: "breakfast",
    label: "Breakfast",
    prompt: "What did breakfast look like?",
  },
  {
    key: "lunch",
    label: "Lunch",
    prompt: "What did lunch look like?",
  },
  {
    key: "dinner",
    label: "Dinner",
    prompt: "What did dinner look like?",
  },
  {
    key: "snack",
    label: "Snack",
    prompt: "What snack did they have?",
  },
  {
    key: "milk",
    label: "Milk",
    prompt: "How much milk or formula did they have?",
  },
];

export function createMealComposerDraft(): MealComposerDraft {
  return {
    text: "",
    attachments: [],
  };
}

export function setMealComposerText(
  draft: MealComposerDraft,
  text: string,
): MealComposerDraft {
  return {
    ...draft,
    text,
  };
}

export function toggleMealComposerQuickAction(
  draft: MealComposerDraft,
  quickAction: MealComposerQuickAction,
): MealComposerDraft {
  return {
    ...draft,
    quickAction: draft.quickAction === quickAction ? undefined : quickAction,
  };
}

export function appendMealComposerAttachments(
  draft: MealComposerDraft,
  attachments: MealComposerAttachment[],
): MealComposerDraft {
  if (attachments.length === 0) {
    return draft;
  }

  const existingIds = new Set(draft.attachments.map((attachment) => attachment.id));
  const nextAttachments = [...draft.attachments];

  for (const attachment of attachments) {
    if (existingIds.has(attachment.id)) {
      continue;
    }

    existingIds.add(attachment.id);
    nextAttachments.push(attachment);
  }

  return {
    ...draft,
    attachments: nextAttachments,
  };
}

export function removeMealComposerAttachment(
  draft: MealComposerDraft,
  attachmentId: string,
): MealComposerDraft {
  return {
    ...draft,
    attachments: draft.attachments.filter((attachment) => attachment.id !== attachmentId),
  };
}

export function hasMealComposerContent(draft: MealComposerDraft): boolean {
  return normalizeMealComposerText(draft.text).length > 0 || draft.attachments.length > 0;
}

export function createMealComposerScreenModel({
  babyId,
  draft,
}: {
  babyId?: string;
  draft: MealComposerDraft;
}): MealComposerScreenModel {
  const hasBabyId = Boolean(babyId?.trim());
  const hasText = normalizeMealComposerText(draft.text).length > 0;
  const hasAttachments = draft.attachments.length > 0;
  const hasDraft = hasText || hasAttachments;

  if (!hasBabyId) {
    return {
      title: "Log a meal",
      subtitle: "Create a baby profile first so meal logs attach to the right baby.",
      helperText: "A baby profile is required before sending text or meal photos.",
      submitLabel: "Create profile first",
      submitDisabled: true,
      canAttachPhotos: false,
      emptyStateTitle: "No meal drafts yet",
      emptyStateMessage:
        "Once a baby profile is active, text notes and meal photos will appear here before parsing.",
    };
  }

  return {
    title: "Log a meal",
    subtitle:
      "Capture a meal with a short note, one or more photos, or both. The parsing flow can build on these drafts next.",
    helperText: draft.quickAction
      ? mealComposerQuickActions.find((action) => action.key === draft.quickAction)?.prompt ??
        "Add the meal details that matter most."
      : "Add a quick note if the photo needs extra context like quantity or ingredients.",
    submitLabel: hasText && hasAttachments ? "Send meal log" : hasAttachments ? "Send photos" : "Send note",
    submitDisabled: !hasDraft,
    canAttachPhotos: true,
    emptyStateTitle: "Ready for the first meal log",
    emptyStateMessage:
      "Submitted drafts stay in this local thread so the upload and parsing pipeline can replace the placeholder flow next.",
  };
}

export function submitMealComposerDraft({
  draft,
  createId = createMealComposerSubmissionId,
  submittedAt = new Date().toISOString(),
}: {
  draft: MealComposerDraft;
  createId?: () => string;
  submittedAt?: string;
}): {
  nextDraft: MealComposerDraft;
  submission: MealComposerSubmission;
} {
  if (!hasMealComposerContent(draft)) {
    throw new Error("Meal composer draft requires text or at least one photo.");
  }

  const normalizedText = normalizeMealComposerText(draft.text);
  const attachments = draft.attachments.map((attachment) => ({ ...attachment }));
  const messageType =
    normalizedText.length > 0 && attachments.length > 0
      ? "user_mixed"
      : attachments.length > 0
        ? "user_image"
        : "user_text";

  return {
    nextDraft: createMealComposerDraft(),
    submission: {
      id: createId(),
      text: normalizedText,
      quickAction: draft.quickAction,
      attachments,
      submittedAt,
      messageType,
    },
  };
}

export function formatMealComposerSubmissionMeta(
  submission: MealComposerSubmission,
): string {
  const quickActionLabel = submission.quickAction
    ? mealComposerQuickActions.find((action) => action.key === submission.quickAction)?.label
    : null;
  const photoCount = submission.attachments.length;

  const parts = [quickActionLabel, photoCount > 0 ? `${photoCount} photo${photoCount === 1 ? "" : "s"}` : null];

  return parts.filter(Boolean).join(" · ") || "Text note";
}

function normalizeMealComposerText(text: string): string {
  return text.trim();
}

function createMealComposerSubmissionId(): string {
  return `draft_${Math.random().toString(36).slice(2, 10)}`;
}
