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

- `apps/mobile`: first-pass Expo / React Native client shell for caregivers
- `apps/web`: first-pass local web runtime and API surface
- `packages/db`: future Prisma schema, migrations, and database access code
- `packages/ai`: future AI parsing, orchestration, and summary logic
- `packages/ui`: future shared UI primitives and design tokens
- `content/age-stages`: future curated reminder and milestone content

## Status

The current repo is past scaffold-only. It now has:

- a runnable local web shell in `apps/web`
- a runnable Expo app shell in `apps/mobile`
- first-pass local flows for baby profile, meal logging, timeline, summaries,
  reminders, review, and Markdown export

Database and auth are still local-dev placeholders; Prisma and Supabase wiring
have not landed yet.

## Local setup

- install dependencies with `npm install`
- follow `docs/local-development.md` for setup expectations and env-file conventions
- copy `apps/mobile/.env.example` to `apps/mobile/.env.local` before starting Expo
- use `npm run demo:session -- demo-owner-1` to generate a local mobile session token
- use `npm run demo:seed` to generate a repeatable local dataset
- use `npm run dev:web` and `npm run dev:mobile` for the current local shells
- follow `docs/local-e2e-flow.md` for the first end-to-end local walkthrough
- use `docs/smoke-checklist.md` for repeatable local regression checks
