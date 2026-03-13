import test from "node:test";
import assert from "node:assert/strict";

import {
  appendMealLogImageDraft,
  canSubmitMealLogComposerDraft,
  createMealLogComposerDraft,
  createMealLogComposerSubmission,
  removeMealLogImageDraft,
  updateMealLogComposerText,
} from "./draft.ts";

test("meal log composer draft starts empty and blocked from submission", () => {
  const draft = createMealLogComposerDraft();

  assert.deepEqual(draft, {
    text: "",
    attachments: [],
  });
  assert.equal(canSubmitMealLogComposerDraft(draft), false);
});

test("meal log composer accepts trimmed text-only submissions", () => {
  const draft = updateMealLogComposerText(createMealLogComposerDraft(), "  Lunch: avocado and noodles  ");

  assert.equal(canSubmitMealLogComposerDraft(draft), true);
  assert.deepEqual(createMealLogComposerSubmission(draft), {
    text: "Lunch: avocado and noodles",
    attachmentCount: 0,
    attachmentLabels: [],
    summary: "Ready to submit a text-only meal note.",
  });
});

test("meal log composer keeps image drafts submit-ready even without text", () => {
  const withPlate = appendMealLogImageDraft(createMealLogComposerDraft(), "plate");
  const withDetail = appendMealLogImageDraft(withPlate, "detail");

  assert.equal(canSubmitMealLogComposerDraft(withDetail), true);
  assert.deepEqual(withDetail.attachments, [
    {
      id: "plate-1",
      kind: "plate",
      label: "Plate photo 1",
    },
    {
      id: "detail-1",
      kind: "detail",
      label: "Detail photo 1",
    },
  ]);
  assert.equal(
    createMealLogComposerSubmission(withDetail).summary,
    "Ready to submit 2 image drafts.",
  );
});

test("meal log composer caps local image drafts and supports removal", () => {
  let draft = createMealLogComposerDraft();
  draft = appendMealLogImageDraft(draft, "plate");
  draft = appendMealLogImageDraft(draft, "plate");
  draft = appendMealLogImageDraft(draft, "detail");
  draft = appendMealLogImageDraft(draft, "detail");
  draft = appendMealLogImageDraft(draft, "detail");

  assert.equal(draft.attachments.length, 4);
  assert.deepEqual(
    draft.attachments.map((attachment) => attachment.label),
    ["Plate photo 1", "Plate photo 2", "Detail photo 1", "Detail photo 2"],
  );

  const removed = removeMealLogImageDraft(draft, "plate-2");
  assert.deepEqual(
    removed.attachments.map((attachment) => attachment.id),
    ["plate-1", "detail-1", "detail-2"],
  );
});
