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
- App Router `POST /api/babies`, `GET /api/babies/:babyId`, and `PATCH /api/babies/:babyId` handlers that reuse the shared action layer

The new route files currently depend on injected auth/persistence adapters from `src/features/baby-profile/route-dependencies.js`, which keeps the handlers reviewable until the larger Next.js and database scaffold lands.

The current reusable client/form layer now also includes:
- `src/features/baby-profile/client.js` for owner-scoped collection/item POST/GET/PATCH requests, including a current-profile lookup on `GET /api/babies`
- `src/features/baby-profile/form-flow.js` for bootstrapping create vs edit mode, loading normalized form defaults, deriving the baby age summary, and PATCHing only changed editable fields

Current local-dev default bindings now:
- fetch a single owner-scoped baby profile by id for the local App Router read path
- resolve owner scope from `Authorization: Bearer dev-user:<userId>` or `x-aibaby-owner-user-id`
- persist baby profiles in `apps/web/.data/baby-profiles.json` (override with `AIBABY_DEV_DATA_FILE`)

The current upload slice now also includes:
- `POST /api/uploads/presign` and `POST /api/uploads/complete` for backend-controlled upload negotiation and completion
- `PUT /api/uploads/dev/:messageId/:assetId` as a local-development stand-in for direct object-storage handoff, persisting negotiated payloads under `apps/web/.data/upload-blobs/`

The current text parsing slice now also includes:
- `POST /api/messages/text-parse` for text-only meal-note parsing into a candidate structured record preview
- local-dev persistence for raw text messages plus ingestion events in `apps/web/.data/text-meal-submissions.json` (override with `AIBABY_TEXT_PARSE_DEV_DATA_FILE`)

The current draft record slice now also includes:
- `POST /api/meal-records/drafts` for materializing a persisted draft meal record from a previously parsed text message
- local-dev persistence for draft meal records, meal items, and generation events in `apps/web/.data/meal-drafts.json` (override with `AIBABY_MEAL_DRAFT_DEV_DATA_FILE`)
