# Team Log PR Enforcement Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce the team-log update rule at PR time by adding a GitHub check that fails code PRs which do not modify either team log file, while allowing docs/coordination-only bypasses.

**Architecture:** Add a small Node rule checker under `scripts/` with a focused node:test suite, then wire it into a GitHub Actions workflow that evaluates changed files on pull requests targeting `main`.

**Tech Stack:** Node ESM, node:test, GitHub Actions, git diff file lists

---

## Chunk 1: Rule Checker

### Task 1: Write the failing rule test

**Files:**
- Create: `scripts/check-team-log-update.test.mjs`
- Modify: `package.json`

- [ ] Add tests for pass/fail behavior covering code PRs, bypass-only PRs, and mixed-change PRs.
- [ ] Run the targeted test and confirm it fails before implementation.

### Task 2: Implement the checker

**Files:**
- Create: `scripts/check-team-log-update.mjs`

- [ ] Implement the pure changed-file rule evaluator.
- [ ] Add CLI support for comparing `base` and `head` refs through `git diff --name-only`.
- [ ] Run the targeted test and make it pass.

## Chunk 2: Workflow Wiring

### Task 3: Add the GitHub Actions gate

**Files:**
- Add: `.github/workflows/team-log-enforcement.yml`

- [ ] Add a pull_request workflow targeting `main`.
- [ ] Run the checker against the PR base and head SHAs.
- [ ] Keep the workflow read-only and minimal.
