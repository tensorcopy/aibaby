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
- AIB-026 `todo` Persist original input plus structured output
- AIB-027 `done` Build today's timeline page
- AIB-028 `todo` Fix the mobile baby profile save flow so failed saves surface recovery actions and the user can navigate away cleanly

### Summaries
- AIB-030 `done` Define daily summary rules and output format
- AIB-031 `done` Build daily summary generation flow
- AIB-032 `done` Store and retrieve daily summaries
- AIB-033 `done` Define weekly summary aggregation logic
- AIB-034 `done` Build weekly summary generation flow
- AIB-035 `todo` Build summary history view

### Reminders and review
- AIB-040 `todo` Build age-stage calculation logic
- AIB-041 `todo` Define reminder content model and templates
- AIB-042 `todo` Build scheduled reminder trigger flow
- AIB-043 `todo` Build 7-day review page
- AIB-044 `todo` Build 30-day review page
- AIB-045 `todo` Build reminder history timeline

### Export and portability
- AIB-050 `done` Define export package structure
- AIB-051 `done` Define Markdown note format for Obsidian compatibility
- AIB-052 `done` Decide media export behavior: local files vs referenced URLs
- AIB-053 `done` Define YAML frontmatter fields for exported notes
- AIB-054 `todo` Build first-pass Markdown export flow

### UX and visual design
- AIB-055 `done` Define a warmer baby-product visual direction for mobile and web, including color, typography, spacing, and component tone
- AIB-056 `in_progress` Apply the new baby-product UX direction to the current mobile MVP screens, starting with home, baby profile, and meal logging

## In Progress

- AIB-056 Apply the new baby-product UX direction to the current mobile MVP screens, starting with home, baby profile, and meal logging

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
- AIB-024 `done` Build the first-pass draft feeding record generation flow from parsed text submissions and persist draft meal records plus meal items
- AIB-027 `done` Build the first-pass web today timeline page and manual test shell on top of the local-dev API routes
- AIB-030 `done` Define the first-pass daily summary rules and user-facing output contract for nutrition feedback
- AIB-031 `done` Build the first-pass deterministic daily summary generation flow in `packages/ai`
- AIB-032 `done` Build the first-pass daily summary storage and retrieval contract in `packages/db`
- AIB-033 `done` Define the first-pass weekly summary aggregation rules and output shape
- AIB-034 `done` Build the first-pass deterministic weekly summary generation flow in `packages/ai`
- AIB-050 `done` Define the first-pass export bundle layout for notes, media, and metadata
- AIB-051 `done` Define the additive Obsidian-friendly conventions layered on top of the baseline Markdown diary export shape
- AIB-052 `done` Accept copied local media as the default export mode, while leaving referenced and mixed modes as future options
- AIB-053 `done` Define the canonical YAML frontmatter field set for exported notes
- AIB-055 `done` Define the Scandinavian Nursery visual direction for AI Baby, including color, typography, spacing, and screen-level mockups for home, baby profile, and meal logging
- AIB-006 `done` Document the first-pass local setup guide and environment variable conventions for the current scaffold
- AIB-100 `done` Add a repository-managed product ideas note
- AIB-101 `done` Translate the PRD into an MVP implementation plan with milestones
- AIB-102 `done` Split stack and data model decisions into dedicated implementation docs

## Blockers

- No current blockers

## Coordination notes

- Task-related PR titles must include the task ID in the format `type(AIB-123): short description`
- Foundation choices are now documented well enough to start assigning implementation work
- The initial repo scaffold exists, but it is intentionally non-runnable until follow-up PRs add actual Expo, Next.js, Prisma, and Supabase setup
- Next best parallel workstreams: app scaffold, auth wiring, media upload path, and daily-summary rules
- Keep architecture and task files updated in the same branch as implementation work
