# AI Baby Assistant — Technical Design v1

## 1. Document Info
- Product: AI Baby Assistant
- Document: Technical Design v1
- Date: 2026-03-10
- Scope: MVP architecture and implementation plan
- Purpose: define the technical approach for building the first usable version of the product

---

## 2. Goals

The MVP should support five core capabilities:
1. Create and manage a baby profile
2. Accept chat-based meal input via text and images
3. Convert raw input into structured feeding records
4. Generate daily and weekly nutrition summaries
5. Deliver age-stage reminders based on the baby's birth date

The system should optimize for:
- low-friction input
- fast iteration speed
- explainable AI output
- safe handling of sensitive family data
- clear upgrade path beyond MVP

---

## 3. High-Level Architecture

The recommended MVP architecture is:

- **Mobile App**: React Native + Expo
- **Backend API**: Next.js (App Router) + TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: Supabase Auth
- **File Storage**: Supabase Storage
- **AI Layer**: multimodal LLM for image/text parsing + LLM for summaries
- **Jobs / Scheduling**: Trigger.dev, Vercel Cron, or Supabase scheduled functions
- **Push Notifications**: Expo Push Notifications

### Architectural principle
Use a **single backend application** for MVP, not microservices.

Reason:
- faster to ship
- easier debugging
- lower operational complexity
- enough for early-stage load

The system can later split into dedicated services for:
- AI processing
- reporting jobs
- analytics
- notification delivery

---

## 4. System Components

### 4.1 Client App
The mobile app is the primary user interface.

Key surfaces:
- chat screen
- today timeline
- 7-day history
- 30-day history
- baby profile screen
- settings / reminder preferences

Client responsibilities:
- authentication
- image capture / upload
- text input
- rendering assistant replies
- rendering timeline/history pages
- displaying reports and reminders
- receiving push notifications

### 4.2 API Server
The backend API coordinates all product logic.

Responsibilities:
- user and baby profile CRUD
- meal record creation and updates
- media upload coordination
- AI request orchestration
- summary generation
- scheduled reminder/report jobs
- permission checks

### 4.3 Database
PostgreSQL stores all structured application data.

Responsibilities:
- user accounts
- child profiles
- meal records
- food items
- reports
- reminders
- message and event history

### 4.4 Object Storage
Supabase Storage stores uploaded images.

Responsibilities:
- raw meal photos
- optional generated thumbnails
- future exported reports/assets

### 4.5 AI Processing Layer
The AI layer is not a separate product service at MVP stage.
It is an orchestration layer inside the backend.

Responsibilities:
- parse image + text input
- produce candidate food items
- detect ambiguity and generate follow-up questions
- generate parent-friendly summaries
- generate age-stage reminders

### 4.6 Job Runner
A scheduled job system is needed for:
- daily nutrition summaries
- weekly summaries
- age-stage reminders
- retrying failed AI/report jobs

---

## 5. Recommended Stack

## Mobile
- React Native
- Expo
- TypeScript
- React Query or TanStack Query
- Zustand or lightweight app state store

Why:
- fast cross-platform development
- mature camera/upload support
- strong chat UI ecosystem
- easy push notification integration

## Backend
- Next.js
- TypeScript
- Prisma
- Zod for request validation

Why:
- fast full-stack iteration
- easy deployment
- good developer experience
- simple co-location of API and server logic

## Database
- PostgreSQL
- Prisma schema migrations

## Auth
- Supabase Auth

## Storage
- Supabase Storage

## Notifications
- Expo Push Notifications

## Analytics
- PostHog or simple product analytics later

## Observability
- Sentry
- structured logs

---

## 6. Functional Architecture

### 6.1 Input Flow
A user submits one of the following:
- text only
- image only
- text + image

The system pipeline:
1. client uploads image if present
2. client sends message payload to backend
3. backend creates an ingestion event
4. backend invokes parsing pipeline
5. parser returns structured candidate meal record
6. backend stores draft record
7. assistant responds with confirmation or follow-up question

### 6.2 Record Confirmation Flow
Many meal inputs will be incomplete.
The product should treat AI output as a draft when confidence is limited.

