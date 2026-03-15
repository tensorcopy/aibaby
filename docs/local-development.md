# Local Development

## Status

This guide defines the current local-development baseline for the repository.

The repository now supports a first-pass local run loop:
- `apps/web` runs a local Next.js dev server that exposes the current API routes
- `apps/mobile` runs the Expo shell for the current mobile slices

Prisma, Supabase, and production auth are still not wired in. Local development currently uses the owner-scoped dev bootstrap and file-backed web persistence.

## Prerequisites

Install the following before working in the repo:

- Node.js 20.x
- npm 10.x or newer
- Git

Recommended for local app testing:

- Expo Go or an iOS / Android simulator
- Supabase CLI later, when auth and storage move beyond local-dev stubs
- a PostgreSQL instance later, when Prisma-backed persistence lands

## First-time setup

From the repository root:

```bash
npm install
```

This installs the workspace dependencies used by the current Expo and Next.js local-development flows.

## Workspace layout

- `apps/mobile`: Expo / React Native caregiver app shell
- `apps/web`: Next.js local backend surface and status page
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

For the current local run loop, the most important variables are:

- `EXPO_PUBLIC_AIBABY_OWNER_USER_ID`
- `EXPO_PUBLIC_AIBABY_CURRENT_BABY_ID`
- `EXPO_PUBLIC_AIBABY_API_BASE_URL`

## Working rules for local env files

- prefer `.env.local` for developer-specific values
- do not duplicate the same value in multiple env files unless a framework requires it
- server-only keys must never be referenced from mobile code
- if a value becomes framework-specific, keep the canonical name in `.env.example` and document the mapping here

## Current development workflow

Current local run workflow:

1. run `npm install`
2. copy `.env.example` to `.env.local`
3. set `EXPO_PUBLIC_AIBABY_OWNER_USER_ID` in `.env.local`
4. optionally set `EXPO_PUBLIC_AIBABY_CURRENT_BABY_ID` if you already want the home route pointed at one saved profile
5. set `EXPO_PUBLIC_AIBABY_API_BASE_URL` to your local backend URL, such as `http://192.168.1.10:3000`
6. start the backend with `npm run dev:web`
7. start Expo with `npm run dev:mobile`

Notes:
- use your LAN IP instead of `localhost` if Expo is running on a physical device
- `apps/web` persists local-dev data under `apps/web/.data/`
- the mobile shell can still render without a backend, but create/edit and meal logging flows need the API to complete successfully
- open `http://localhost:3000` to use the web manual-test shell for profile creation, text meal submission, draft generation, and today's timeline inspection

## Follow-up work expected after this doc

Subsequent implementation PRs should:

- replace the owner-scoped local bootstrap with real Supabase auth
- replace file-backed local persistence with Prisma-backed storage
- add lint and build scripts once the runtime scaffolds stabilize
- add concrete migration commands when the database layer is live
