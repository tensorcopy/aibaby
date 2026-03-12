# Export Media Mode Decision

## Status

Accepted as the first-pass export media-mode baseline.

This document defines how exported diary bundles should handle media references so the export remains portable, private, and usable offline.

## Decision summary

Use **copied local media** as the default export mode for MVP bundles.

For MVP:

- default media mode: `copied`
- exported Markdown notes should reference local files inside the bundle
- remote signed URLs should not be the default export format
- `referenced` or `mixed` modes can be added later as optional alternatives

## Why this approach

### 1. Best match for portability

The product goal is to let families take their memories with them.

Copied local media gives:

- a self-contained archive
- offline access
- no dependency on future bucket availability
- no broken links after token expiry

### 2. Best match for privacy

The repository already treats baby photos as sensitive family data.

Using remote URLs as the default export shape would create problems:

- signed URLs expire
- public URLs would weaken privacy guarantees
- exports would depend on storage access continuing forever

Copied local media avoids those problems.

### 3. Best match for Obsidian and plain-folder workflows

Obsidian works naturally with local Markdown files and local image files in the same vault.

A copied-media export means:

- notes render images immediately
- users can move the bundle anywhere
- no plugin or re-auth flow is required

## Default behavior

The export generator should:

1. write Markdown notes into `diary/`
2. copy referenced media into `media/`
3. rewrite note media paths to relative local paths
4. mark `manifest.json` with `media_mode: "copied"`

## Relative link rule

Diary notes should point to local media using package-relative paths.

Recommended example:

```markdown
![Breakfast plate](../media/2026/2026-03-12-breakfast-01.jpg)
```

That path should remain valid after the user unzips the bundle into any normal folder or Obsidian vault.

## What is copied

For MVP, copy:

- original uploaded images that are referenced by exported daily notes

Do not require copying:

- every historical derivative variant
- unused temporary processing artifacts
- transient provider or parser outputs

Future export settings can expand what is included, but the baseline should stay focused.

## What is not exported as media

Do not export:

- signed URLs as the primary media target
- internal storage paths as user-facing links
- private temporary upload targets
- provider-generated transient files unless they become explicit user-visible assets later

## Optional future modes

The system may later support:

### `referenced`

Use external links instead of copied media.

Possible fit:

- very large exports
- low-storage exports
- explicit user choice

### `mixed`

Copy some media locally while leaving other media as external references.

Possible fit:

- lightweight exports with selected originals only
- premium or advanced export options

Neither mode should replace `copied` as the baseline default unless product constraints change materially.

## Manifest rule

`manifest.json` should always include:

```json
{
  "media_mode": "copied"
}
```

This makes later mixed-mode support backward compatible.

## Tradeoffs accepted

Using copied local media means:

- larger export sizes
- longer export generation time
- more storage and bandwidth during export creation

These are acceptable MVP tradeoffs because portability and privacy matter more than minimizing archive size.

## Follow-up tasks now unlocked

- AIB-053 finalize YAML frontmatter fields that may describe export and media state
- AIB-054 implement the export generator with copied local media as the default mode

