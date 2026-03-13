# Local Development

## Status

This guide defines the current local-development baseline for the repository.

The repository is scaffolded, but the Expo app, Next.js app, Prisma schema, and Supabase wiring are not implemented yet. Use this document as the setup and environment convention source of truth until those pieces land.

## Prerequisites

Install the following before working in the repo:

- Node.js 20.x
- npm 10.x or newer
- Git

Planned but not required yet:

- Expo CLI or the local Expo toolchain
- Supabase CLI
- a PostgreSQL instance for local database work

## First-time setup

From the repository root:

```bash
npm install
```

At the current scaffold stage, this installs workspace metadata only. App-specific runtime dependencies will be added in follow-up implementation PRs.

## Workspace layout

- `apps/mobile`: future Expo / React Native app
- `apps/web`: future Next.js app and API surface
- `packages/db`: future Prisma schema and database helpers
- `packages/ai`: future AI orchestration logic
- `packages/ui`: future shared UI package
- `content/age-stages`: future curated reminder and milestone content

## Environment file conventions

Use the following convention across the repo:

- keep a checked-in `.env.example` at the repository root
- keep real local secrets in `.env.local`
- keep app-specific local overrides in:
  - `apps/web/.env.local`
  - `apps/mobile/.env.local`
  - `packages/db/.env.local` only if package-local tooling requires it later

Do not commit real secrets, service-role keys, or device tokens.

## Environment variable naming

Use clear prefixes so ownership is obvious:

- `DATABASE_` for database connection settings
- `SUPABASE_` for client-safe project configuration
- `SUPABASE_SERVICE_` for server-only privileged keys
- `EXPO_PUBLIC_` for mobile values intentionally exposed to the client bundle
- `AI_` for model provider and orchestration configuration
- `SENTRY_` for observability configuration
- `TRIGGER_` for scheduled job or workflow tooling

## Current variable baseline

The repository root `.env.example` should define placeholders for:

- `DATABASE_URL`
- `DIRECT_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_AIBABY_OWNER_USER_ID`
- `EXPO_PUBLIC_AIBABY_CURRENT_BABY_ID`
- `EXPO_PUBLIC_AIBABY_API_BASE_URL`
- `AI_PROVIDER`
- `OPENAI_API_KEY`
- `OPENAI_MODEL_PARSING`
- `OPENAI_MODEL_SUMMARY`
- `OPENAI_MODEL_REMINDERS`
- `SENTRY_DSN`
- `TRIGGER_SECRET_KEY`

Not every variable is used yet. The goal is to standardize names before implementation expands.

## Working rules for local env files

- prefer `.env.local` for developer-specific values
- do not duplicate the same value in multiple env files unless a framework requires it
- server-only keys must never be referenced from mobile code
- if a value becomes framework-specific, keep the canonical name in `.env.example` and document the mapping here

## Current development workflow

For now, local work is primarily:

1. read the repo state docs
2. update or add code within the scaffolded workspace
3. keep task status current in `tasks/current.md`
4. validate changes with the commands that exist for the touched workspace

Because the app runtimes are not bootstrapped yet, there is no single `npm run dev` entry point today.

For the current Expo shell slice, you can optionally set `EXPO_PUBLIC_AIBABY_OWNER_USER_ID` and `EXPO_PUBLIC_AIBABY_CURRENT_BABY_ID` in `.env.local` to bootstrap owner-scoped current-profile loading without hard-coding route params.

If you want the Expo app to call a separately running local Next.js backend instead of relying on same-origin paths, also set `EXPO_PUBLIC_AIBABY_API_BASE_URL` (for example `http://192.168.1.10:3000`).

## Follow-up work expected after this doc

Subsequent implementation PRs should:

- add real root and workspace scripts
- wire Expo and Next.js bootstraps
- add Prisma and Supabase configuration files
- update this document with concrete run, lint, test, and migration commands
