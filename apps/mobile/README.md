# `apps/mobile`

First-pass Expo caregiver app shell for AIbaby.

This package now has a runnable Expo Router bootstrap around the implemented
mobile routes, plus centralized public-config wiring so the app can target the
current local backend now and a hosted Supabase-backed stack later.

## Run locally

From the repo root:

```sh
cp apps/mobile/.env.example apps/mobile/.env.local
npm run dev --workspace @aibaby/mobile
```

Useful scripts:

- `npm run start --workspace @aibaby/mobile`
- `npm run android --workspace @aibaby/mobile`
- `npm run ios --workspace @aibaby/mobile`

Session/bootstrap env:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_AIBABY_API_BASE_URL`
- `EXPO_PUBLIC_AIBABY_SESSION_TOKEN`
- `EXPO_PUBLIC_AIBABY_CURRENT_BABY_ID`

Use `npm run demo:session -- demo-owner-1` to print a local session token for
`EXPO_PUBLIC_AIBABY_SESSION_TOKEN`.

The first-pass app shell currently includes:

- Expo Router root stack in `app/_layout.tsx`
- home, baby profile, meal logging, timeline, summaries, review, and reminders routes
- lightweight mobile session bootstrap through `MobileSessionProvider`

Not included yet:

- real auth/session handoff
- production asset set and native app metadata
- release build configuration

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

It now also exposes stable home quick actions for meal logging, today's timeline, and summary history, with baby-scoped route handoff so the next mobile slices can land on predictable destinations.

This slice now also wires the Expo shell through a lightweight `MobileSessionProvider`, so `.env.local` can bootstrap the local session token flow and keep the baby profile route pointed at the same session context.

A future PR can replace this bootstrap with real Supabase session plumbing and richer navigation once auth and additional screens land.

This slice now also includes `src/features/baby-profile/screenShell.ts`, which composes the create/edit form state, load requests, and submit transport into a reviewable mobile screen-state lifecycle with loading, empty-create, and save-result handling.

## Image upload handoff slice

AIB-022 now also adds the first reviewable mobile-to-storage upload handoff:

- `src/features/chat-input/upload.ts` negotiates upload targets with `POST /api/uploads/presign`, streams each selected image to the returned `PUT` target, and finalizes the handoff with `POST /api/uploads/complete`
- `app/log-meal.tsx` now upgrades photo submissions from local-only placeholders into real upload attempts and surfaces per-submission upload status in the draft thread
- `MobileSessionProvider` now accepts `EXPO_PUBLIC_AIBABY_API_BASE_URL`, so Expo can target a separately running local backend during development

## Text-to-draft slice

AIB-024 now also extends the text submission flow:

- `src/features/chat-input/text-submit.ts` expects the backend to return both the parsed candidate and a generated draft meal record
- `app/log-meal.tsx` surfaces that draft record creation in the local meal thread so the next confirmation/correction slice has a stable handoff

## Confirmation and timeline slices

AIB-025 through AIB-027 now also add:

- `src/features/chat-input/meal-record-confirmation.ts` and `meal-record-confirm.ts` for editing and confirming AI-generated meal drafts against the shared API
- `app/log-meal.tsx` inline correction controls for meal type and items, plus confirm/save handoff into `POST /api/meals/:mealId/confirm`
- `src/features/today-timeline/transport.ts` and `app/today.tsx` for loading and rendering today's meal timeline from `GET /api/babies/:babyId/meals?date=YYYY-MM-DD`

## Summary history slice

AIB-035 now also adds:

- `src/features/summaries/history.ts` for loading first-pass daily and weekly summary history from the shared API
- `app/summaries.tsx` for rendering saved daily and weekly summary cards in one review screen

## Review and reminder history slices

AIB-043 through AIB-045 now also add:

- `src/features/review-window/transport.ts` for loading 7-day and 30-day review windows from meal, summary, and reminder endpoints
- `src/features/reminders/history.ts` for loading saved reminder history from the shared API
- `app/review.tsx` for rendering 7-day and 30-day review pages, including links into day-level detail
- `app/reminders.tsx` for rendering the saved reminder timeline
- `app/today.tsx` date-query support so review pages can open any saved day, not only the current one

## Export trigger slice

AIB-064 now also adds:

- `src/features/exports/transport.ts` for triggering `POST /api/babies/:babyId/export/markdown`
- `app/summaries.tsx` inline export creation so the mobile app can request a Markdown bundle and surface the saved backend path
