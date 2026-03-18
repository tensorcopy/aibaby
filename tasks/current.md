# Current Tasks

This file is the lightweight shared backlog for human and agent coordination.

## Active

### Foundation
- AIB-002 `done` Choose the auth approach
- AIB-003 `done` Choose the media storage approach for photos and videos
- AIB-004 `done` Choose the AI provider abstraction strategy
- AIB-006 `done` Document local development setup and environment variables

### Data model
- AIB-019 `done` Define the Markdown export shape for diary output

### MVP vertical slice
- AIB-021 `done` Build chat input UI for text and image submission
- AIB-022 `done` Build image upload pipeline
- AIB-023 `done` Build text-to-record parsing flow
- AIB-024 `done` Build draft feeding record generation
- AIB-025 `done` Build confirmation / correction flow for AI-generated records
- AIB-026 `done` Persist original input plus structured output
- AIB-027 `done` Build today's timeline page

### Summaries
- AIB-030 `done` Define daily summary rules and output format
- AIB-031 `done` Build daily summary generation flow
- AIB-032 `done` Store and retrieve daily summaries
- AIB-033 `done` Define weekly summary aggregation logic
- AIB-034 `done` Build weekly summary generation flow
- AIB-035 `done` Build summary history view

### Reminders and review
- AIB-040 `done` Build age-stage calculation logic
- AIB-041 `done` Define reminder content model and templates
- AIB-042 `done` Build scheduled reminder trigger flow
- AIB-043 `done` Build 7-day review page
- AIB-044 `done` Build 30-day review page
- AIB-045 `done` Build reminder history timeline

### Export and portability
- AIB-050 `done` Define export package structure
- AIB-051 `done` Define Markdown note format for Obsidian compatibility
- AIB-052 `done` Decide media export behavior: local files vs referenced URLs
- AIB-053 `done` Define YAML frontmatter fields for exported notes
- AIB-054 `done` Build first-pass Markdown export flow

### Runnable app and integration
- AIB-060 `done` Bootstrap a runnable Next.js web app shell with dev/start scripts and route mounting
- AIB-061 `done` Bootstrap a runnable Expo app configuration for the existing mobile routes and session env
- AIB-062 `done` Wire one documented end-to-end local flow between the mobile app and live local backend
- AIB-063 `done` Add demo-data seed and reset commands for baby profile, meals, reports, reminders, and exports
- AIB-064 `done` Add a first-pass export trigger surface in the mobile app for Markdown bundle generation
- AIB-065 `done` Add a repo-managed smoke checklist for local startup, core flows, and export verification
- AIB-066 `done` Replace local owner-header bootstrap with a first-pass real auth/session handoff
- AIB-067 `done` Fix the Expo app config to expose the new session-token bootstrap instead of the removed owner-user-id field
- AIB-068 `done` Make the demo seed flow stable across reruns so the mobile bootstrap baby id does not drift
- AIB-069 `done` Promote the loaded current baby profile into the mobile session so home quick actions activate after auth-only bootstrap
- AIB-070 `done` Stabilize the mobile baby-profile screen-shell test so it does not fail when the calendar month boundary changes

### Team 1 product surfaces
- AIB-108 `done` Add home-screen entry points for review, reminders, exports, and future growth
- AIB-109 `done` Add a reminder detail screen shell with done / snooze / dismiss states
- AIB-110 `done` Add a first-pass notification center screen model and route shell
- AIB-111 `done` Add export history and bundle status surfaces in mobile
- AIB-112 `done` Add a mobile meal-ideas route shell for the one-day suggestion set
- AIB-113 `done` Restore the mobile review route so quick actions and notifications land on a real screen
- AIB-114 `done` Unify mobile review links onto the shared `/review` route
- AIB-115 `in_progress` Add a visible 7-day / 30-day switcher to the shared mobile review flow

