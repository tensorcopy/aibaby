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

## 2026-03-14

### Growth tracking
- Let caregivers log baby weight and height in the app over time.
- Show a simple growth chart so families can see trend lines instead of isolated measurements.
- Keep growth entries tied to dates so feeding history and growth can be reviewed together.

### Product opportunities
- Quick manual weight and height entry from the mobile app.
- Timeline overlays that compare meal logging periods with growth changes.
- Pediatrician-friendly export of growth entries and charts.

### Open questions
- Should head circumference be included in the same flow or added later?
- Should the chart use percentile references or stay as a raw measurement trend first?
- Should growth reminders be added when no measurement has been logged for a while?

### Daily meal recommendations and recipes
- Recommend what to cook for the baby each day based on age stage, recent foods, and what has not been offered recently.
- Generate simple baby-friendly recipes so the recommendation can turn into an actionable meal plan.
- Use allergy, supplement, and recent acceptance signals to avoid repetitive or unsuitable suggestions.

### Product opportunities
- Daily "what to cook today" card on the home screen.
- One-tap recipe suggestions tied to iron-rich foods, new food trials, or variety gaps.
- Weekly meal planning that reuses foods already tolerated and introduces one or two new options.

### Open questions
- Should recipe suggestions use pantry-style inputs from the caregiver?
- Should recommendations optimize for nutrition coverage, simplicity, cost, or all three?
- Should the app learn from foods the baby rejected and reduce similar suggestions for a while?

### Busy-parent meal prep planning
- Help working parents plan grocery shopping, prep timing, and batch cooking for the baby's meals.
- Turn daily meal recommendations into a practical weekly prep plan instead of isolated suggestions.
- Break the plan into what to buy, what to prep ahead, and what can be cooked quickly on the day.

### Product opportunities
- Weekly grocery list generated from recommended baby meals and recipes.
- Prep-day checklist that groups washing, steaming, blending, freezing, and storage steps.
- Calendar-style guidance for when to shop, when to batch prep, and when to serve or thaw meals.

### Open questions
- Should grocery planning support family meals first, with baby adaptations as a second layer?
- Should prep plans account for freezer inventory and leftovers?
- Should the app optimize for weekend batch prep, midweek refresh prep, or a customizable routine?
