# AIB-083 Text Meal and Meal Draft Persistence Design

## Goal

Replace the current web JSON-file persistence path for parsed text-meal submissions and draft meal records with repository-backed bindings, while preserving the existing route contracts and the no-database local fallback.

## Scope

This slice covers:

- `apps/web/src/features/text-meal/*`
- `apps/web/src/features/meal-drafts/*`
- new repository modules in `packages/db/src/*`
- task tracking updates needed for the checkpoint

This slice does not cover:

- reminders
- report history
- export job persistence
- upload/storage flow

## Current Problem

The web text parse and draft meal routes still write directly to local JSON files. That blocks the staged infrastructure path started in `AIB-081` and `AIB-082`, and it leaves the current repository-backed baby-profile work disconnected from the rest of the meal-ingestion pipeline.

## Design

### Repository seam

Add repository modules in `packages/db` that expose the behaviors the web routes already need:

- create and load parsed text-meal submissions
- create and reload draft meal records from parsed submissions
- confirm existing draft meal records

The repository output should preserve the row-shaped contract already returned by the local stores so the route layer does not need a response-shape rewrite.

### Web binding seam

Add web binding modules beside the existing route dependencies that:

- construct the repository modules from Prisma delegates
- translate `null` repository results into existing route-layer errors where needed
- keep the web feature boundary stable

### Runtime selection

Follow the `AIB-082` route-dependency pattern:

- if Prisma runtime dependencies are available, use repository-backed bindings
- otherwise, fall back to the existing local-store functions

That keeps local no-DB development working while moving staged environments toward the real database path.

## Verification

Start with failing tests for:

- repository data mapping in `packages/db`
- repository-backed route dependencies in `apps/web`
- existing text-meal and meal-draft route tests for the end-to-end contract

Then rerun the focused web and db test suites for the changed surfaces.