Flow:
1. AI identifies food items and estimated amounts
2. backend evaluates confidence thresholds
3. if confidence is low or quantity is unclear, ask a follow-up question
4. user confirms or edits
5. system marks record as confirmed

### 6.3 Reporting Flow
Daily and weekly reports should be generated from structured records, not directly from raw chat.

Flow:
1. fetch confirmed records for the target period
2. apply nutrition rules
3. compute coverage and weak spots
4. call LLM for parent-friendly wording
5. save report
6. send push notification / render in chat

### 6.4 Age-Stage Reminder Flow
1. compute baby age in days / months
2. map age to a curated stage band
3. fetch reminder template / knowledge block
4. optionally personalize with recent nutrition history
5. generate reminder text
6. save and deliver reminder

---

## 7. Core Data Model

Below is the suggested MVP schema.

## 7.1 users
- id
- email
- phone
- display_name
- created_at
- updated_at

## 7.2 babies
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

## 7.3 caregivers
Optional in MVP, but helpful if multiple adults interact.
- id
- baby_id
- user_id
- role
- created_at

## 7.4 conversations
Tracks chat threads inside the app.
- id
- baby_id
- created_at
- updated_at

## 7.5 messages
Stores raw user/assistant messages for the in-app chatbot.
- id
- conversation_id
- sender_type
- text
- metadata_json
- created_at

## 7.6 meal_records
Represents one feeding event.
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

## 7.7 meal_items
Individual food items within a meal.
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

Examples of `nutrition_tags_json`:
- protein
- iron_source
- fruit
- vegetable
- dairy
- carb
- fat_source

## 7.8 media_assets
- id
- baby_id
- meal_record_id
- storage_path
- mime_type
- width
- height
- created_at

## 7.9 daily_reports
- id
- baby_id
- report_date
- structured_summary_json
- rendered_summary
- suggestions_text
- completeness_score
- created_at

## 7.10 weekly_reports
- id
- baby_id
- week_start_date
- structured_summary_json
- rendered_summary
- suggestions_text
- created_at

## 7.11 age_stage_reminders
- id
- baby_id
- age_stage_key
- scheduled_for
- rendered_text
- metadata_json
- status
- created_at

## 7.12 ingestion_events
Useful for debugging and retries.
- id
- baby_id
- source_type
- payload_json
- processing_status
- error_text
- created_at
- updated_at

---

## 8. API Design

Below is an MVP-oriented API shape.

## 8.1 Auth / User
- `POST /api/auth/session`
- `GET /api/me`

## 8.2 Baby Profile
- `POST /api/babies`
- `GET /api/babies/:id`
- `PATCH /api/babies/:id`
- `GET /api/babies/:id/settings`
- `PATCH /api/babies/:id/settings`

## 8.3 Chat
- `POST /api/conversations`
- `GET /api/conversations/:id/messages`
- `POST /api/conversations/:id/messages`

Request can include:
- text
- image references
- client timestamp
- baby id

## 8.4 Uploads
- `POST /api/uploads/presign`
- `POST /api/uploads/complete`

## 8.5 Meal Records
- `GET /api/babies/:id/meals?date=YYYY-MM-DD`
- `POST /api/babies/:id/meals`
- `PATCH /api/meals/:mealId`
- `POST /api/meals/:mealId/confirm`
- `POST /api/meals/:mealId/items`
- `PATCH /api/meal-items/:itemId`

## 8.6 Reports
- `GET /api/babies/:id/reports/daily?date=YYYY-MM-DD`
- `GET /api/babies/:id/reports/weekly?week_start=YYYY-MM-DD`
- `POST /api/babies/:id/reports/daily/generate`
- `POST /api/babies/:id/reports/weekly/generate`

## 8.7 Reminders
- `GET /api/babies/:id/reminders`
- `POST /api/babies/:id/reminders/generate`

---

## 9. AI Pipeline Design

The AI stack should use a **hybrid design**:
- deterministic rules for coverage and guardrails
- LLMs for perception and human-readable summaries

This is more reliable than pure free-form prompting.

