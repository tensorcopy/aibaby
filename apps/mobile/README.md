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

A future PR can wire these helpers into actual Expo screens, persistence, and API calls.
