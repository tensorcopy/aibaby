# `packages/db/prisma`

Home of the Prisma schema and future migrations/seed helpers for the MVP data model.

Current contents:

- `schema.prisma` with the first core relational model for users, babies, messages, meals, media, reports, reminders, and ingestion events
- `schema.test.js` as a lightweight repository-side guard that the checked-in schema still covers the core MVP tables and compound uniques