### 9.1 Image + Text Parsing
Input:
- uploaded image(s)
- user text
- baby age context
- optional recent records for disambiguation

Output shape:
```json
{
  "meal_type": "lunch",
  "items": [
    {
      "food_name": "tomato beef noodles",
      "amount_text": "small bowl",
      "confidence": 0.81,
      "nutrition_tags": ["protein", "carb", "vegetable", "iron_source"]
    }
  ],
  "follow_up_questions": [
    "How much beef was actually eaten?"
  ],
  "requires_confirmation": true
}
```

### 9.2 Confidence Strategy
Use a confidence policy instead of pretending all outputs are equally certain.

Examples:
- high confidence food recognition + clear user amount => auto-create confirmed or near-confirmed draft
- high confidence food recognition + unclear amount => create draft + ask quantity question
- low confidence image recognition => ask what the food is before treating as final

### 9.3 Nutrition Rules Engine
Before generating prose, compute structured nutrition coverage.

Rule categories:
- protein coverage
- iron-source presence
- fruit presence
- vegetable presence
- dark green vegetable presence
- carb presence
- fat-source presence
- milk intake completeness
- supplement completion

Example rule output:
```json
{
  "protein": "covered",
  "fruit": "covered",
  "vegetables": "partial",
  "dark_green_vegetables": "missing",
  "iron": "partial",
  "milk_intake": "unknown"
}
```

### 9.4 Summary Generation
LLM input should include:
- baby age/stage
- structured meals for the period
- rule engine output
- known supplements
- confidence / completeness notes

LLM output should be constrained to:
- what was eaten
- what appears covered
- what may be missing
- practical next-step suggestions
- explicit uncertainty when data is incomplete

### 9.5 Age-Stage Reminder Generation
Do not rely only on a model's open-ended memory.

Recommended approach:
1. maintain curated stage templates
2. pass the correct stage content into the prompt
3. personalize lightly using recent data

This improves safety and consistency.

---

## 10. Age-Stage Knowledge Model

Use a stage-based content table or JSON knowledge base.

Each stage should contain:
- stage key
- age range
- feeding guidance
- developmental focus
- play suggestions
- safety reminders
- common parent questions

Example stage key:
- `10_to_11_months`
- `11_to_12_months`

This can live as:
- database records
- versioned JSON files in the repo
- CMS content later

For MVP, versioned JSON or markdown files in the repo is enough.

---

## 11. Job and Scheduling Design

### 11.1 Daily Summary Job
Schedule:
- user configurable, default 7:00 PM local time

Steps:
1. find babies with enabled daily summary
2. load that day's meal records
3. load supplements and milk logs
4. run nutrition rules
5. generate report text
6. save report
7. send notification

### 11.2 Weekly Summary Job
Schedule:
- once per week, user configurable later

Steps:
1. gather 7-day records
2. compute diversity and frequency statistics
3. run weekly rules
4. generate summary
5. save and notify

### 11.3 Reminder Job
Schedule:
- every day, detect whether a stage reminder is due

Steps:
1. compute age stage for each baby
2. detect if a reminder threshold was reached
3. generate reminder
4. save and notify

---

## 12. Notification Design

Notification types:
- daily summary ready
- weekly summary ready
- age-stage reminder
- follow-up needed on ambiguous meal input

Notification principles:
- concise title
- useful body
- deep-link into the relevant screen
- no spammy behavior

Examples:
- "Today's nutrition summary is ready"
- "Reminder: new feeding focus for this stage"
- "Quick question: how much beef was eaten at lunch?"

---

## 13. Security and Privacy

This product handles sensitive child and family data.

Required practices:
- encrypted transport (HTTPS)
- secure auth tokens
- row-level ownership controls
- private media storage
- signed upload / download URLs
- avoid exposing raw media publicly
- avoid logging sensitive image URLs in plaintext when unnecessary

Recommended controls:
- row-level security if using Supabase
- environment-scoped API keys
- audit logs for destructive actions later

AI/privacy considerations:
- clearly disclose that uploaded text/images are processed by AI
- define a retention policy for uploaded media
- avoid using user data for model training unless explicitly agreed

---

