# Stack Decision

## Status

Accepted as the working MVP baseline.

This document captures the current stack decision so implementation agents can move without repeatedly re-deciding the same foundation choices.

Related decision docs:

- `docs/auth-decision.md`

## Decision summary

Use the following stack for the MVP:

- **Client:** React Native + Expo + TypeScript
- **State / data fetching:** TanStack Query + lightweight local state with Zustand
- **Backend:** Next.js + TypeScript
- **API validation:** Zod
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** Supabase Auth
- **Media storage:** Supabase Storage
- **Notifications:** Expo Push Notifications
- **Jobs / scheduling:** Trigger.dev, Vercel Cron, or Supabase scheduled jobs
- **Observability:** Sentry + structured logs

## Why this stack

### 1. Fast MVP iteration
- React Native + Expo gives fast cross-platform mobile delivery.
- Next.js is fast to scaffold and easy to deploy.
- TypeScript keeps data contracts aligned across client and server.

### 2. Good fit for product shape
The product needs:
- mobile-first caregiver usage
- chat-style input
- image upload
- structured records
- scheduled summaries and reminders

This stack supports those needs with relatively low operational complexity.

### 3. Low infrastructure burden
- PostgreSQL is the right source of truth for structured product data.
- Supabase reduces auth and storage setup work.
- A single backend app is enough for MVP; no need for microservices yet.

## Architecture shape

Use a **single-backend MVP architecture**:
- one mobile client
- one backend application
- one primary relational database
- one managed media storage layer
- one scheduled-jobs mechanism

Do not split into multiple services until product usage proves it is necessary.

## Alternatives considered

### Pure web app first
Rejected for now because the product is likely to be used most often in fast, phone-based caregiving moments.

### Backend as separate Node service from day one
Rejected for MVP because it adds complexity before the product loop is validated.

### Markdown-first storage
Rejected for core product storage because the app needs structured queries, sync, permissions, and reliable aggregation.
Markdown remains a strong export format, not the canonical database.

## Consequences

### Positive
- faster time to first usable prototype
- easier onboarding for implementation agents
- strong path for image upload and notification workflows
- structured data model stays compatible with analytics and exports later

### Tradeoffs
- Next.js backend may need to be split later if AI orchestration grows heavier
- Expo push and mobile workflows add some device testing overhead
- Supabase convenience means some platform coupling early on

## Follow-up decisions now unlocked

With this baseline accepted, agents can proceed on:
- first-pass data model
- app scaffold
- auth wiring
- media upload pipeline
- timeline and report APIs

## Repo implications

Recommended structure:

```text
/apps/mobile
/apps/web
/packages/db
/packages/ai
/packages/ui
/docs
/content/age-stages
```

The exact scaffold can still be adjusted, but implementation should stay consistent with this stack direction.
