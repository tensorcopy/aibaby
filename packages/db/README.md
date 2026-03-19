# `packages/db`

Shared database layer for the product schema, repository adapters, and persistence-facing contracts.

Planned responsibilities:

- Prisma schema and migrations
- typed database client setup
- model-aligned query helpers
- storage metadata relationships for uploaded media


Current implementation:

- `src/baby-profile.js` defines the first shared baby profile create/update contract plus insert/update row adapters for persistence
- `src/baby-profile.test.js` covers normalization, age labeling, and the new persistence mapping helpers
- `src/daily-report.js` defines the first-pass daily summary persistence contract and retrieval helpers
- `src/weekly-report.js` defines the first-pass weekly summary persistence contract and retrieval helpers
- `prisma/schema.prisma` defines the first relational schema for the core MVP entities, including babies, messages, meal records, media assets, reports, reminders, and ingestion events
- `src/*-prisma.js` adds Prisma-facing adapters for baby profiles and report models so existing domain contracts can bridge into the real repository layer incrementally
- `src/baby-profile-repository.js` adds the first repository-backed baby-profile persistence adapter that keeps the existing row contract while targeting Prisma delegates underneath
- `src/text-meal-submission-repository.js` persists parsed text meal submissions into `messages` and `ingestion_events` while keeping the existing route-facing row shape
- `src/draft-meal-record-repository.js` persists draft meal generation and confirmation flows into `meal_records`, `meal_items`, and `ingestion_events`
- `src/timeline-repository.js` maps stored `messages` and `meal_records` into the existing timeline entry shape so the timeline can stop reading meal/text JSON files directly
