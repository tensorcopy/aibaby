# Team 2 Log: Platform

## Current State

- Goal: advance the project from local MVP shell toward real staged infrastructure
- State: review_ready
- Current task: `AIB-082` replace baby-profile local JSON persistence with the real repository implementation
- Next step: merge this baby-profile repository checkpoint, then continue the remaining persistence replacement work for `AIB-082` / `AIB-083`
- Blockers: none for this slice; separate staged/device validation still depends on real project environment values and full provider setup
- Files: `packages/db/src/baby-profile*.js`, `apps/web/src/features/baby-profile/*`, `tasks/current.md`
- Verification: `npm run test:baby-profile-api --workspace @aibaby/web`; `npm run test:timeline-api --workspace @aibaby/web`; `npm run test:prisma-repository --workspace @aibaby/db`; `npm run prisma:validate --workspace @aibaby/db` failed in this fresh worktree because the `prisma` CLI is not installed here
- Last updated: 2026-03-17

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
