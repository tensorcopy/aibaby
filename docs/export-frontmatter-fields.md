# Export Frontmatter Fields

## Status

Accepted as the first-pass YAML frontmatter field set for exported notes.

This document defines the canonical frontmatter keys for exported diary notes so exporters, Obsidian workflows, and future import or indexing tools can rely on one stable metadata shape.

## Design goals

The frontmatter should be:

- human-readable
- machine-readable
- portable outside Obsidian
- stable across future export tasks
- narrow enough to avoid leaking unnecessary private internals

## Required fields

These fields should appear in every exported daily diary note.

```yaml
title:
date:
baby_name:
baby_id:
export_type:
timezone:
source_app:
source_version:
tags:
```

### Field definitions

#### `title`

Human-readable note title.

Example:

```yaml
title: "Luna Daily Diary - 2026-03-12"
```

#### `date`

The diary date represented by the note, in local calendar form.

Example:

```yaml
date: 2026-03-12
```

#### `baby_name`

Display name used in the product at export time.

Example:

```yaml
baby_name: "Luna"
```

#### `baby_id`

Stable opaque product identifier for the exported baby.

Example:

```yaml
baby_id: "baby_123"
```

Do not expose auth-user ids in frontmatter.

#### `export_type`

Identifies the note type for downstream tooling.

Initial value:

```yaml
export_type: "daily_diary"
```

This leaves room for later note types such as `weekly_summary` or `milestone`.

#### `timezone`

The baby or export timezone used to interpret the diary date.

Example:

```yaml
timezone: "America/Los_Angeles"
```

#### `source_app`

Human-readable source identifier.

Example:

```yaml
source_app: "AI Baby"
```

#### `source_version`

Export schema or product version label.

Initial value:

```yaml
source_version: "mvp"
```

#### `tags`

Portable classification tags.

Recommended baseline:

```yaml
tags:
  - ai-baby
  - daily-diary
```

Optional additional tags may be added later, but the baseline should remain stable.

## Optional fields

These fields are allowed when data exists and the export generator can provide them reliably.

```yaml
summary_status:
age_months:
record_count:
media_count:
```

### Optional field definitions

#### `summary_status`

Indicates whether a generated summary exists for the day.

Allowed planned values:

- `generated`
- `partial`
- `missing`

#### `age_months`

The baby’s approximate age in months at the time of the note.

Use only if the exporter can compute it deterministically from `birth_date` and `date`.

#### `record_count`

The number of exported structured diary records represented in the note.

#### `media_count`

The number of media items referenced by the note.

## Deferred fields

The following should not be part of the first-pass canonical set yet:

- mood
- sleep metrics
- bowel movement tracking
- milestone scores
- internal parser confidence values
- raw storage paths
- external media URLs
- signed URLs

These can be added later only if the product actually exports that domain and the metadata remains stable.

## Field naming rules

- use lowercase snake_case
- prefer stable nouns over implementation-specific names
- avoid framework- or provider-specific keys
- avoid nested complex objects in the baseline format

## Canonical example

```yaml
---
title: "Luna Daily Diary - 2026-03-12"
date: 2026-03-12
baby_name: "Luna"
baby_id: "baby_123"
export_type: "daily_diary"
timezone: "America/Los_Angeles"
summary_status: "generated"
source_app: "AI Baby"
source_version: "mvp"
record_count: 4
media_count: 2
tags:
  - ai-baby
  - daily-diary
  - feeding
---
```

## Compatibility notes

- this field set remains valid YAML frontmatter outside Obsidian
- Obsidian can use these keys for filtering without requiring plugin-specific syntax
- the baseline avoids putting operational internals into note metadata

## Follow-up tasks now unlocked

- AIB-054 implement note generation using this canonical frontmatter shape
- future export extensions can add note-type-specific fields while keeping this shared core stable

