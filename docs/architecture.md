# Architecture

## Status

This file is the active architecture record for the MVP. It defines the current recommended stack, system boundaries, core data model, and implementation phases for AI Baby Assistant.

This document should be updated whenever implementation decisions become concrete or when the system shape changes materially.

---

## Architecture goals

The MVP should optimize for:
- low-friction chat-first input
- fast iteration speed
- explainable AI output
- safe handling of sensitive family data
- a clean path from planning into implementation

The MVP must support:
1. baby profile management
2. chat-based meal logging with text and images
3. structured feeding records
4. daily and weekly nutrition summaries
5. age-stage reminders based on birth date

---

## Recommended stack

### Client
- React Native
- Expo
- TypeScript
- TanStack Query
- lightweight client state store such as Zustand

### Backend
- Next.js
- TypeScript
- App Router API handlers
- Zod for request validation

### Data and storage
- PostgreSQL
- Prisma ORM
- Supabase Auth
- Supabase Storage

### Media storage boundary
- caregiver uploads go to private Supabase Storage buckets
- the database stores metadata and storage paths, not binary media
- clients read media via signed URLs or backend-mediated access

See `docs/media-storage-decision.md` for the detailed storage model.

### Notifications and jobs
- Expo Push Notifications
- Trigger.dev, Vercel Cron, or Supabase scheduled jobs

### Observability
- Sentry
- structured backend logs
- product analytics added incrementally later

### Why this stack
- fast cross-platform delivery
- simple backend deployment model
- low operational complexity for MVP
- strong support for image upload, chat UX, and push notifications

### Auth boundary
- Supabase Auth is the identity provider for MVP
- mobile clients authenticate with Supabase and call backend APIs with bearer tokens
- backend APIs enforce product authorization using ownership and caregiver membership

See `docs/auth-decision.md` for the detailed auth model.

---

## High-level system shape

The MVP should use a single backend application, not microservices.

### Core components
- mobile client for parents and caregivers
- backend API for auth, records, AI orchestration, and reporting
- PostgreSQL for structured product data
- object storage for uploaded media
- AI orchestration layer inside the backend
- scheduled job runner for reports and reminders

### Guiding principle
Keep infrastructure simple at first. Split services only after the product proves repeated usage and traffic justifies the added complexity.

---

## Core functional flows

## 1. Meal input flow
A user submits:
- text only
- image only
- image plus text

Pipeline:
1. upload image if present
2. submit input payload to backend
3. create a message and attach uploaded media to that message
4. create an ingestion event linked to the source message
5. run the parsing pipeline
6. create a draft meal record if parsing succeeds, or preserve the raw message for retry if parsing fails
7. return either a confirmation response or a follow-up question

## 2. Record confirmation flow
AI output should be treated as a candidate record when confidence is limited.

Pipeline:
1. AI identifies likely food items and amounts
2. backend evaluates confidence and missing fields
3. if needed, ask follow-up questions
4. user confirms or edits
5. record becomes confirmed

## 3. Daily and weekly reporting flow
Reports should be generated from structured records, not raw chat alone.

Pipeline:
1. fetch meal records for the target period
2. apply nutrition rules
3. compute coverage and gaps
4. generate user-facing summary text
5. save the report
6. notify the user

## 4. Age-stage reminder flow
Pipeline:
1. compute age from birth date
2. map the child into a curated stage band
3. load stage guidance
4. optionally personalize with recent records
5. generate the reminder text
6. save and deliver the reminder

---

## AI design

The AI system should use a hybrid approach:
- rules for nutrition coverage and guardrails
- multimodal LLM for image-plus-text parsing
- LLM for parent-friendly summaries and reminder wording

### Provider boundary
- OpenAI is the accepted primary provider for MVP
- provider calls should be centralized in `packages/ai`
- the backend should depend on typed internal AI functions, not raw SDK calls

See `docs/ai-provider-decision.md` for the detailed provider strategy.

### Why hybrid instead of pure prompting
- easier to reason about behavior
- more reliable output structure
- better control of safety boundaries
- easier to debug when users dispute results

### Parsing output shape
The parsing layer should produce structured candidates such as:
- meal type
- food items
- amount text
- confidence scores
- follow-up questions
- requires confirmation flag

### Confidence policy
- high confidence + clear quantity: create a near-confirmed draft
- high confidence + unclear quantity: create a draft and ask quantity follow-up
- low confidence image recognition: ask the user to clarify before finalizing

### Nutrition rules engine
The rules layer should detect at least:
- protein presence
- fruit presence
- vegetable presence
- dark green vegetable presence
- carb presence
- fat-source presence
- iron-source presence
- milk intake completeness
- supplement completion