### Production hardening
- AIB-080 `done` Replace the local bearer session token flow with real Supabase auth bootstrap in Expo and backend token validation in web
- AIB-081 `todo` Add the first real database schema and repository layer for babies, meals, reminders, reports, and export jobs
- AIB-082 `todo` Replace baby-profile local JSON persistence with the real repository implementation
- AIB-083 `todo` Replace meal, reminder, report, and export local JSON persistence with the real repository implementation
- AIB-084 `todo` Replace the local upload blob flow with real storage upload negotiation and persisted asset metadata
- AIB-085 `todo` Add real environment bootstrap and app configuration for Supabase auth, database access, and storage
- AIB-086 `todo` Add real migration, seed, and reset commands for the database-backed local/dev stack
- AIB-087 `todo` Run and document the first authenticated end-to-end smoke pass against the real auth/data/storage stack
- AIB-088 `done` Define the first hosted deployment plan and environment mapping for moving from the local shell to phone-testable staging
- AIB-089 `done` Centralize mobile/web runtime env parsing and expose Supabase-ready public config placeholders without changing the current local session bootstrap

## In Progress

- AIB-082 `in_progress` Replace baby-profile local JSON persistence with the real repository implementation
- AIB-115 `in_progress` Add a visible 7-day / 30-day switcher to the shared mobile review flow

## Done

- AIB-000 `done` Move product requirements and shared project state into repository-managed files
- AIB-001 `done` Write and accept the MVP stack baseline in `docs/architecture.md` and `docs/stack-decision.md`
- AIB-002 `done` Accept Supabase Auth with email OTP / magic link as the MVP auth baseline and define the auth boundaries
- AIB-003 `done` Accept private Supabase Storage with backend-controlled uploads and signed URL reads as the MVP media storage baseline
- AIB-004 `done` Accept OpenAI as the MVP AI provider baseline with a provider boundary owned by `packages/ai`
- AIB-005 `done` Add the initial monorepo-oriented scaffold with workspace placeholders for apps, packages, and shared content
- AIB-010 `done` Define the baby profile entity in `docs/data-model.md`
- AIB-011 `done` Define the caregiver / account entity in `docs/data-model.md`
- AIB-012 `done` Define the feeding record entity in `docs/data-model.md`
- AIB-013 `done` Define the milk and supplement record entity in `docs/data-model.md`
- AIB-014 `done` Define the photo asset entity in `docs/data-model.md`
- AIB-015 `done` Define the daily summary entity in `docs/data-model.md`
- AIB-016 `done` Define the weekly summary entity in `docs/data-model.md`
- AIB-017 `done` Define the reminder entity in `docs/data-model.md`
- AIB-018 `done` Define the age-stage / milestone entity in `docs/data-model.md`
- AIB-019 `done` Define the first-pass Markdown diary export structure for later export and Obsidian work
- AIB-020 `done` Build the first-pass mobile baby profile create/edit flow, including home handoff and quick actions
- AIB-021 `done` Build the first-pass mobile chat input UI for text and image meal draft submission
- AIB-022 `done` Build the image upload negotiation, direct-storage handoff, and mobile upload completion flow
- AIB-023 `done` Build the first-pass text-only parsing flow that classifies meal type and food items and returns a candidate record preview
- AIB-024 `done` Build the first-pass draft feeding-record generation flow, including shared meal-record schemas and local-dev persistence
- AIB-025 `done` Build the first-pass confirm/correct flow for meal drafts, including inline mobile editing and `/api/meals/:mealId/confirm`
- AIB-026 `done` Persist original parse input plus corrected structured output through ingestion events and local-dev stores
- AIB-027 `done` Build the first-pass today's timeline route and `/api/babies/:babyId/meals?date=YYYY-MM-DD`
- AIB-030 `done` Define the first-pass daily summary rules and user-facing output contract for nutrition feedback
- AIB-031 `done` Build the first-pass deterministic daily summary generation flow in `packages/ai`
- AIB-032 `done` Build the first-pass daily summary storage and retrieval contract in `packages/db`
- AIB-033 `done` Define the first-pass weekly summary aggregation rules and output shape
- AIB-034 `done` Build the first-pass deterministic weekly summary generation flow in `packages/ai`
- AIB-035 `done` Build the first-pass summary history screen and report-history APIs for daily and weekly summaries
- AIB-040 `done` Build the first-pass deterministic age-stage band calculator and repository-managed baseline stage-band definitions
- AIB-041 `done` Define the first-pass repository-managed reminder content model and stage-keyed templates
- AIB-042 `done` Build the first-pass deterministic reminder trigger flow and `/api/babies/:babyId/reminders` APIs
- AIB-043 `done` Build the first-pass 7-day review page with daily summaries, new-food highlights, and day-detail links
- AIB-044 `done` Build the first-pass 30-day review page with common-food stats, weekly rollups, and reminder history
- AIB-045 `done` Build the first-pass reminder history timeline screen
- AIB-054 `done` Build the first-pass Markdown export generator and `/api/babies/:babyId/export/markdown` endpoint
- AIB-060 `done` Build the first-pass runnable local web shell that mounts the current App Router-style route handlers through `npm run dev --workspace @aibaby/web`
- AIB-061 `done` Build the first-pass Expo app shell config with app metadata, router bootstrap, and local session env defaults
- AIB-062 `done` Document the first end-to-end local flow between Expo mobile and the local web runtime, including shared root scripts
- AIB-063 `done` Add repeatable `demo:seed` and `demo:reset` commands for local baby profile, meals, reminders, reports coverage, and export data
- AIB-064 `done` Add a first-pass mobile export trigger on the summaries screen for Markdown bundle generation
- AIB-065 `done` Add a repository-managed local smoke checklist for startup, core user flows, and export verification
- AIB-066 `done` Replace the mobile owner-header bootstrap with a first-pass bearer session-token handoff and local session-token tooling
- AIB-067 `done` Fix the Expo public config to match the session-token mobile bootstrap used by the local QA flow
- AIB-068 `done` Stabilize the demo seed baby id so repeated seeding does not break the mobile demo bootstrap
- AIB-069 `done` Sync the loaded current baby profile id back into the mobile session after auth-scoped home loads
- AIB-070 `done` Replace the month-boundary-sensitive screen-shell age assertion with a dynamic summary expectation during QA hardening
- AIB-080 `done` Add first-pass Supabase session bootstrap in Expo and backend bearer validation against Supabase while preserving the local-dev auth fallback
- AIB-088 `done` Define the first hosted deployment path across Expo, Vercel, and Supabase, plus the env mapping needed to reach phone-only staging tests
- AIB-089 `done` Centralize runtime env parsing for Expo and the local web shell so staged Supabase/bootstrap work builds on one repo-managed config contract
- AIB-050 `done` Define the first-pass export bundle layout for notes, media, and metadata
- AIB-051 `done` Define the additive Obsidian-friendly conventions layered on top of the baseline Markdown diary export shape
- AIB-052 `done` Accept copied local media as the default export mode, while leaving referenced and mixed modes as future options
- AIB-053 `done` Define the canonical YAML frontmatter field set for exported notes
- AIB-006 `done` Document the first-pass local setup guide and environment variable conventions for the current scaffold
- AIB-100 `done` Add a repository-managed product ideas note
- AIB-101 `done` Translate the PRD into an MVP implementation plan with milestones
- AIB-102 `done` Split stack and data model decisions into dedicated implementation docs
- AIB-103 `done` Add a three-team product roadmap with independent ownership areas and pick-up-ready work queues

