# `apps/mobile`

Placeholder for the Expo / React Native caregiver app.

Planned responsibilities:

- baby profile flows
- chat-first meal logging UI
- timeline, summary, and reminder screens
- device registration for push notifications

Not included yet:

- Expo app bootstrap
- auth wiring
- upload flows
- production UI components

## Baby profile flow slice

The first implementation slice for AIB-020 lives in `src/features/baby-profile/createEditFlow.ts`.

This adds:
- shared create/edit form defaults and validation rules via `@aibaby/ui`
- mobile form-state helpers for create/edit mode
- payload normalization for allergies, supplements, and nullable sex
- derived age-summary helpers so the form can preview the baby's current age while editing
- edit-mode patch helpers so save actions can submit only changed profile fields

A future PR can wire these helpers into actual Expo screens and transport layers.

This slice also adds `src/features/baby-profile/submitRequest.ts`, which turns validated create/edit submissions into reviewable `POST /api/babies` and `PATCH /api/babies/:id` request descriptors for the eventual mobile data layer.

This slice now also includes `src/features/baby-profile/loadRequest.ts`, which builds the owner-scoped `GET /api/babies` and explicit `GET /api/babies/:id` request descriptors needed to bootstrap the create/edit flow over the shared API contract.