### Summary generation constraints
Summaries should state:
- what was eaten
- what appears covered
- what may be missing
- practical next-step suggestions
- explicit uncertainty when data is incomplete

The system should avoid medical diagnosis language.

---

## Data model

## users
- id
- email
- phone
- display_name
- created_at
- updated_at

## babies
- id
- owner_user_id
- name
- birth_date
- sex
- feeding_style
- allergies_json
- supplements_json
- timezone
- created_at
- updated_at

## baby_settings
This table should persist per-baby delivery preferences and scheduling state required by jobs and push notifications.
- id
- baby_id
- daily_summary_enabled
- daily_summary_time_local
- weekly_summary_enabled
- weekly_summary_day_of_week
- weekly_summary_time_local
- stage_reminders_enabled
- push_notifications_enabled
- created_at
- updated_at

Suggested constraints:
- unique on `baby_id`

## notification_devices
This table should persist per-user device registration for push delivery.
- id
- user_id
- platform
- expo_push_token
- app_build
- last_seen_at
- notifications_enabled
- created_at
- updated_at

Suggested constraints:
- unique on `expo_push_token`

## caregivers
Optional in MVP but useful for future multi-adult support.
- id
- baby_id
- user_id
- role
- created_at

## conversations
- id
- baby_id
- created_at
- updated_at

## messages
- id
- conversation_id
- sender_type
- text
- message_type
- ingestion_status
- metadata_json
- created_at

Suggested `message_type` values:
- user_text
- user_image
- user_mixed
- assistant_followup
- assistant_summary

Suggested `ingestion_status` values:
- pending
- parsed
- failed
- ignored

## meal_records
- id
- baby_id
- source_message_id
- meal_type
- eaten_at
- raw_text
- ai_summary
- status
- confidence_score
- created_at
- updated_at

Suggested `meal_type` values:
- breakfast
- lunch
- dinner
- snack
- milk
- supplement
- unknown

Suggested `status` values:
- draft
- confirmed
- edited

## meal_items
- id
- meal_record_id
- food_name
- amount_text
- amount_value
- amount_unit
- preparation_text
- nutrition_tags_json
- confidence_score
- created_at

## media_assets
- id
- baby_id
- message_id
- meal_record_id
- storage_path
- storage_bucket
- mime_type
- width
- height
- upload_status
- created_at

`meal_record_id` should remain nullable so media can be preserved even when parsing does not produce a record.

Suggested `upload_status` values:
- uploaded
- processing
- failed
- deleted

Suggested constraints:
- foreign key to `messages.id`
- nullable foreign key to `meal_records.id`

## daily_reports
- id
- baby_id
- report_date
- structured_summary_json
- rendered_summary
- suggestions_text
- completeness_score
- notification_status
- generated_by_job_key
- created_at

Suggested constraints:
- unique on `(baby_id, report_date)`

## weekly_reports
- id
- baby_id
- week_start_date
- structured_summary_json
- rendered_summary
- suggestions_text
- notification_status
- generated_by_job_key
- created_at

Suggested constraints:
- unique on `(baby_id, week_start_date)`

## age_stage_reminders
- id
- baby_id
- age_stage_key
- scheduled_for
- rendered_text
- metadata_json
- status
- notification_status
- generated_by_job_key
- created_at

Suggested constraints:
- unique on `(baby_id, age_stage_key, scheduled_for)`

## ingestion_events
Useful for debugging, retries, and operational visibility.
- id
- baby_id
- source_message_id
- source_type
- trigger_type
- payload_json
- processing_status
- idempotency_key
- error_text
- created_at
- updated_at

Suggested `trigger_type` values:
- user_message
- retry
- backfill

Suggested constraints:
- unique on `idempotency_key`

---

## API shape

## Baby profile
- `POST /api/babies`
- `GET /api/babies/:id`
- `PATCH /api/babies/:id`
- `GET /api/babies/:id/settings`
- `PATCH /api/babies/:id/settings`
- `POST /api/notification-devices`
- `PATCH /api/notification-devices/:id`

## Chat
- `POST /api/conversations`
- `GET /api/conversations/:id/messages`
- `POST /api/conversations/:id/messages`
- `POST /api/messages/:id/retry-ingestion`

## Uploads
- `POST /api/uploads/presign`
- `POST /api/uploads/complete`

## Meal records
- `GET /api/babies/:id/meals?date=YYYY-MM-DD`
- `POST /api/babies/:id/meals`
- `PATCH /api/meals/:mealId`
- `POST /api/meals/:mealId/confirm`
- `POST /api/meals/:mealId/items`
- `PATCH /api/meal-items/:itemId`

