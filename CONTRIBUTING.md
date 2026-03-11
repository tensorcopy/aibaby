# Contributing

## Branching

All work targeting `main` must go through a pull request.

Use one of these branch prefixes:

- `feature/` for product work
- `fix/` for bug fixes
- `docs/` for documentation-only changes
- `chore/` for maintenance work

Do not commit directly to `main`.

## Pull requests

Every pull request should:

- explain the change in `Summary`
- list the concrete edits in `Changes`
- describe how the change was validated in `Validation`
- call out rollout or follow-up concerns in `Risks`

Keep pull requests small enough that a reviewer, human or AI, can evaluate them quickly.

If the PR changes project intent, architecture, or task status, update the relevant repo state files in the same branch:

- `docs/prd.md`
- `docs/architecture.md`
- `AGENT_CONTEXT.md`
- `tasks/current.md`

## Reviews

`main` requires review before merge. Treat approvals as stale after new commits and re-request review when the change materially changes.

## Ownership

The default code owner is `@tensorcopy`. Expand `.github/CODEOWNERS` as the repo grows.
