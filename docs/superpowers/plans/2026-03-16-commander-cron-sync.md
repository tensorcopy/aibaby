# Commander Cron Sync Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a repo-managed commander sync script and install a local cron job that runs every 2 hours to read team logs and refresh `tasks/commander.md`.

**Architecture:** Add a small Node script under `scripts/` that parses the team log markdown files and rewrites the generated sections of `tasks/commander.md`. Cover it with a node:test integration test, document manual usage, then install a local crontab entry that runs the script every 2 hours.

**Tech Stack:** Node ESM scripts, node:test, markdown file parsing, local system cron

---

## Chunk 1: Sync Behavior

### Task 1: Add a failing integration test for commander sync

**Files:**
- Create: `scripts/commander-sync.test.mjs`
- Modify: `package.json`

- [x] Write a test that seeds temporary team log files and a commander file template, runs the sync script, and asserts the commander file reflects the team states, blockers, dependencies, and dated summary output.
- [x] Run the new test and confirm it fails for the expected missing-script behavior.

### Task 2: Implement the minimal commander sync script

**Files:**
- Create: `scripts/commander-sync.mjs`
- Modify: `tasks/commander.md`

- [x] Add marker-based generated sections to `tasks/commander.md`.
- [x] Implement parsing for team `Current State`, `Active Queue`, and `Dependency Requests`.
- [x] Implement commander-file rewriting for team snapshot, cross-team dependencies, interventions needed, and daily summary log.
- [x] Run the test and make it pass.

## Chunk 2: Operator Flow

### Task 3: Document and expose the sync command

**Files:**
- Modify: `package.json`
- Create: `docs/commander-cron.md`

- [x] Add an npm script for manual commander sync.
- [x] Document what the sync job reads, what it writes, and the intended observe-only behavior.

## Chunk 3: Cron Installation

### Task 4: Install the local cron entry

**Files:**
- Test: local `crontab`

- [x] Verify the sync command works from the shell.
- [x] Install or update a local cron entry that runs every 2 hours.
- [x] Route stdout and stderr to a troubleshooting log path.
- [x] Re-read the crontab to confirm the entry is present.
