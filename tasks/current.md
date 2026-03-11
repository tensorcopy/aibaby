# Current Tasks

This file is the lightweight shared backlog for human and agent coordination.

## Active

### Foundation
- AIB-001 `in_progress` Choose the application stack
- AIB-002 `todo` Choose the auth approach
- AIB-003 `todo` Choose the media storage approach for photos and videos
- AIB-004 `todo` Choose the AI provider abstraction strategy
- AIB-005 `todo` Scaffold the initial project structure
- AIB-006 `todo` Document local development setup and environment variables

### Data model
- AIB-010 `todo` Define the baby profile entity
- AIB-011 `todo` Define the caregiver / account entity
- AIB-012 `todo` Define the feeding record entity
- AIB-013 `todo` Define the milk and supplement record entity
- AIB-014 `todo` Define the photo asset entity
- AIB-015 `todo` Define the daily summary entity
- AIB-016 `todo` Define the weekly summary entity
- AIB-017 `todo` Define the reminder entity
- AIB-018 `todo` Define the age-stage / milestone entity
- AIB-019 `todo` Define the Markdown export shape for diary output

### MVP vertical slice
- AIB-020 `todo` Build baby profile create/edit flow
- AIB-021 `todo` Build chat input UI for text and image submission
- AIB-022 `todo` Build image upload pipeline
- AIB-023 `todo` Build text-to-record parsing flow
- AIB-024 `todo` Build draft feeding record generation
- AIB-025 `todo` Build confirmation / correction flow for AI-generated records
- AIB-026 `todo` Persist original input plus structured output
- AIB-027 `todo` Build today's timeline page

### Summaries
- AIB-030 `todo` Define daily summary rules and output format
- AIB-031 `todo` Build daily summary generation flow
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
- AIB-050 `todo` Define export package structure
- AIB-051 `todo` Define Markdown note format for Obsidian compatibility
- AIB-052 `todo` Decide media export behavior: local files vs referenced URLs
- AIB-053 `todo` Define YAML frontmatter fields for exported notes
- AIB-054 `todo` Build first-pass Markdown export flow

## In Progress

- AIB-001 `in_progress` Stack direction is now documented in `docs/architecture.md`; implementation scaffold is still pending

## Done

- AIB-000 `done` Move product requirements and shared project state into repository-managed files
- AIB-100 `done` Add a repository-managed product ideas note
- AIB-101 `done` Translate the PRD into an MVP implementation plan with milestones

## Blockers

- No current blockers

## Coordination notes

- Start with foundation tasks before assigning implementation tasks to multiple agents
- After AIB-001 through AIB-006 are settled, data model and vertical-slice tasks can be split across agents
- Update task status in the same branch where the work happens
