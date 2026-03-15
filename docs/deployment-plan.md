# Deployment Plan

## Status

This is the first hosted deployment plan for moving the current local MVP shell
toward real phone testing and a staged environment.

## Recommended first hosted shape

- **Mobile app:** Expo / EAS preview builds
- **Web / API runtime:** Vercel
- **Auth:** Supabase Auth
- **Database:** Supabase Postgres
- **Media storage:** Supabase Storage
- **Scheduled work:** start with Vercel Cron or Supabase scheduled jobs

This keeps the deployed shape aligned with the accepted stack decisions already
recorded in `docs/stack-decision.md` and `docs/auth-decision.md`.

## Why this path

- Expo preview builds are the fastest route to real phone-only testing.
- Vercel is the lowest-friction first host for the current web/API shell.
- Supabase already matches the accepted auth, database, and storage direction.
- This avoids a second round of architecture churn before real user testing.

## Deployment environments

Use three environments:

1. **Local**
   - laptop-run Expo and web shell
   - local JSON persistence for the current MVP shell

2. **Staging**
   - hosted web/API runtime
   - real Supabase auth, Postgres, and storage
   - Expo preview builds pointed at staging

3. **Production**
   - separate Supabase project or isolated production resources
   - production web/API deployment
   - store-reviewed mobile builds

Do not share the same Supabase project across staging and production.

## Environment variable mapping

### Shared backend/server env

- `DATABASE_URL`
- `DIRECT_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AI_PROVIDER`
- `OPENAI_API_KEY`
- `OPENAI_MODEL_PARSING`
- `OPENAI_MODEL_SUMMARY`
- `OPENAI_MODEL_REMINDERS`
- `SENTRY_DSN`
- `TRIGGER_SECRET_KEY`

### Mobile public env

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_AIBABY_API_BASE_URL`

### Local-only mobile bootstrap env

- `EXPO_PUBLIC_AIBABY_SESSION_TOKEN`
- `EXPO_PUBLIC_AIBABY_CURRENT_BABY_ID`

These local-only bootstrap values should not be used in staging or production.
Real auth should replace them there.

## First deployment milestone

The first meaningful hosted milestone is:

1. replace the local bearer session token with real Supabase auth
2. replace local JSON persistence with the real database layer
3. replace local upload blobs with real storage upload negotiation
4. deploy the web/API runtime to staging
5. create an Expo preview build pointed at staging

That milestone is the first point where phone-only QA becomes practical.

## Rollout order

1. `AIB-080` real auth bootstrap
2. `AIB-085` real env bootstrap and config
3. `AIB-081` database schema and repositories
4. `AIB-082` and `AIB-083` persistence replacement
5. `AIB-084` real upload/storage flow
6. `AIB-086` migrations and real seed/reset commands
7. `AIB-087` authenticated end-to-end staging smoke pass

## Non-goals for the first hosted pass

- multi-region deployment
- advanced CDN/media optimization
- background worker separation
- production analytics rollout
- full infra-as-code coverage

Those can wait until the hosted staging flow is real and repeatable.
