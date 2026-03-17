# Two-Team Coordination Migration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the coordination model from 3 teams to 2 teams by combining the current Product-facing lanes into a single `Product` team and keeping the `Platform` lane intact.

**Architecture:** Replace the team log file layout, update `AGENT_CONTEXT.md` and `tasks/commander.md` to the new 2-team ownership model, and adjust the commander sync script plus tests so the cron-driven coordination flow continues to work.

**Tech Stack:** Markdown coordination files, Node sync script, node:test, local cron-compatible repo workflow

---

## Chunk 1: Test-First Behavior Update

### Task 1: Rewrite the commander sync test for the 2-team model

**Files:**
- Modify: `scripts/commander-sync.test.mjs`

- [x] Update the test fixture to seed `team-1-product.md` and `team-2-platform.md`.
- [x] Update the expectations so the commander snapshot, dependencies, and interventions match the 2-team model.
- [x] Run the targeted test and confirm it fails before implementation changes.

## Chunk 2: Coordination File Migration

### Task 2: Replace the team files and repo instructions

**Files:**
- Modify: `AGENT_CONTEXT.md`
- Modify: `tasks/commander.md`
- Modify: `tasks/current.md`
- Add: `tasks/team-1-product.md`
- Add: `tasks/team-2-platform.md`
- Delete: `tasks/team-1-caregiver-experience.md`
- Delete: `tasks/team-2-intelligence-and-guidance.md`
- Delete: `tasks/team-3-platform-and-trust.md`

- [x] Replace the old team file set with the 2 new team files.
- [x] Fold Team 1 and Team 2 goals and queues into the new `Product` team.
- [x] Keep the existing platform queue under the new `Platform` team.
- [x] Update the commander and agent instructions to reference only the 2-team model.

## Chunk 3: Sync Logic Update

### Task 3: Update the commander sync script and docs

**Files:**
- Modify: `scripts/commander-sync.mjs`
- Modify: `docs/commander-cron.md`

- [x] Update the sync script to read 2 team files and emit 2-team snapshots.
- [x] Make sure dependency and intervention wording matches the new team names.
- [x] Update any documentation that still refers to the 3-team model.
- [x] Run the targeted test and make it pass.
