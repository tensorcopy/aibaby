# AIB-083 Text Meal and Meal Draft Persistence Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the text-meal and meal-draft web persistence path from local JSON files onto repository-backed bindings without breaking the current route contract or no-database local mode.

**Architecture:** Add focused repository modules in `packages/db`, add matching web binding modules, and update route dependencies to switch between Prisma-backed bindings and the existing local stores. Drive the work through focused failing tests first and keep each step small enough to verify independently.

**Tech Stack:** Node.js test runner, Next.js route handlers, CommonJS feature modules, Prisma-backed repositories

---

## Chunk 1: Repository contract

### Task 1: Parsed text-meal repository

**Files:**
- Create: `packages/db/src/text-meal-submission-repository.js`
- Create: `packages/db/src/text-meal-submission-repository.test.js`

- [ ] Step 1: Write the failing repository tests for parsed text-meal submission create/load mapping.
- [ ] Step 2: Run the focused repository test command and confirm the new tests fail for the missing module or behavior.
- [ ] Step 3: Implement the minimal repository module to pass those tests.
- [ ] Step 4: Re-run the focused repository test command and confirm the tests pass.

### Task 2: Draft meal repository

**Files:**
- Create: `packages/db/src/draft-meal-record-repository.js`
- Create: `packages/db/src/draft-meal-record-repository.test.js`

- [ ] Step 1: Write the failing repository tests for draft record create/load/confirm mapping.
- [ ] Step 2: Run the focused repository test command and confirm the tests fail for the missing module or behavior.
- [ ] Step 3: Implement the minimal repository module to pass those tests.
- [ ] Step 4: Re-run the focused repository test command and confirm the tests pass.

## Chunk 2: Web bindings

### Task 3: Text-meal repository bindings

**Files:**
- Create: `apps/web/src/features/text-meal/repository-bindings.js`
- Create: `apps/web/src/features/text-meal/repository-bindings.test.js`
- Modify: `apps/web/src/features/text-meal/route-dependencies.js`

- [ ] Step 1: Write the failing web tests for repository-backed text-meal route dependencies.
- [ ] Step 2: Run the focused web test command and confirm the new tests fail.
- [ ] Step 3: Implement repository bindings and route dependency selection.
- [ ] Step 4: Re-run the focused web test command and confirm the tests pass.

### Task 4: Meal-draft repository bindings

**Files:**
- Create: `apps/web/src/features/meal-drafts/repository-bindings.js`
- Create: `apps/web/src/features/meal-drafts/repository-bindings.test.js`
- Modify: `apps/web/src/features/meal-drafts/route-dependencies.js`

- [ ] Step 1: Write the failing web tests for repository-backed meal-draft route dependencies.
- [ ] Step 2: Run the focused web test command and confirm the new tests fail.
- [ ] Step 3: Implement repository bindings and route dependency selection.
- [ ] Step 4: Re-run the focused web test command and confirm the tests pass.

## Chunk 3: End-to-end contract and task state

### Task 5: Route verification and repo state

**Files:**
- Modify: `apps/web/src/features/text-meal/routes.test.ts`
- Modify: `apps/web/src/features/meal-drafts/routes.test.ts`
- Modify: `packages/db/package.json`
- Modify: `packages/db/README.md`
- Modify: `tasks/team-2-platform.md`
- Modify: `tasks/current.md`

- [ ] Step 1: Add or adjust route tests only where needed to cover the repository-backed path.
- [ ] Step 2: Run the focused web and db test suites to confirm the changed path stays green.
- [ ] Step 3: Update task tracking and package metadata for the checkpoint.
- [ ] Step 4: Run the final verification set for the slice.
