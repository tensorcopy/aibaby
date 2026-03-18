import assert from "node:assert/strict";
import test from "node:test";

import { createMealIdeasScreenModel } from "./model.ts";

test("createMealIdeasScreenModel explains missing baby context", () => {
  const model = createMealIdeasScreenModel({
    babyId: undefined,
    suggestionSet: null,
  });

  assert.equal(model.sections.length, 0);
  assert.equal(model.emptyTitle, "Baby profile still required");
  assert.equal(model.homeHref, "/");
});

test("createMealIdeasScreenModel returns a baby-scoped one-day suggestion set", () => {
  const model = createMealIdeasScreenModel({
    babyId: " baby_123 ",
    suggestionSet: {
      recommendationDate: "2026-03-18",
      title: "Tomorrow's meal ideas",
      intro: "Texture-building guidance is pointing to a short, practical plan for tomorrow.",
      caveat: "This suggestion set is based on limited recent logging.",
      footer: "Supportive guidance only.",
      sections: [
        {
          templateKey: "iron_priority",
          mealType: "lunch",
          priority: 1,
          headline: "Lead with one iron-rich lunch",
          body: "Iron-rich foods have been less visible in recent logs.",
          options: ["lentil puree", "shredded beef", "mashed beans"],
          focusTags: ["iron_rich_food", "protein"],
        },
        {
          templateKey: "vegetable_variety",
          mealType: "dinner",
          priority: 2,
          headline: "Repeat one simple vegetable at dinner",
          body: "Vegetable variety has been narrow lately.",
          options: ["steamed broccoli", "mashed peas"],
          focusTags: ["vegetable_variety"],
        },
      ],
    },
  });

  assert.equal(model.sections.length, 2);
  assert.equal(model.sections[0]?.mealTypeLabel, "Lunch");
  assert.equal(model.sections[0]?.priorityLabel, "Priority 1");
  assert.equal(model.sections[0]?.options.length, 3);
  assert.equal(model.sections[1]?.mealTypeLabel, "Dinner");
  assert.equal(model.caveat, "This suggestion set is based on limited recent logging.");
  assert.equal(model.footer, "Supportive guidance only.");
  assert.equal(model.homeHref, "/?babyId=baby_123");
});
