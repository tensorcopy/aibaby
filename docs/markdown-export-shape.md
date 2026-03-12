# Markdown Export Shape

## Status

Accepted as the first-pass Markdown diary export shape for MVP planning.

This document defines the structure of exported diary notes so later export, Obsidian-compatibility, and media-packaging work can build on one stable note format.

## Scope

This is the baseline export shape for:

- daily diary-style entries
- linked or copied media references
- structured metadata that can survive outside the product database

This document does not yet finalize:

- whether media is copied locally or referenced remotely by default
- the final export package layout
- Obsidian-only enhancements beyond compatible Markdown conventions

Those remain follow-up tasks.

## Export unit

The first-pass export unit is **one Markdown note per day per baby**.

Why:

- it matches the daily summary and timeline mental model
- it keeps notes readable outside the app
- it makes later weekly or monthly rollups possible without overloading one file

## File naming

Recommended filename shape:

```text
YYYY-MM-DD-baby-{baby_slug}.md
```

Example:

```text
2026-03-12-baby-luna.md
```

This keeps files:

- sortable by date
- readable in plain folders
- usable in Git, Obsidian, and generic note apps

## Frontmatter baseline

Every exported note should begin with YAML frontmatter.

See `docs/export-frontmatter-fields.md` for the accepted field set.

## Body structure

Recommended section order:

```markdown
# {Baby Name} Daily Diary

## Summary

## Meals

## Milk and Supplements

## Notes and Follow-ups

## Media

## Metadata
```

This keeps the export readable even without custom tooling.

## Section details

### Summary

Contains the daily narrative generated from structured records.

Recommended contents:

- one short paragraph summarizing the day
- covered nutrition directions
- possible gaps or uncertainty
- next-step suggestions when available

### Meals

Contains meal records in chronological order.

Recommended per-meal shape:

```markdown
### Breakfast - 08:15

- Foods: zucchini egg pancake, avocado
- Amounts: 3 slices pancake, 1/6 avocado
- Source: image + text
- Status: confirmed
- AI note: identified from uploaded meal photo and caregiver confirmation
```

### Milk and Supplements

Contains milk intake and supplement records for the day.

Recommended per-entry fields:

- time
- intake or supplement name
- amount or completion state
- confidence or confirmation state when relevant

### Notes and Follow-ups

Contains free-form or app-generated notes that are useful in later review.

Examples:

- new foods tried
- foods the baby rejected
- follow-up reminder for tomorrow
- parsing uncertainty worth re-checking later

### Media

Contains references to the day’s uploaded media.

Recommended shape:

```markdown
- Breakfast plate photo: `media/2026-03-12-breakfast-01.jpg`
- Dinner plate photo: `media/2026-03-12-dinner-01.jpg`
```

The accepted MVP baseline is copied local media. If the export later supports remote references, keep the label text the same and swap the target.

### Metadata

Contains low-level export details that help later debugging or migration.

Recommended fields:

- export timestamp
- record count
- media count
- generation method
- known omissions or incomplete inputs

## Markdown conventions

To keep exports widely portable:

- use standard Markdown headings
- use bullet lists for structured entries
- avoid app-specific syntax in the baseline format
- allow later Obsidian-specific enhancements as additive, not required

## Media reference convention

Until the export-package decision is finalized, the note should assume media references are relative paths under a sibling `media/` directory.

Recommended convention:

```text
media/{date}-{meal_type}-{sequence}.{ext}
```

Example:

```text
media/2026-03-12-breakfast-01.jpg
```

This keeps references stable for the accepted copied-media baseline and still leaves room for a later reference-based mode.

## Data mapping guidance

The export note should draw from:

- `babies`
- `messages`
- `media_assets`
- `meal_records`
- `meal_items`
- `daily_reports`

The exported note should prefer confirmed structured records over raw AI guesses whenever both exist.

## Privacy guidance

Exports are user-controlled data, but the baseline format should still avoid unnecessary leakage.

Do not export:

- auth tokens
- service credentials
- internal signed URLs
- internal-only error payloads

Prefer:

- stable product ids
- redacted operational metadata
- local media references instead of temporary signed URLs

## Follow-up tasks now unlocked

- AIB-050 define the full export package structure
- AIB-051 refine the format for Obsidian compatibility where useful
- AIB-052 decide copied media versus referenced URLs
- AIB-053 finalize the YAML frontmatter fields
- AIB-054 build the first-pass export flow
