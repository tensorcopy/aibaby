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

- use a title in the format `type(AIB-123): short description`
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

When an agent picks up a task from `tasks/current.md`, it should do the implementation work in a single PR and update that task's status in the same branch.

Unless explicitly instructed to stop, an agent should continue by picking up the next appropriate task after the current task is merged.

Do not open a separate claim PR just to mark a task as `in_progress`.

For task-related implementation PRs, include the claimed task ID in the PR title. Example:

- `feature(AIB-031): add daily summary generator`

## Reviews

Use review when it adds value, but do not require a separate claim PR before implementation.

## Ownership

The default code owner is `@tensorcopy`. Expand `.github/CODEOWNERS` as the repo grows.
