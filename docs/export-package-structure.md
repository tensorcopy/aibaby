# Export Package Structure

## Status

Accepted as the first-pass export package structure for MVP planning.

This document defines how a full export bundle should be organized on disk so later export implementation, Markdown note generation, and media packaging work can target one predictable layout.

## Goals

The export package should be:

- portable outside the app
- easy to inspect without custom tools
- stable enough for future Obsidian-specific enhancements
- compatible with local media copies or future media reference modes

## Export granularity

The first-pass export product is **one bundle per baby export request**.

Each bundle should include:

- a manifest
- one folder for Markdown diary notes
- one folder for media
- one folder for optional structured metadata snapshots

## Archive format

The final download format should be a compressed archive, such as:

```text
ai-baby-export-{baby_slug}-{timestamp}.zip
```

Example:

```text
ai-baby-export-luna-2026-03-12T04-10-00Z.zip
```

Inside the archive, keep plain folders and files rather than nested proprietary package formats.

## Root layout

Recommended bundle layout:

```text
ai-baby-export-{baby_slug}-{timestamp}/
  README.md
  manifest.json
  diary/
  media/
  metadata/
```

## Root files

### `README.md`

Purpose:

- explain what the export contains
- explain how diary notes reference media
- explain that the export is intended to remain readable outside the app

### `manifest.json`

Purpose:

- provide machine-readable export metadata
- support future import, verification, or migration tooling

Recommended fields:

- `export_version`
- `exported_at`
- `baby_id`
- `baby_name`
- `timezone`
- `note_count`
- `media_count`
- `media_mode`
- `generator`

## `diary/` directory

Contains the exported Markdown notes.

Recommended contents:

- one daily diary note per day per baby
- future weekly or monthly rollups can be added later without changing the root layout

Recommended file naming:

```text
diary/YYYY-MM-DD-baby-{baby_slug}.md
```

## `media/` directory

Contains exported media files when the chosen media mode includes local copies.

Recommended layout:

```text
media/YYYY/
media/YYYY/YYYY-MM-DD-{meal_type}-{sequence}.{ext}
```

Example:

```text
media/2026/2026-03-12-breakfast-01.jpg
```

Why this shape:

- keeps filenames sortable
- avoids huge flat media directories as exports grow
- stays compatible with the relative paths described in the Markdown export shape

## `metadata/` directory

Contains optional structured JSON snapshots that help later import, debugging, or validation.

Recommended contents for MVP:

- `metadata/daily-index.json`
- `metadata/media-index.json`

Later extensions may add:

- `metadata/weekly-summaries.json`
- `metadata/reminders.json`

## Relationship between notes and media

Markdown notes should reference media using relative paths inside the bundle.

Recommended rule:

- note files in `diary/`
- media files in `media/`
- links are relative from the note to the target media

Example:

```text
../media/2026/2026-03-12-breakfast-01.jpg
```

This keeps the bundle self-contained when local media copies are included.

## Media mode placeholder

The package manifest should always include a `media_mode` field, even before the final policy is decided.

Allowed planned values:

- `copied`
- `referenced`
- `mixed`

Accepted MVP baseline:

- default to `copied` local media in `media/`
- keep the structure flexible enough to support `referenced` or `mixed` modes later

See `docs/export-media-mode-decision.md` for the default-mode decision.

## Example bundle

```text
ai-baby-export-luna-2026-03-12T04-10-00Z/
  README.md
  manifest.json
  diary/
    2026-03-11-baby-luna.md
    2026-03-12-baby-luna.md
  media/
    2026/
      2026-03-11-breakfast-01.jpg
      2026-03-12-dinner-01.jpg
  metadata/
    daily-index.json
    media-index.json
```

## Manifest example

```json
{
  "export_version": "1",
  "exported_at": "2026-03-12T04:10:00Z",
  "baby_id": "baby_123",
  "baby_name": "Luna",
  "timezone": "America/Los_Angeles",
  "note_count": 2,
  "media_count": 2,
  "media_mode": "copied",
  "generator": "ai-baby-mvp"
}
```

## Design rules

- keep the root layout stable
- keep note paths human-readable
- keep media references relative when local copies exist
- avoid embedding provider-specific or app-runtime-specific metadata in the bundle
- reserve room for future import and Obsidian-specific enhancements

## Follow-up tasks now unlocked

- AIB-051 decide which additive Obsidian conventions should be layered on top
- AIB-052 finalize copied versus referenced media behavior
- AIB-053 finalize the exact YAML frontmatter fields
- AIB-054 implement bundle generation and archive download
