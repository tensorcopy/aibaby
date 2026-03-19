# Team 2 Log: Platform

## Current State

- Goal: advance the project from local MVP shell toward real staged infrastructure
- State: review_ready
- Current task: `AIB-083` replace meal, reminder, report, and export local JSON persistence with the real repository implementation
- Next step: merge the first `AIB-083` checkpoint for text-meal and meal-draft repository bindings, then continue the remaining reminder, report history, and export persistence replacements
- Blockers: none for the first `AIB-083` slice; separate staged/device validation still depends on real project environment values and full provider setup
- Files: `tasks/team-2-platform.md`, `tasks/current.md`, `packages/db/src/*repository*.js`, `packages/db/package.json`, `packages/db/README.md`, `apps/web/src/features/text-meal/*`, `apps/web/src/features/meal-drafts/*`, `apps/web/package.json`
- Verification: `npm run test:text-meal-api --workspace @aibaby/web`; `npm run test:meal-drafts-api --workspace @aibaby/web`; `npm run test:prisma-repository --workspace @aibaby/db`
- Last updated: 2026-03-18

## Active Queue

1. `AIB-085` real environment bootstrap and app configuration for Supabase auth, database access, and storage
2. `AIB-081` first real database schema and repository layer
3. `AIB-082` replace baby-profile local JSON persistence with the real repository implementation
4. `AIB-083` replace meal, reminder, report, and export local JSON persistence with the real repository implementation
5. `AIB-084` replace the local upload blob flow with real storage upload negotiation and persisted asset metadata
6. `AIB-086` add real migration, seed, and reset commands for the database-backed local/dev stack
7. `AIB-087` run and document the first authenticated end-to-end smoke pass against the real auth/data/storage stack

## Dependency Requests

- Human or environment owner will eventually need to provide real project environment values and provider setup for authenticated staging validation.

## Work Log

### 2026-03-17 Setup

- Log created as part of the 2-team migration.
- Queue preserves the previous platform hardening order.
- Team should update `Current State` first, then append dated entries here as work progresses.

### 2026-03-17 AIB-085 checkpoint

- Added staged mobile env/bootstrap modules for Expo public config, app identity selection, and Supabase session auth normalization.
- Added web runtime env parsing plus bearer auth verification that accepts local session tokens, legacy dev-user tokens, and configured Supabase access tokens.
- Updated env examples and local-development docs to describe the new staged contract.
- Opened PR `#184` for this checkpoint branch.
- Current blockers remain external: real project env values and the remaining runtime setup for full staged/device validation.

### 2026-03-17 AIB-081 kickoff

- `AIB-085` checkpoint was merged via PR `#184`, so the next Team 2 slice moves to `AIB-081`.
- Planned first slice: add the core Prisma schema and Prisma-facing repository adapters for the existing baby profile and report contracts before wiring persistence replacements.

### 2026-03-17 AIB-081 checkpoint

- Added `packages/db/prisma/schema.prisma` with the first relational model for users, babies, settings, caregivers, conversations, messages, meal records, media assets, reports, reminders, and ingestion events.
- Added Prisma-facing adapters for baby profiles, daily reports, and weekly reports so the existing DB contracts can bridge into Prisma incrementally.
- Updated `packages/db` package metadata and docs so the schema and adapter verification path lives in repo scripts.
- Verified the package contract tests plus `prisma validate` with a self-contained dummy `DATABASE_URL`.

### 2026-03-17 AIB-082 kickoff

- `AIB-081` was merged via PR `#186`, so Team 2 moved directly to `AIB-082` on a fresh branch from the updated `main`.
- Planned first slice: replace the baby-profile JSON file bindings with a repository module backed by the Prisma baby-profile adapters while keeping the existing route contract stable.

### 2026-03-17 AIB-082 checkpoint

- Added `packages/db/src/baby-profile-repository.js` plus repository tests so the baby-profile persistence layer can target Prisma delegates while preserving the existing row contract used by the web routes.
- Added `apps/web/src/features/baby-profile/repository-bindings.js` and rewired `route-dependencies.js` so baby-profile routes can use the real repository path when Prisma runtime dependencies are available, while preserving the current local-store fallback in no-DB environments.
- Updated the timeline route and snapshot builder so selected-baby resolution can come from the baby-profile repository path instead of only `baby-profiles.json`, avoiding a regression when the profile API stops writing the local JSON file.
- Verified the new repository, route-dependency, baby-profile API, and timeline tests; `prisma validate` itself could not be rerun here because this fresh worktree does not have the Prisma CLI installed.

### 2026-03-18 AIB-083 kickoff

- `AIB-082` is now merged on `main`, so Team 2 moved forward to `AIB-083`.
- First planned slice: replace the text-meal and meal-draft JSON persistence path with repository-backed bindings while preserving the current route contract and local-store fallback in no-DB environments.
- Current task: wire repository-backed text parse and draft meal persistence into the existing web route dependencies.
- Next task: extend the same persistence replacement pattern to the remaining reminder, report history, and export surfaces once the first slice is merged.
- Blockers: none for this slice beyond the longer-running staged environment setup needed for later end-to-end validation.

### 2026-03-18 AIB-083 checkpoint

- Added `packages/db/src/text-meal-submission-repository.js` and `packages/db/src/draft-meal-record-repository.js` so parsed text submissions and draft meal records can persist against Prisma delegates while preserving the existing row-shaped web contract.
- Added repository-binding and route-dependency coverage for `apps/web/src/features/text-meal/*` and `apps/web/src/features/meal-drafts/*`, including the same Prisma-when-available and local-store fallback pattern used in `AIB-082`.
- Updated package test scripts and db docs so the new repository-backed slice is part of the regular focused verification path.
- Verified `npm run test:text-meal-api --workspace @aibaby/web`, `npm run test:meal-drafts-api --workspace @aibaby/web`, and `npm run test:prisma-repository --workspace @aibaby/db`.
