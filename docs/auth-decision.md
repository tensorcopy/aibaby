# Auth Decision

## Status

Accepted as the MVP auth baseline.

This document defines the first-pass authentication and authorization model so mobile, backend, and data-access work can proceed against the same assumptions.

## Decision summary

Use **Supabase Auth** as the single identity provider for MVP.

For MVP:

- primary sign-in method: email magic link or one-time password
- optional follow-up method: Apple Sign In once the mobile app shell exists
- no anonymous mode for persisted baby data
- one Supabase user maps to one `users` row in the product database
- backend APIs trust validated Supabase access tokens
- authorization is ownership-based at the baby and caregiver level

## Why this approach

### 1. Lowest-friction caregiver onboarding

The product is mobile-first and should avoid password-heavy signup flows during stressful caregiving moments.

Email magic link or OTP gives:

- low setup friction
- no password reset complexity in MVP
- a clean upgrade path to social login later

### 2. Matches the current stack

The accepted stack already uses:

- Supabase Auth
- Supabase Storage
- PostgreSQL

Keeping identity on Supabase avoids introducing a second auth system before core product usage is validated.

### 3. Clear backend contract

The backend can treat Supabase as the identity layer and keep product permissions inside the application database.

That split is important:

- authentication answers who the user is
- product authorization answers what that user can access

## Identity model

### Auth source of truth

Supabase Auth is the source of truth for login identity.

The app database stores a corresponding product user record with:

- `id`
- `email`
- `phone`
- `display_name`

Recommended mapping:

- `users.id` should match the Supabase auth user id where practical
- if that is not done, store a required `auth_user_id` field in `users`

## MVP sign-in methods

### Required for MVP

- email OTP or magic link

### Optional after app shell exists

- Apple Sign In for iOS

### Not included in MVP

- username and password auth
- Google Sign In
- guest accounts with durable data
- multi-tenant organization auth

## Session model

### Mobile app

The Expo client should:

- sign in against Supabase Auth
- store the refresh session using the platform-appropriate secure session mechanism
- send the current access token to backend APIs

Do not treat the mobile app as a direct privileged data client for business logic. Core writes should still go through the backend application layer as the product expands.

### Backend

The Next.js backend should:

- validate the bearer token from the client
- resolve the authenticated user id
- load the corresponding product user and authorization context
- reject requests with no valid auth context

### Server-to-server operations

Background jobs should not impersonate a mobile session.

They should use:

- server-side credentials
- explicit job context
- product-level authorization checks based on stored ownership data

## Authorization model

Use application-layer authorization for MVP.

The first-pass rules are:

- a user can access babies they own
- a caregiver can access babies they are explicitly linked to in `caregivers`
- every read or write path must scope by authenticated user id plus baby ownership or caregiver membership
- push device registrations belong to authenticated users only

## Data model implications

The current `users` model is close, but implementation should make one of these explicit:

1. `users.id` equals the Supabase auth user id
2. add `users.auth_user_id` as a unique required field

For MVP, option 1 is simpler and should be preferred unless Prisma or migration constraints make option 2 cleaner.

## API implications

The backend should standardize on:

- `Authorization: Bearer <token>` from authenticated clients
- user resolution middleware at the API boundary
- no unauthenticated access to baby, meal, report, or reminder endpoints

Expected public or semi-public endpoints are limited to:

- auth callback handling
- health checks
- upload negotiation only when the caller is already authenticated

## Security boundaries

- never expose `SUPABASE_SERVICE_ROLE_KEY` to mobile code
- only `EXPO_PUBLIC_` auth configuration belongs in the client bundle
- treat access tokens as user credentials and avoid logging them
- avoid embedding product authorization rules in the client

## Alternatives considered

### Password-based auth first

Rejected because it adds more friction than value for MVP.

### Direct Supabase row-level-security-only authorization

Rejected for now because the product already assumes a backend orchestration layer for AI, reports, reminders, and structured writes. Authorization should remain legible in backend code instead of being split across app logic and early RLS policy work.

### Anonymous trial users

Rejected for MVP because baby photos, reminders, and long-term history are persistent family data and should start from a real account boundary.

## Follow-up implementation tasks now unlocked

- wire Supabase Auth into `apps/mobile`
- add backend token validation middleware in `apps/web`
- decide whether `users.id` or `users.auth_user_id` is the canonical identity key
- define caregiver invitation and access-sharing flow later

