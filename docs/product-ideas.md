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
