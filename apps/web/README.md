# `apps/web`

First-pass local web runtime for the AIbaby backend surface.

This package now ships a runnable Node-based shell that mounts the existing App
Router-style route handlers directly. It is the current local-development
stand-in for the planned full Next.js app shell.

## Run locally

From the repo root:

```sh
npm run dev --workspace @aibaby/web
```

The server binds to `127.0.0.1:3000` by default.

Override with:

- `AIBABY_WEB_HOST`
- `AIBABY_WEB_PORT`

Available local pages:

- `GET /` simple landing page listing mounted routes
- `GET /health` health check payload

## Scope and current limitation

Included now:

- runnable local HTTP shell and `dev` / `start` scripts
- mounted API route handlers for baby profiles, meals, reports, reminders,
  uploads, text parse, and Markdown export
- local-dev JSON/blob persistence under `apps/web/.data/`

Not included yet:

- installed Next.js runtime and production build pipeline
- auth provider integration
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
- resolve owner scope from `Authorization: Bearer <local-session-token>` for the current mobile shell, while still accepting the older dev bearer/header fallback during transition
- persist baby profiles in `apps/web/.data/baby-profiles.json` (override with `AIBABY_DEV_DATA_FILE`)

The current upload slice now also includes:
- `POST /api/uploads/presign` and `POST /api/uploads/complete` for backend-controlled upload negotiation and completion
- `PUT /api/uploads/dev/:messageId/:assetId` as a local-development stand-in for direct object-storage handoff, persisting negotiated payloads under `apps/web/.data/upload-blobs/`

The current text parsing slice now also includes:
- `POST /api/messages/text-parse` for text-only meal-note parsing that also emits a draft structured meal record
- local-dev persistence for raw text messages, ingestion events, draft meal records, draft meal items, and confirmation events in `apps/web/.data/text-meal-submissions.json` (override with `AIBABY_TEXT_PARSE_DEV_DATA_FILE`)

The current meal-record slice now also includes:
- `POST /api/meals/:mealId/confirm` for confirming or correcting AI-generated meal drafts
- `GET /api/babies/:babyId/meals?date=YYYY-MM-DD` for loading one day's timeline-ready meal records and summary counts
- `GET /api/babies/:babyId/meals/review?days=7|30&endDate=YYYY-MM-DD` for loading windowed meal-review data, distinct-food stats, new food trials, and top-food counts

The current reports slice now also includes:
- `GET /api/babies/:babyId/reports/daily?limit=N` for first-pass daily summary history generated from saved meal records
- `GET /api/babies/:babyId/reports/weekly?limit=N` for first-pass weekly summary history generated from saved meal records

The current reminders slice now also includes:
- `GET /api/babies/:babyId/reminders?limit=N` for first-pass age-stage reminder history
- `POST /api/babies/:babyId/reminders/generate` for deterministic reminder generation keyed by the current age-stage cadence bucket
- local-dev reminder persistence in `apps/web/.data/age-stage-reminders.json` (override with `AIBABY_REMINDER_DEV_DATA_FILE`)

The current export slice now also includes:
- `POST /api/babies/:babyId/export/markdown` for first-pass bundle generation with Markdown diary notes, copied local media when available, and metadata indexes
- local-dev export bundles written under `apps/web/.data/exports/` (override with `AIBABY_EXPORT_ROOT`)
