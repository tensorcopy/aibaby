# Team 2 Log: Platform

## Current State

- Goal: advance the project from local MVP shell toward real staged infrastructure
- State: review_ready
- Current task: `AIB-085` staged env/bootstrap and readiness slice for Expo public config, Supabase session bootstrap, and web runtime auth/env wiring
- Next step: if real env/provider access is still unavailable, start `AIB-081`; otherwise finish the remaining staged/device validation work for `AIB-085`
- Blockers: later staging validation still depends on real project environment values and full provider setup
- Files: `.env.example`, `apps/mobile/app.config.ts`, `apps/mobile/.env.example`, `apps/mobile/src/features/app-shell/*`, `apps/web/.env.example`, `apps/web/src/runtime/*`, `apps/web/src/features/baby-profile/*`, `docs/local-development.md`, `tasks/current.md`
- Verification: `node --experimental-strip-types --test apps/mobile/src/features/app-shell/appConfig.test.ts apps/mobile/src/features/app-shell/publicConfig.test.ts apps/mobile/src/features/app-shell/mobileSession.test.ts apps/mobile/src/features/app-shell/supabaseSession.test.ts`; `node --experimental-strip-types --test apps/web/src/runtime/env.test.ts apps/web/src/features/baby-profile/auth.test.js`
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
- Current blockers remain external: real project env values and the remaining runtime setup for full staged/device validation.
