# MVP Implementation Plan

This document turns the PRD into an implementation-oriented plan with milestones that can be split across multiple agents.

## Guiding approach

Build the smallest end-to-end loop first:
1. create a baby profile
2. log a meal from chat input
3. confirm and store the record
4. review it in today's timeline
5. generate a daily summary

After that, expand into weekly summaries, reminders, and review pages.

## Milestone 1: Technical foundation

Goal: make the project ready for real implementation work.

### Outcomes
- application stack is chosen
- repository scaffold exists
- local development flow is documented
- deployment and environment strategy are decided

### Tasks
- choose app surface and primary stack
- choose auth approach
- choose Postgres + media storage setup
- choose AI provider abstraction strategy
- scaffold the app and basic folder structure
- define environment variable conventions
- document local setup steps

## Milestone 2: Core data model and contracts

Goal: define the system's source-of-truth objects before UI and API work expands.

### Outcomes
- core entities are defined
- relationships and required fields are documented
- initial API contracts are sketched
- Markdown export compatibility is considered early

### Tasks
- define baby profile entity
- define caregiver / account entity
- define photo asset entity
- define feeding record entity
- define milk and supplement record entity
- define daily summary entity
- define weekly summary entity
- define reminder entity
- define milestone / age-stage entity
- define diary / narrative export shape for Markdown export

## Milestone 3: MVP vertical slice

Goal: ship one complete usable loop.

### Outcomes
- parent can create one baby profile
- parent can submit image or text input
- system creates a draft record
- parent can confirm or correct the draft
- record appears in today's timeline

### Tasks
- baby profile create/edit flow
- chat input UI
- image upload flow
- text parsing flow
- draft record generation
- confirmation / correction UI
- persistence of source input and structured output
- today's timeline page

## Milestone 4: Summary generation

Goal: make records useful the same day and same week.

### Outcomes
- daily nutrition summary works from stored records
- weekly nutrition summary aggregates the last 7 days
- summaries are reviewable later

### Tasks
- daily summary rules and templates
- daily summary generation job / trigger
- daily summary storage and retrieval
- weekly aggregation logic
- weekly summary generation
- summary history UI

## Milestone 5: Age-based reminders and review pages

Goal: turn the product from logging tool into proactive assistant.

### Outcomes
- age stage is calculated from birth date
- reminder content is generated from stage templates
- users can review 7-day and 30-day history

### Tasks
- age-stage calculation logic
- reminder content model
- scheduled reminder trigger flow
- 7-day review page
- 30-day review page
- reminder history timeline

## Milestone 6: Export and portability

Goal: make family data portable and user-owned.

### Outcomes
- users can export baby diary content
- Markdown export works well with Obsidian
- media export behavior is defined

### Tasks
- define export package structure
- define Markdown note format
- decide local media copy vs linked media strategy
- include YAML frontmatter fields where useful
- build first-pass export endpoint / job

## Recommended implementation order

1. stack decision
2. data model
3. repo scaffold
4. baby profile + feeding log vertical slice
5. daily summary
6. weekly summary
7. reminders and review pages
8. Markdown export

## Parallelization notes

Tasks that can likely be split across separate agents after the stack is chosen:
- data model design
- app scaffold
- chat input UI
- image ingestion pipeline
- timeline page
- summary generation rules
- reminder engine
- export format design

## Definition of ready for coding agents

Before multiple agents start coding in parallel, the repo should have:
- a chosen stack
- a basic architecture decision
- a first-pass schema / entity model
- task ownership boundaries
- naming conventions for branches and files