## Reports
- `GET /api/babies/:id/reports/daily?date=YYYY-MM-DD`
- `GET /api/babies/:id/reports/weekly?week_start=YYYY-MM-DD`
- `POST /api/babies/:id/reports/daily/generate`
- `POST /api/babies/:id/reports/weekly/generate`

## Reminders
- `GET /api/babies/:id/reminders`
- `POST /api/babies/:id/reminders/generate`

---

## Age-stage knowledge model

Age-stage reminders should not rely only on open-ended model recall.

Recommended design:
- maintain curated age-stage content
- version it in the repository first
- personalize lightly using recent feeding history

Each stage should contain:
- stage key
- age range
- feeding focus
- developmental focus
- safety reminders
- play suggestions
- common caregiver questions

This content can live in versioned JSON or markdown files at MVP stage.

---

## Jobs and scheduling

## Daily summary job
Default schedule:
- 7:00 PM in the baby's local timezone, later user-configurable

Contract reference:
- `docs/daily-summary-rules.md`

Steps:
1. find babies with `baby_settings.daily_summary_enabled = true`
2. load the day's meals, milk, and supplements
3. run rules
4. compute deterministic idempotency key `{baby_id}:{report_date}:daily`
5. upsert the report by `(baby_id, report_date)`
6. send notification only if `notification_status` is still pending
7. persist final delivery status

## Weekly summary job
Steps:
1. find babies with `baby_settings.weekly_summary_enabled = true`
2. gather the last 7 days of records
3. compute diversity and frequency metrics
4. compute deterministic idempotency key `{baby_id}:{week_start_date}:weekly`
5. upsert the report by `(baby_id, week_start_date)`
6. notify the user only once per persisted report

## Reminder job
Steps:
1. find babies with `baby_settings.stage_reminders_enabled = true`
2. compute each baby's current stage
3. determine whether a reminder is due
4. compute deterministic idempotency key `{baby_id}:{age_stage_key}:{scheduled_for}:reminder`
5. upsert the reminder by `(baby_id, age_stage_key, scheduled_for)`
6. notify the user only if this reminder has not already been delivered

---

## Security and privacy

This product handles sensitive child and family data.

Required controls:
- HTTPS everywhere
- secure auth tokens
- private media storage
- signed upload and download URLs
- ownership-based data access controls
- avoid unnecessary logging of sensitive payloads

AI privacy expectations:
- clearly disclose AI processing of uploaded content
- define media retention behavior
- do not use user data for model training without explicit approval

---

## Reliability requirements

Common failure cases:
- image upload failure
- AI parse timeout
- invalid AI output structure
- duplicate scheduled jobs
- notification delivery failure

Required safeguards:
- retries with backoff for transient failures
- schema validation for AI outputs
- idempotency for scheduled jobs
- preserve raw records even if parsing fails
- explicit fallback prompts when AI confidence is too low

Implementation note:
- raw user text should persist on `messages`
- raw images should persist on `media_assets` linked to `message_id`
- parsing retries should operate from `messages` and `ingestion_events`, not require a pre-existing `meal_record`

---

## Repo structure recommendation

A simple MVP-oriented layout:

```text
/apps/mobile
/apps/web
/packages/db
/packages/ai
/packages/ui
/docs
/content/age-stages
```

If implementation starts with a single app first, it can be simplified initially, but architecture and product documents should continue to live under `docs/`.

---

## Delivery phases

## Phase 1
- auth
- baby profile
- text logging
- image upload
- draft meal creation
- today timeline

## Phase 2
- multimodal parsing
- structured meal items
- follow-up confirmation loop

## Phase 3
- nutrition rules engine
- daily summary generation
- report history
- push delivery

## Phase 4
- weekly summary generation
- age-stage reminder system
- historical reminder display

## Phase 5
- analytics
- editing polish
- export and sharing improvements
- performance hardening

---

## Open questions

The following questions remain open:
- one baby only in MVP, or multi-baby from day one?
- mobile only in MVP, or web support as well?
- how much nutrition detail should be exposed in the UI?
- should caregiver collaboration be in v1 or later?
- which AI provider should be used first in production?
- should image parsing be synchronous or background-first?

---

## Current recommendation

The best current MVP direction is:
- React Native + Expo on the client
- Next.js + TypeScript on the backend
- PostgreSQL + Prisma for structured data
- Supabase Auth + Storage for managed auth and file handling
- hybrid AI pipeline using rules plus multimodal parsing and summary generation
- scheduled jobs for daily summaries, weekly summaries, and age-stage reminders

This is the working architecture baseline until implementation proves that different tradeoffs are needed.
