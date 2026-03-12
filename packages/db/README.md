# `packages/db`

Placeholder for the shared database layer.

Planned responsibilities:

- Prisma schema and migrations
- typed database client setup
- model-aligned query helpers
- storage metadata relationships for uploaded media

This package is intentionally empty until the first schema PR.


Current implementation:

- `src/baby-profile.js` defines the first shared baby profile create/update contract
- `src/baby-profile.test.js` covers normalization, empty-update rejection, and age labeling
