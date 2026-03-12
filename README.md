# AI Baby

Minimal monorepo scaffold for the AI Baby MVP.

This repository follows the accepted stack and boundaries documented in:

- `docs/prd.md`
- `docs/architecture.md`
- `docs/stack-decision.md`
- `docs/data-model.md`

## Repository layout

- `apps/mobile`: future Expo / React Native client for caregivers
- `apps/web`: future Next.js app and API surface
- `packages/db`: future Prisma schema, migrations, and database access code
- `packages/ai`: future AI parsing, orchestration, and summary logic
- `packages/ui`: future shared UI primitives and design tokens
- `content/age-stages`: future curated reminder and milestone content

## Status

This is scaffold-only. No application runtime, database schema, or AI pipeline has been implemented yet.
