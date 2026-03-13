import test from "node:test";
import assert from "node:assert/strict";

import {
  appendMealComposerAttachments,
  createMealComposerDraft,
  createMealComposerScreenModel,
  formatMealComposerSubmissionMeta,
  hasMealComposerContent,
  removeMealComposerAttachment,
  submitMealComposerDraft,
  toggleMealComposerQuickAction,
} from "./composer.ts";

test("createMealComposerScreenModel blocks submission until a baby profile is active", () => {
  const model = createMealComposerScreenModel({
    draft: createMealComposerDraft(),
  });

  assert.equal(model.submitDisabled, true);
  assert.equal(model.canAttachPhotos, false);
  assert.match(model.subtitle, /Create a baby profile first/);
});

test("createMealComposerScreenModel adapts the helper copy and submit label to the current draft", () => {
  const draft = appendMealComposerAttachments(
    toggleMealComposerQuickAction(createMealComposerDraft(), "dinner"),
    [
      {
        id: "asset_1",
        uri: "file:///plate.jpg",
      },
    ],
  );

  const model = createMealComposerScreenModel({
    babyId: " baby_123 ",
    draft: {
      ...draft,
      text: "Steamed salmon with broccoli",
    },
  });

  assert.equal(model.submitDisabled, false);
  assert.equal(model.submitLabel, "Send meal log");
  assert.equal(model.canAttachPhotos, true);
  assert.match(model.helperText, /dinner/i);
});

test("appendMealComposerAttachments deduplicates repeated photo selections", () => {
  const draft = appendMealComposerAttachments(createMealComposerDraft(), [
    { id: "asset_1", uri: "file:///plate.jpg" },
    { id: "asset_1", uri: "file:///plate.jpg" },
    { id: "asset_2", uri: "file:///bowl.jpg" },
  ]);

  assert.deepEqual(
    draft.attachments.map((attachment) => attachment.id),
    ["asset_1", "asset_2"],
  );
});

test("removeMealComposerAttachment drops the selected attachment without mutating the rest", () => {
  const draft = removeMealComposerAttachment(
    appendMealComposerAttachments(createMealComposerDraft(), [
      { id: "asset_1", uri: "file:///plate.jpg" },
      { id: "asset_2", uri: "file:///bowl.jpg" },
    ]),
    "asset_1",
  );

  assert.deepEqual(draft.attachments, [{ id: "asset_2", uri: "file:///bowl.jpg" }]);
});

test("hasMealComposerContent accepts either trimmed text or attached photos", () => {
  assert.equal(hasMealComposerContent({ text: "  oatmeal  ", attachments: [] }), true);
  assert.equal(
    hasMealComposerContent({
      text: "   ",
      attachments: [{ id: "asset_1", uri: "file:///plate.jpg" }],
    }),
    true,
  );
  assert.equal(hasMealComposerContent(createMealComposerDraft()), false);
});

test("submitMealComposerDraft returns a mixed submission and resets the draft", () => {
  const result = submitMealComposerDraft({
    draft: {
      text: "  Avocado toast and berries  ",
      quickAction: "breakfast",
      attachments: [{ id: "asset_1", uri: "file:///plate.jpg" }],
    },
    createId: () => "draft_123",
    submittedAt: "2026-03-13T02:30:00.000Z",
  });

  assert.deepEqual(result.nextDraft, createMealComposerDraft());
  assert.deepEqual(result.submission, {
    id: "draft_123",
    text: "Avocado toast and berries",
    quickAction: "breakfast",
    attachments: [{ id: "asset_1", uri: "file:///plate.jpg" }],
    submittedAt: "2026-03-13T02:30:00.000Z",
    messageType: "user_mixed",
  });
  assert.equal(formatMealComposerSubmissionMeta(result.submission), "Breakfast · 1 photo");
});

test("submitMealComposerDraft rejects empty drafts", () => {
  assert.throws(
    () =>
      submitMealComposerDraft({
        draft: createMealComposerDraft(),
      }),
    /requires text or at least one photo/,
  );
});
