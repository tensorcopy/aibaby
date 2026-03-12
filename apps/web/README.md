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

A future PR can wrap these helpers in real App Router handlers once the Next.js app scaffold lands.