## 14. Reliability and Failure Handling

### Common failure cases
- image upload fails
- AI parsing times out
- model returns invalid structure
- push notification fails
- scheduled job runs twice

### Required safeguards
- retries with backoff for transient failures
- idempotency keys for job execution
- fallback status: preserve raw record even if parsing fails
- validation of AI output against schema
- dead-letter logging for repeated failures

Example fallback behavior:
- if image parsing fails, keep the image and raw message, then ask the user to describe the meal manually

---

## 15. Observability

The MVP should include enough observability to debug real usage.

Track at minimum:
- upload success/failure rate
- AI parse success/failure rate
- average parse latency
- follow-up question rate
- daily report generation success rate
- push delivery success rate

Recommended tools:
- Sentry for app/backend errors
- structured logs in backend
- analytics events for user flows

---

## 16. Product Analytics Events

Suggested events:
- `baby_profile_created`
- `meal_photo_uploaded`
- `meal_text_submitted`
- `meal_record_created`
- `meal_record_confirmed`
- `follow_up_prompt_shown`
- `daily_report_generated`
- `weekly_report_generated`
- `reminder_opened`

This is important for validating whether the chat-based flow is actually sticky.

---

## 17. Performance Targets

Initial targets for MVP:
- text-only message response: under 3 seconds
- image parse first response: under 5 seconds for common cases
- daily timeline load: under 2 seconds
- daily report generation: under 20 seconds background completion

These are product targets, not hard SLA guarantees.

---

## 18. Suggested Repo Structure

A simple starting structure:

```text
/aibaby
  /app
  /components
  /lib
    /ai
    /db
    /rules
    /notifications
  /prisma
  /docs
    PRD.md
    TECHNICAL_DESIGN.md
  /content
    /age-stages
  /public
```

If the repo is still empty, a cleaner final structure later could be:

```text
/apps/mobile
/apps/web
/packages/ui
/packages/config
/packages/db
/packages/ai
/docs
/content/age-stages
```

For MVP, start simple.

---

## 19. Build Phases

### Phase 1: Core Data + Basic Chat Logging
- auth
- baby profile
- text logging
- image upload
- meal draft creation
- today timeline

### Phase 2: AI Parsing + Confirmation Loop
- multimodal parsing
- structured meal items
- follow-up questions
- meal confirmation/editing

### Phase 3: Daily Summary
- rule engine
- daily report generation
- notification delivery
- report history page

### Phase 4: Weekly Summary + Age-Stage Reminders
- weekly aggregation
- stage template system
- reminder delivery
- history surfaces

### Phase 5: Polish
- analytics
- better editing UX
- export/share improvements
- performance hardening

---

## 20. Key Technical Risks

### Risk 1: Image understanding accuracy
Mitigation:
- treat outputs as candidate records
- ask follow-up questions often
- make editing easy

### Risk 2: Hallucinated nutrition advice
Mitigation:
- rule engine first
- controlled summary format
- curated stage knowledge
- conservative wording

### Risk 3: Weak retention
Mitigation:
- optimize chat flow speed
- make daily summaries genuinely useful
- reduce correction burden

### Risk 4: Operational complexity too early
Mitigation:
- monolithic backend first
- managed infra where possible
- postpone microservices

---

## 21. Open Questions

These should be resolved before implementation begins:
- Should the MVP support one baby only, or multiple babies from day one?
- Should web be supported in MVP, or mobile only?
- How much nutrition detail should be exposed to users?
- Should caregivers share a single baby profile with role-based access?
- Should daily summary time be fixed or user-configurable in v1?
- Which AI provider(s) should be used in production first?
- Should image parsing be synchronous or background-first for lower perceived latency?

---

## 22. Recommendation

For the MVP, the best balance of speed and maintainability is:
- React Native + Expo
- Next.js + TypeScript
- PostgreSQL + Prisma
- Supabase Auth + Storage
- hybrid AI pipeline: rules + multimodal LLM + summary LLM
- scheduled jobs for daily/weekly reporting and age-stage reminders

This architecture is small enough to build quickly, but strong enough to support the product direction described in the PRD.
