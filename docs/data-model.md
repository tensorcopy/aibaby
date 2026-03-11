# First-Pass Data Model

## Status

Accepted as the first-pass conceptual data model for MVP planning.

This document extracts the data model from the architecture baseline into a dedicated reference so multiple implementation agents can work against the same source of truth.

## Modeling principles

- PostgreSQL is the source of truth for product state.
- Uploaded media lives in object storage; the database stores metadata and relationships.
- AI output is a candidate interpretation, not the final truth, until confirmed when needed.
- Preserve raw user input for retries, debugging, and future model improvements.
- Keep the model compatible with future Markdown export.

## Core entities

### users
Represents an authenticated parent or caregiver account.

Fields:
- id
- email
- phone
- display_name
- created_at
- updated_at

### babies
Represents one baby profile for MVP.

Fields:
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

### baby_settings
Stores per-baby reminder and summary preferences.

Fields:
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

Constraints:
- unique on `baby_id`

### notification_devices
Stores push-notification device registrations.

Fields:
- id
- user_id
- platform
- expo_push_token
- app_build
- last_seen_at
- notifications_enabled
- created_at
- updated_at

Constraints:
- unique on `expo_push_token`

### caregivers
Optional in MVP, but included for future multi-adult support.

Fields:
- id
- baby_id
- user_id
- role
- created_at

### conversations
Represents a chat thread or logging context associated with a baby.

Fields:
- id
- baby_id
- created_at
- updated_at

### messages
Stores raw chat interactions before or alongside structured record creation.

Fields:
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

### meal_records
Stores a meal-level structured record created from a message or manual flow.

Fields:
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

### meal_items
Stores the individual foods inside a meal record.

Fields:
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

### media_assets
Stores uploaded media metadata and links it to raw messages and optionally meal records.

Fields:
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

Notes:
- `meal_record_id` should be nullable.
- media must still persist even when AI parsing fails.

Suggested `upload_status` values:
- uploaded
- processing
- failed
- deleted

### daily_reports
Stores one generated summary per baby per day.

Fields:
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

Constraints:
- unique on `(baby_id, report_date)`

### weekly_reports
Stores one generated summary per baby per weekly period.

Fields:
- id
- baby_id
- week_start_date
- structured_summary_json
- rendered_summary
- suggestions_text
- notification_status
- generated_by_job_key
- created_at

Constraints:
- unique on `(baby_id, week_start_date)`

### age_stage_reminders
Stores generated age-based reminder outputs.

Fields:
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

Constraints:
- unique on `(baby_id, age_stage_key, scheduled_for)`

### ingestion_events
Stores parse attempts, retries, and failures for operational visibility and idempotency.

Fields:
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

Constraints:
- unique on `idempotency_key`

## Relationship summary

- one `user` can own one or more `babies` in the future
- one `baby` has one `baby_settings` row
- one `user` can have many `notification_devices`
- one `baby` can have many `conversations`
- one `conversation` has many `messages`
- one `message` can create zero or one primary `meal_record`
- one `meal_record` has many `meal_items`
- one `message` can have many `media_assets`
- one `baby` has many `daily_reports`, `weekly_reports`, and `age_stage_reminders`
- one `message` can have many `ingestion_events`

## Why raw messages matter

The system should not depend only on finalized meal records.

We need `messages` and `ingestion_events` so the app can:
- retry failed parsing
- preserve user intent even when AI output is invalid
- support future model improvements
- debug user-reported mistakes

## Why media must be separate from meal records

A photo may exist before:
- parsing completes
- the user confirms the meal
- a meal record is successfully created

That means media should attach first to the raw message, and only optionally later to a meal record.

## Export compatibility

The model should support future Markdown export by making it easy to derive:
- diary entry date
- meal type
- foods eaten
- freeform parent note
- linked photos
- age / stage context
- summary and reminder excerpts

Potential exported frontmatter fields:
- date
- baby_name
- age_stage
- meal_type
- tags
- foods
- source_images
- summary_refs

## Recommended implementation order

1. users / babies / baby_settings
2. conversations / messages / media_assets
3. meal_records / meal_items
4. daily_reports / weekly_reports
5. age_stage_reminders
6. ingestion_events hardening and idempotency support

## Out-of-scope for this first pass

Not modeled in detail yet:
- height / weight records
- sleep logs
- bowel movement logs
- allergy incident tracking
- multiple babies per household UX details
- clinician collaboration

These can be added later without breaking the current conceptual model if IDs and ownership boundaries are kept clean.
