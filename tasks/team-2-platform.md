# Team 2 Log: Platform

## Current State

- Goal: advance the project from local MVP shell toward real staged infrastructure
- State: review_ready
- Current task: `AIB-081` foundational Prisma schema plus repository adapters for baby profiles and report models
- Next step: extend the repository bridge to meals, reminders, uploads, and export persistence, or move to `AIB-082` once the schema baseline is merged
- Blockers: none for this slice; separate staged/device validation still depends on real project environment values and full provider setup
- Files: `packages/db/package.json`, `packages/db/README.md`, `packages/db/prisma/schema.prisma`, `packages/db/src/*`, `tasks/current.md`
- Verification: `npm run test:baby-profile --workspace @aibaby/db`; `npm run test:daily-report --workspace @aibaby/db`; `npm run test:weekly-report --workspace @aibaby/db`; `npm run test:prisma-schema --workspace @aibaby/db`; `npm run test:prisma-repository --workspace @aibaby/db`; `npm run prisma:validate --workspace @aibaby/db`
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
