# Markdown Coordination Workflow Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a repo-managed coordination workflow where each team updates its own markdown log and the commander reads those logs to maintain an org-level summary.

**Architecture:** Use one markdown file per team plus one commander summary file under `tasks/`. Update `AGENT_CONTEXT.md` so agents treat these files as the coordination surface and keep durable progress, blockers, and queue state there.

**Tech Stack:** Markdown files, existing repository task docs, AGENT_CONTEXT workflow rules

---

## Chunk 1: Coordination Files

### Task 1: Seed the commander and team logs

**Files:**
- Create: `tasks/commander.md`
- Create: `tasks/team-1-caregiver-experience.md`
- Create: `tasks/team-2-intelligence-and-guidance.md`
- Create: `tasks/team-3-platform-and-trust.md`

- [x] Add the commander file with mission, team snapshot, cross-team dependencies, decisions, interventions, and daily summary sections.
- [x] Add each team file with current state, active queue, dependency requests, and append-only work log sections.
- [x] Seed each team file with the current default goal and preferred task queue from the roadmap and task backlog.

## Chunk 2: Workflow Wiring

### Task 2: Make the markdown files the coordination surface

**Files:**
- Modify: `AGENT_CONTEXT.md`
- Modify: `tasks/current.md`

- [x] Update required read order so agents read `tasks/commander.md` and their assigned team file.
- [x] Replace chat-style reporting language with repo-file updates as the source of truth.
- [x] Document that teams update only their own file and the commander updates only `tasks/commander.md`.
- [x] Add a short note in `tasks/current.md` pointing to the new coordination files.

## Chunk 3: Verification

### Task 3: Read back the workflow files

**Files:**
- Test: `AGENT_CONTEXT.md`
- Test: `tasks/current.md`
- Test: `tasks/commander.md`
- Test: `tasks/team-1-caregiver-experience.md`
- Test: `tasks/team-2-intelligence-and-guidance.md`
- Test: `tasks/team-3-platform-and-trust.md`

- [x] Read each file after editing to confirm the workflow is internally consistent.
- [x] Verify the team goals and queues match the current roadmap and backlog.
