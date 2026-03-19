# Product Ideas

A running note for future product planning, user value, and architecture directions.

## 2026-03-11

### Markdown export for baby diaries
- Users should be able to export their baby's diary in Markdown format.
- Export should work well with Obsidian so families can keep a long-term personal archive.
- The exported content should feel portable and user-owned rather than trapped inside the app.

### Storage direction
- Keep Postgres as the source of truth for core product data.
- Do not switch the application to Markdown-first storage.
- Treat Markdown as an export / archive / narrative layer.

### Suggested architecture
- **Postgres**: babies, parents, diary entries, milestones, tags, photo metadata, AI analysis results.
- **Object storage**: original photos/videos, thumbnails, derived media.
- **Markdown export layer**: diary entries, weekly summaries, monthly summaries, and timeline-style memory books.

### Why this matters
- Supports data portability.
- Gives parents stronger ownership of family memories.
- Makes it easy to keep a personal archive in Obsidian.
- Can become a product differentiator for privacy-conscious or power users.

### Product opportunities
- One-click Obsidian-compatible export.
- Export each diary entry as a Markdown note with linked or copied media.
- Export weekly and monthly baby journals.
- Export a complete baby timeline / memory book.
- Optional local backup package for families.

### Open questions
- Should media be exported as local files beside Markdown notes, or referenced by stable URLs?
- Should exports include YAML frontmatter for date, age, tags, milestone, mood, sleep, and feeding?
- Should there be a full vault export mode optimized specifically for Obsidian?
- Should Markdown export be premium, or a default trust-building feature?

### Principle
- Build the app around structured data.
- Let users take their memories with them in Markdown.

## 2026-03-19

### Meal planning and household load reduction
- Meal logging should remain a core product workflow.
- In addition to logging, the app should reduce the daily mental load of deciding what to cook for both parent and baby.
- The app should help with the specific constraint that babies may need low-salt, low-spice, age-appropriate meal variants.

### User problems to solve
- It is mentally expensive to decide every day what to cook for the parent and what to cook for the baby.
- It is hard to adapt one household meal into a baby-safe version without effectively planning two separate meals.
- The user wants suggestions based on what is already in the fridge instead of starting from scratch.
- The user wants the app to help with grocery planning so future meals are easier, not just today’s logging.

### Product opportunities
- Fridge-aware meal suggestions using ingredients the family already has.
- “Cook once, split later” meal ideas that show how to make one base meal and branch it into a baby-safe portion.
- Baby-safe adaptation guidance for salt, spice, texture, and stage-appropriate preparation.
- Short-horizon grocery planning based on upcoming meal gaps and pantry/fridge inventory.
- Prep recommendations that make tomorrow easier, not just today’s meal decision.

### Product principle
- The product should evolve from “meal logging only” into “meal logging plus household decision support.”
- Planning, fridge usage, and grocery support should reduce cognitive load, not add more data-entry burden.
