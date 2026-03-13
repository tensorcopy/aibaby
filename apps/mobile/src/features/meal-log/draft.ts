export type MealLogImageDraftKind = "plate" | "detail";

export type MealLogImageDraft = {
  id: string;
  kind: MealLogImageDraftKind;
  label: string;
};

export type MealLogComposerDraft = {
  text: string;
  attachments: MealLogImageDraft[];
};

export type MealLogComposerSubmission = {
  text: string | null;
  attachmentCount: number;
  attachmentLabels: string[];
  summary: string;
};

const MAX_ATTACHMENTS = 4;

export function createMealLogComposerDraft(): MealLogComposerDraft {
  return {
    text: "",
    attachments: [],
  };
}

export function updateMealLogComposerText(
  draft: MealLogComposerDraft,
  text: string,
): MealLogComposerDraft {
  return {
    ...draft,
    text,
  };
}

export function appendMealLogImageDraft(
  draft: MealLogComposerDraft,
  kind: MealLogImageDraftKind,
): MealLogComposerDraft {
  if (draft.attachments.length >= MAX_ATTACHMENTS) {
    return draft;
  }

  const nextIndex =
    draft.attachments.filter((attachment) => attachment.kind === kind).length + 1;

  return {
    ...draft,
    attachments: [
      ...draft.attachments,
      {
        id: `${kind}-${nextIndex}`,
        kind,
        label: kind === "plate" ? `Plate photo ${nextIndex}` : `Detail photo ${nextIndex}`,
      },
    ],
  };
}

export function removeMealLogImageDraft(
  draft: MealLogComposerDraft,
  attachmentId: string,
): MealLogComposerDraft {
  return {
    ...draft,
    attachments: draft.attachments.filter((attachment) => attachment.id !== attachmentId),
  };
}

export function canSubmitMealLogComposerDraft(draft: MealLogComposerDraft): boolean {
  return getTrimmedMealLogText(draft).length > 0 || draft.attachments.length > 0;
}

export function createMealLogComposerSubmission(
  draft: MealLogComposerDraft,
): MealLogComposerSubmission {
  const text = getTrimmedMealLogText(draft);
  const attachmentLabels = draft.attachments.map((attachment) => attachment.label);

  return {
    text: text.length > 0 ? text : null,
    attachmentCount: draft.attachments.length,
    attachmentLabels,
    summary: createMealLogSubmissionSummary({
      textLength: text.length,
      attachmentCount: draft.attachments.length,
    }),
  };
}

function getTrimmedMealLogText(draft: MealLogComposerDraft): string {
  return draft.text.trim();
}

function createMealLogSubmissionSummary({
  textLength,
  attachmentCount,
}: {
  textLength: number;
  attachmentCount: number;
}): string {
  if (textLength > 0 && attachmentCount > 0) {
    return `Ready to submit ${attachmentCount} image draft${attachmentCount === 1 ? "" : "s"} with a meal note.`;
  }

  if (textLength > 0) {
    return "Ready to submit a text-only meal note.";
  }

  return `Ready to submit ${attachmentCount} image draft${attachmentCount === 1 ? "" : "s"}.`;
}