## Blockers

- Production hardening work from `AIB-085` onward still needs real project environment values and full provider setup. The staged env/bootstrap slice is merged on `main`, but device-level validation is still pending outside this sandbox.

## Coordination notes

- Team-level progress and blockers now live in `tasks/team-1-product.md` and `tasks/team-2-platform.md`
- Org-level coordination summaries and commander decisions now live in `tasks/commander.md`
- Task-related PR titles must include the task ID in the format `type(AIB-123): short description`
- Foundation choices are now documented well enough to start assigning implementation work
- The current local MVP shell is runnable and QA-hardened, but production auth, database, and storage integration are still the next major gap
- `AIB-089` landed the shared env/bootstrap contract, so `AIB-085` can now focus on real framework/provider integration instead of env naming cleanup
- `AIB-085` merged via PR `#184`; remaining work there is the runtime/device validation pass once env values exist
- `AIB-081` merged via PR `#186`; Team 2 now has an `AIB-082` checkpoint branch that swaps baby-profile routes onto a repository-backed path and keeps timeline compatibility when no DB runtime is configured
- `AIB-108`, `AIB-109`, `AIB-110`, `AIB-111`, `AIB-112`, `AIB-113`, and `AIB-114` are all merged on `main` via PRs `#187`, `#189`, `#185`, `#192`, `#193`, `#194`, and `#195`; Team 1 is now using `AIB-115` to make both review windows discoverable inside the shared `/review` flow
- Next recommended execution order now: `AIB-085`, `AIB-081`, `AIB-082`, `AIB-083`, `AIB-084`, `AIB-086`, then `AIB-087`
- Keep architecture and task files updated in the same branch as implementation work
