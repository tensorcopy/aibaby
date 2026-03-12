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
- AIB-020 `in_progress` Build baby profile create/edit flow
- AIB-021 `todo` Build chat input UI for text and image submission
- AIB-022 `todo` Build image upload pipeline
- AIB-023 `todo` Build text-to-record parsing flow
- AIB-024 `todo` Build draft feeding record generation
- AIB-025 `todo` Build confirmation / correction flow for AI-generated records
- AIB-026 `todo` Persist original input plus structured output
- AIB-027 `todo` Build today's timeline page

### Summaries
- AIB-030 `done` Define daily summary rules and output format
- AIB-031 `in_progress` Build daily summary generation flow
- AIB-032 `todo` Store and retrieve daily summaries
- AIB-033 `todo` Define weekly summary aggregation logic
- AIB-034 `todo` Build weekly summary generation flow
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

## In Progress

- AIB-020 `in_progress` Build baby profile create/edit flow
- AIB-031 `in_progress` Build daily summary generation flow

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
- AIB-030 `done` Define the first-pass daily summary rules and user-facing output contract for nutrition feedback
- AIB-050 `done` Define the first-pass export bundle layout for notes, media, and metadata
- AIB-051 `done` Define the additive Obsidian-friendly conventions layered on top of the baseline Markdown diary export shape
- AIB-052 `done` Accept copied local media as the default export mode, while leaving referenced and mixed modes as future options
- AIB-053 `done` Define the canonical YAML frontmatter field set for exported notes
- AIB-006 `done` Document the first-pass local setup guide and environment variable conventions for the current scaffold
- AIB-100 `done` Add a repository-managed product ideas note
- AIB-101 `done` Translate the PRD into an MVP implementation plan with milestones
- AIB-102 `done` Split stack and data model decisions into dedicated implementation docs

## Blockers

- No current blockers

## Coordination notes

- Before starting a task, the agent picking it up must open a small PR that changes the task to `in_progress` in this file so other agents do not start the same work
- Do not combine the task-claim change and the implementation change in the same first PR; implementation should follow in a separate PR after the claim is visible
- Foundation choices are now documented well enough to start assigning implementation work
- The initial repo scaffold exists, but it is intentionally non-runnable until follow-up PRs add actual Expo, Next.js, Prisma, and Supabase setup
- Next best parallel workstreams: app scaffold, auth wiring, media upload path, and daily-summary rules
- Keep architecture and task files updated in the same branch as implementation work
