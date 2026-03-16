# Local Development

## Status

This guide defines the current local-development baseline for the repository.

The repository now has first-pass runnable mobile and web shells for local
development. Prisma-backed persistence is still not implemented yet, and the
repo still uses local JSON/blob stores for product data. The mobile/web auth
boundary now supports a first-pass Supabase bearer flow, while keeping the
older local session-token bootstrap available for local-only development when
Supabase is not configured.

## Prerequisites

Install the following before working in the repo:

- Node.js 20.x
- npm 10.x or newer
- Git
- an iOS simulator, Android emulator, or Expo Go device for mobile runtime checks

Optional for later work:

- Supabase CLI
- a PostgreSQL instance for local database work

## First-time setup

From the repository root:

```bash
npm install
```

This installs the current workspace dependencies, including the Expo and local
web runtime packages used by the first-pass app shells.

## Workspace layout

- `apps/mobile`: first-pass Expo / React Native app shell
- `apps/web`: first-pass local web runtime and API surface
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

- `AIBABY_ENV`
- `AIBABY_WEB_URL`
- `DATABASE_URL`
- `DIRECT_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET_MEAL_MEDIA`
- `SUPABASE_STORAGE_BUCKET_DERIVED_MEDIA`
- `EXPO_PUBLIC_AIBABY_ENV`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_AIBABY_API_BASE_URL`
- `EXPO_PUBLIC_AIBABY_SESSION_TOKEN`
- `EXPO_PUBLIC_AIBABY_CURRENT_BABY_ID`
- `EXPO_PUBLIC_AIBABY_ENABLE_LOCAL_BOOTSTRAP`
- `AI_PROVIDER`
- `OPENAI_API_KEY`
- `OPENAI_MODEL_PARSING`
- `OPENAI_MODEL_SUMMARY`
- `OPENAI_MODEL_REMINDERS`
- `SENTRY_DSN`
- `TRIGGER_SECRET_KEY`

Not every variable is used yet. The goal is to standardize names before implementation expands.
The mobile and web shells now both read from centralized env helpers so this
contract is the single source of truth for future Supabase/bootstrap work.

App-specific example files now exist at:

- `apps/web/.env.example`
- `apps/mobile/.env.example`

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

Current local run commands:

- `npm run dev:web`
- `npm run dev:mobile`
- `npm run demo:seed`
- `npm run demo:reset`
- `npm test --workspace @aibaby/web`
- `npm test --workspace @aibaby/mobile`

For the current Expo shell slice, set these values in `apps/mobile/.env.local`:

- `EXPO_PUBLIC_AIBABY_ENV`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_AIBABY_API_BASE_URL`
- `EXPO_PUBLIC_AIBABY_SESSION_TOKEN`
- `EXPO_PUBLIC_AIBABY_CURRENT_BABY_ID`
- `EXPO_PUBLIC_AIBABY_ENABLE_LOCAL_BOOTSTRAP`

Use `EXPO_PUBLIC_AIBABY_ENV=development` for simulator/local runs, `staging` for
preview builds against a hosted stack, and `production` only for store-ready
runtime config. The Expo app config now changes the app name, slug, deep-link
scheme, and native package ids by that environment so dev/staging builds stay
installable next to production.

If you want Expo to hydrate a persisted Supabase session, the mobile workspace
now includes the required packages:

- `@supabase/supabase-js`
- `expo-secure-store`
- `react-native-url-polyfill`

If you are staying on the local-only bootstrap flow, use
`npm run demo:session -- demo-owner-1` to generate a local session token, or
copy the `sessionToken` value returned by `npm run demo:seed`.

Leave `EXPO_PUBLIC_AIBABY_ENABLE_LOCAL_BOOTSTRAP=true` only in local
development. Staging and production should set it to `false` so a stale local
token cannot override real Supabase auth.

If the mobile app is running on a physical device, `EXPO_PUBLIC_AIBABY_API_BASE_URL`
must point at your computer's LAN IP instead of `127.0.0.1`.

For the full first-pass local walkthrough, follow `docs/local-e2e-flow.md`.

For regression checks after local changes, follow `docs/smoke-checklist.md`.

For the next hosted path beyond local development, follow `docs/deployment-plan.md`.

## Follow-up work expected after this doc

Subsequent implementation PRs should:

- add Prisma and Supabase configuration files
- update this document with concrete run, lint, test, and migration commands
