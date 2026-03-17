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
