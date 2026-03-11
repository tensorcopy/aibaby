# Agent Context

## Purpose

This repository is the shared source of truth for product intent, architecture, tasks, and code. Codex on the workstation and OpenClaw on the Mac mini should both read this file before making changes.

## Required read order

1. `docs/prd.md`
2. `AGENT_CONTEXT.md`
3. `tasks/current.md`
4. `docs/architecture.md`

## Working rules

- Treat the repository, not chat history, as the authoritative state
- Pull the latest branch state before starting work
- Make changes on a branch, not on `main`
- Update repo state files when product intent, architecture, or task status changes
- Keep commits small and scoped
- Put all meaningful progress in commits and pull requests

## Current project status

- Product requirements are captured in `docs/prd.md`
- Repository governance is enabled: `main` is protected and merges go through PRs
- Shared task tracking lives in `tasks/current.md`
- Architecture is not finalized and is tracked in `docs/architecture.md`
- No application scaffold has been created yet

## Coordination model

- Codex is the primary implementation agent on the workstation
- OpenClaw can continue work remotely, but should operate on the same Git repository state
- If an agent makes planning decisions, those decisions should be written back into repo files in the same branch

## When starting a task

1. Pull the latest remote changes
2. Read the required files in order
3. Confirm the active task in `tasks/current.md`
4. Do the work on a non-`main` branch
5. Update task status and relevant context files before finishing

## When blocked

- Record the blocker in `tasks/current.md`
- Do not leave critical rationale only in chat
- Prefer a small documentation PR over undocumented assumptions
