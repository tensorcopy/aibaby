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

This slice now also includes `app/baby-profile.tsx`, a first-pass Expo route that renders the screen shell with editable fields, choice chips, and save handling.

A future PR can wire this route into the full Expo app bootstrap and real authenticated transport/session context.

This slice also adds `src/features/baby-profile/submitRequest.ts`, which turns validated create/edit submissions into reviewable `POST /api/babies` and `PATCH /api/babies/:id` request descriptors for the eventual mobile data layer.

This slice now also includes `src/features/baby-profile/loadRequest.ts`, which builds the owner-scoped `GET /api/babies` and explicit `GET /api/babies/:id` request descriptors needed to bootstrap the create/edit flow over the shared API contract.

It now also includes `src/features/baby-profile/transport.ts`, which executes those load and submit request descriptors over `fetch`, applies the owner-scoped auth headers used by the shared API contract, and normalizes the profile response payload that comes back from the backend.

This slice now also adds a minimal Expo Router bootstrap with `app/_layout.tsx` and `app/index.tsx`, so the mobile app has a root stack and a home entry point that links into the baby profile route.

The home route now also reloads the active baby profile and surfaces a compact summary card with age, feeding style, and saved caregiver/allergy/supplement basics before the user re-enters the edit flow.

This slice now also wires the Expo shell through a lightweight `MobileSessionProvider`, so `.env.local` can bootstrap an owner-scoped current profile and keep the baby profile route pointed at the same session context.

A future PR can replace this bootstrap with real Supabase session plumbing and richer navigation once auth and additional screens land.

This slice now also includes `src/features/baby-profile/screenShell.ts`, which composes the create/edit form state, load requests, and submit transport into a reviewable mobile screen-state lifecycle with loading, empty-create, and save-result handling.
