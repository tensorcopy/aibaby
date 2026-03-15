# `packages/db`

Placeholder for the shared database layer.

Planned responsibilities:

- Prisma schema and migrations
- typed database client setup
- model-aligned query helpers
- storage metadata relationships for uploaded media

This package is intentionally empty until the first schema PR.


Current implementation:

- `src/baby-profile.js` defines the first shared baby profile create/update contract plus insert/update row adapters for persistence
- `src/baby-profile.test.js` covers normalization, age labeling, and the new persistence mapping helpers
- `src/daily-report.js` defines the first-pass daily summary persistence contract and retrieval helpers
- `src/weekly-report.js` defines the first-pass weekly summary persistence contract and retrieval helpers
