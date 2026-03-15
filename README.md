# AI Baby

Minimal monorepo scaffold for the AI Baby MVP.

This repository follows the accepted stack and boundaries documented in:

- `docs/prd.md`
- `docs/architecture.md`
- `docs/stack-decision.md`
- `docs/auth-decision.md`
- `docs/media-storage-decision.md`
- `docs/ai-provider-decision.md`
- `docs/daily-summary-rules.md`
- `docs/weekly-summary-aggregation.md`
- `docs/markdown-export-shape.md`
- `docs/export-package-structure.md`
- `docs/export-media-mode-decision.md`
- `docs/export-frontmatter-fields.md`
- `docs/obsidian-markdown-compatibility.md`
- `docs/data-model.md`
- `docs/local-development.md`

## Repository layout

- `apps/mobile`: future Expo / React Native client for caregivers
- `apps/web`: future Next.js app and API surface
- `packages/db`: future Prisma schema, migrations, and database access code
- `packages/ai`: future AI parsing, orchestration, and summary logic
- `packages/ui`: future shared UI primitives and design tokens
- `content/age-stages`: future curated reminder and milestone content

## Status

The repository now has a first-pass runnable local stack:

- `apps/web` can run a local Next.js dev server for the current API and status page
- `apps/mobile` can run the Expo shell for the current baby profile and meal logging slices
- the web homepage now acts as a manual test shell for baby-profile creation, text meal parsing, draft generation, and today's timeline review

The app is still MVP-in-progress: persistence is local-dev oriented, auth is bootstrapped through env vars, and production deployment wiring is not in place yet.

## Local setup

- install dependencies with `npm install`
- follow `docs/local-development.md` for setup expectations and env-file conventions
- copy `.env.example` to `.env.local` when a task introduces real local credentials
- run `npm run dev:web` for the backend
- run `npm run dev:mobile` for Expo
