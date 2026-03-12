# `apps/web`

Placeholder for the Next.js application and MVP backend surface.

Planned responsibilities:

- authenticated web shell if needed
- App Router API handlers
- media upload endpoints
- AI orchestration entry points
- job and notification integration points

Not included yet:

- Next.js bootstrap
- route handlers
- auth integration
- deployment configuration

## Baby profile scaffolding slice

The first AIB-020 backend slice lives in `src/features/baby-profile/api-contract.js`.

This adds:
- request-body parsing helpers for `POST /api/babies` and `PATCH /api/babies/:id`
- adapters from validated API payloads into the shared DB insert/update shapes
- a response serializer that maps stored baby-profile rows back into API JSON
- action helpers that wrap normalized create/update payloads around async persistence callbacks
- App Router `POST /api/babies` and `PATCH /api/babies/:babyId` handlers that reuse the shared action layer

The new route files currently depend on injected auth/persistence adapters from `src/features/baby-profile/route-dependencies.js`, which keeps the handlers reviewable until the larger Next.js and database scaffold lands.

Current local-dev default bindings now:
- resolve owner scope from `Authorization: Bearer dev-user:<userId>` or `x-aibaby-owner-user-id`
- persist baby profiles in `apps/web/.data/baby-profiles.json` (override with `AIBABY_DEV_DATA_FILE`)
