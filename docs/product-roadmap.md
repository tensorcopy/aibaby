# Product Roadmap

## Status

This roadmap organizes AIbaby into three independently owned product areas so
multiple agents or teams can move in parallel without waiting on one shared
queue.

## How to use this roadmap

A new agent should:

1. read this file
2. pick one team area
3. choose a `Ready now` item in that area
4. confirm the API or repository boundary for that item
5. update `tasks/current.md` when the work becomes active or complete

## Product direction

AIbaby is moving through three broad phases:

1. **Trustworthy core loop**
   - fast meal logging
   - reliable records
   - useful daily and weekly feedback
   - phone-ready staging and production basics

2. **Proactive household assistant**
   - reminders, review, and recommendation loops
   - growth tracking
   - better parent guidance and follow-up

3. **Family operating system**
   - planning, prep, shopping, export, and long-term family history
   - richer caregiver collaboration
   - durable data portability and retention

## Team 1: Caregiver Experience

### Mission

Own the parent-facing mobile and review experience from first open to daily use.

### Owns

- Expo app shell and navigation
- baby profile and household setup flows
- meal logging UX and correction UX
- today, review, reminders, and summaries screens
- notification and in-app action surfaces

### Interfaces

- consumes backend API contracts from Team 3
- consumes parsing, summary, and recommendation payloads from Team 2
- should not own persistence or AI-provider wiring directly

### Roadmap

#### Now

- make the app feel production-ready on device
- tighten empty states, retries, loading, and confirmation flows
- make export, reminders, and review easier to discover

#### Next

- add baby growth tracking: weight, height, and charts
- add notification inbox and reminder interaction states
- add richer meal edit flows for mixed meals, milk, and supplements

#### Later

- daily meal suggestions and recipe views
- prep-day and grocery planning surfaces
- caregiver collaboration and household role UX

### Ready now

- add a dedicated growth route with weight/height entry history and chart cards
- add home-screen entry points for review, reminders, exports, and future growth
- add a reminder detail screen with done / snooze / dismiss states
- improve meal-thread correction UX for multi-item edits and repeated confirms
- add export history and bundle status surfaces in mobile
- add a first-pass notification center screen model and route shell

### Starter files

- `apps/mobile/app`
- `apps/mobile/src/features/app-shell`
- `apps/mobile/src/features/chat-input`
- `apps/mobile/src/features/today-timeline`
- `apps/mobile/src/features/summaries`
- `apps/mobile/src/features/reminders`
- `apps/mobile/src/features/review-window`

## Team 2: Intelligence and Guidance

### Mission

Own the product logic that turns records into useful parent guidance.

### Owns

- parsing logic and correction handoff rules
- nutrition rules and summary generation
- age-stage logic and reminder generation
- recommendation quality, explainability, and confidence behavior
- future meal suggestions, recipes, and prep planning intelligence

### Interfaces

- emits typed record, summary, reminder, and recommendation payloads
- depends on canonical data access from Team 3
- should not own UI navigation or storage transport details

### Roadmap

#### Now

- improve reliability and explainability of today/weekly summaries
- harden confidence rules and follow-up question behavior
- formalize recommendation payloads before new UI lands

#### Next

- build daily meal recommendations and simple baby-safe recipes
- build grocery and prep planning logic for working parents
- connect guidance to age stage, allergies, recent intake, and gaps

#### Later

- combine feeding history plus growth trends into more personalized guidance
- learn from rejected foods, repeated corrections, and family preferences
- support richer household planning such as freezer inventory and prep cadence

### Ready now

- define a typed recommendation contract for daily meal suggestions
- add deterministic meal-gap detection for protein, iron, veg variety, and repeats
- add recipe-template content and rendering rules for one-day suggestion sets
- add a prep-plan generator that converts a 3 to 5 day menu into grocery and prep tasks
- add correction analytics so repeated parent edits can be summarized by category
- add growth-aware guidance placeholders that consume weight/height entries later

### Starter files

- `packages/ai`
- `packages/db/src/meal-record.js`
- `packages/db/src/daily-summary.js`
- `packages/db/src/weekly-summary.js`
- `packages/db/src/age-stage-reminder.js`
- `content/age-stages`

## Team 3: Platform and Trust

### Mission

Own the systems that make the product real, secure, deployable, and durable.

### Owns

- auth, sessions, and caregiver authorization
- database schema, repositories, and migrations
- media upload/storage and export jobs
- backend runtime, deployment, staging, and observability
- delivery plumbing for scheduled jobs and notifications

### Interfaces

- publishes stable repositories and API contracts used by Teams 1 and 2
- should avoid product-UI decisions unless they affect system boundaries
- owns rollout safety, secrets handling, and production readiness

### Roadmap

#### Now

- replace local-dev persistence and session bootstrap with real Supabase-backed systems
- create a phone-testable staging environment
- harden health checks, seed flows, and smoke passes

#### Next

- add push registration and delivery plumbing
- add background job scheduling for reports and reminders
- add production-grade error tracking, auditability, and backups

#### Later

- caregiver sharing and multi-user access controls
- import flows and richer export job history
- data retention controls and account deletion tooling

### Ready now

- land `AIB-080` real Supabase auth bootstrap in Expo and token validation in web
- land `AIB-081` through `AIB-083` to replace local JSON stores with repositories
- land `AIB-084` real upload negotiation and persisted asset metadata
- land `AIB-085` and `AIB-086` for environment bootstrap, migrations, and reset flows
- land `AIB-087` authenticated end-to-end staging smoke pass
- add structured runtime readiness checks for database, storage, jobs, and auth

### Starter files

- `apps/web/app/api`
- `apps/web/src/features`
- `apps/web/src/runtime`
- `packages/db`
- `scripts`
- `docs/deployment-plan.md`
- `docs/local-development.md`

## Cross-team contracts

These contracts should stay stable enough that teams can work independently:

- **Record schema contract:** `packages/db` owns canonical shapes for babies,
  meals, reminders, reports, and future growth entries
- **Backend API contract:** `apps/web/src/features/*/api-contract.*` owns route
  payload shapes
- **Mobile transport contract:** mobile features should consume typed transport
  helpers instead of building raw fetch requests inline
- **AI output contract:** Team 2 owns typed structured outputs, not UI copy
  scattered in screens
- **Env and deployment contract:** Team 3 owns secrets, runtime config, and
  hosted environment behavior

## Recommended staffing split

- **Team 1: Caregiver Experience**
  - 2 product-oriented engineers
  - 1 design-minded frontend agent

- **Team 2: Intelligence and Guidance**
  - 1 to 2 applied-AI / backend agents
  - 1 content / rules agent for nutrition and reminder quality

- **Team 3: Platform and Trust**
  - 2 backend / platform engineers
  - 1 release / QA-focused agent

## What success looks like

The roadmap is working if:

- each team can ship every week without waiting on shared refactors
- new agents can enter one area by reading one doc and one folder group
- UI work, guidance work, and platform work all keep moving even when one lane
  is blocked
- the current local MVP turns into a phone-testable staged product without
  freezing feature progress
