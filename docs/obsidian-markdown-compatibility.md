# Obsidian Markdown Compatibility

## Status

Accepted as the first-pass Obsidian compatibility layer for exports.

This document defines which Obsidian-friendly conventions should be added on top of the baseline Markdown export shape without making the export unreadable in generic Markdown tools.

## Design principle

The base export must remain portable standard Markdown.

Obsidian support should be:

- additive
- optional
- readable outside Obsidian
- safe to ignore in non-Obsidian editors

## Compatibility goal

The export should work well when a family drops the bundle into an Obsidian vault, without requiring plugin-specific syntax or app-specific custom renderers.

## Accepted Obsidian-friendly conventions

### 1. YAML frontmatter stays primary

Obsidian reads YAML frontmatter well, and generic Markdown tooling also supports it.

For that reason:

- frontmatter remains the primary metadata carrier
- metadata should not be duplicated into Obsidian-only inline fields
- frontmatter keys should stay plain and machine-readable

See `docs/export-frontmatter-fields.md` for the canonical field set.

### 2. Internal note links may be added for future multi-note exports

When exports later include weekly summaries, reminder notes, or milestone notes, Obsidian wikilinks are acceptable as an additive layer.

Example:

```markdown
See also: [[2026-03-12-baby-luna]]
```

For the current daily-note baseline, do not require wikilinks yet.

### 3. Standard Markdown image links remain preferred over embeds

To keep exports portable:

- prefer standard Markdown links or images for media references
- do not require Obsidian embed syntax in the baseline export

Portable example:

```markdown
![Breakfast plate](../media/2026/2026-03-12-breakfast-01.jpg)
```

Obsidian can render that correctly without needing `![[...]]`.

### 4. Tags may be included in frontmatter

Tag support is useful in Obsidian and harmless elsewhere.

Preferred shape:

```yaml
tags:
  - ai-baby
  - daily-diary
  - feeding
```

Do not rely on inline hashtag tags as the only tagging mechanism.

### 5. Section headings should stay stable

Stable heading names help:

- Obsidian outline navigation
- backlink references
- generic Markdown readability

Do not create overly decorative or app-specific section names.

## Deferred Obsidian-specific features

The following are explicitly out of scope for the first-pass compatibility layer:

- callout-heavy formatting
- canvas files
- Dataview-specific fields or queries
- plugin-required syntax
- tasks-plugin-specific annotations
- embedded block references

These can be added later only if they remain additive and do not reduce portability.

## Recommended note behaviors in Obsidian

When viewed in Obsidian, exported notes should:

- open cleanly with no plugins required
- show frontmatter without breaking readability
- render image links from the package-relative paths
- remain navigable through consistent titles and filenames

## Filename and title guidance

To keep Obsidian navigation predictable:

- note filename should match the daily diary filename convention
- frontmatter title should match the visible note title closely
- avoid characters that commonly cause filesystem or link issues

## Future additive enhancements

If later export work adds richer Obsidian support, the preferred order is:

1. stable wikilinks between related notes
2. richer frontmatter for vault filtering
3. optional callouts for summaries or reminders

Do not jump directly to plugin-specific formats.

## Example Obsidian-compatible diary note

```markdown
---
title: "Luna Daily Diary - 2026-03-12"
date: 2026-03-12
baby_name: "Luna"
baby_id: "baby_123"
export_type: "daily_diary"
timezone: "America/Los_Angeles"
tags:
  - ai-baby
  - daily-diary
  - feeding
---

# Luna Daily Diary

## Summary

Today Luna ate well overall, with vegetables and protein covered but iron-rich foods less certain.

## Media

![Breakfast plate](../media/2026/2026-03-12-breakfast-01.jpg)
```

This note remains valid Markdown outside Obsidian while still feeling natural inside an Obsidian vault.

## Follow-up tasks now unlocked

- AIB-052 finalize whether media links point to copied local files or referenced URLs
- AIB-053 finalize the exact YAML frontmatter field set
- AIB-054 implement the export generator against this compatibility profile
