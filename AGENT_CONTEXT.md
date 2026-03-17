# Agent Context

## Purpose

This repository is the shared source of truth for product intent, architecture, tasks, and code. Codex on the workstation and OpenClaw on the Mac mini should both read this file before making changes.

## Required read order

1. `docs/prd.md`
2. `AGENT_CONTEXT.md`
3. `tasks/commander.md`
4. your assigned `tasks/team-*.md` file
5. `docs/product-roadmap.md`
6. `tasks/current.md`
7. `docs/architecture.md`

## Working rules

- Treat the repository, not chat history, as the authoritative state
- Pull the latest branch state before starting work
- Start work in a dedicated git worktree
- Make changes on a branch, not on `main`
- Update repo state files when product intent, architecture, or task status changes
- Keep commits small and scoped
- Put all meaningful progress in commits and pull requests
- Work autonomously inside the assigned team boundary and goal
- Do not expand scope across team boundaries without writing down the dependency first
- After finishing a task, immediately pick up the next open `todo` task in `tasks/current.md` only if it still fits the assigned team goal and no blocker or redirection exists
- Do not leave completed or review-ready work only in a local checkout; commit it, push it, and move it through a pull request against `main`
- Do not leave pull requests open longer than necessary; merge them promptly or record the concrete blocker preventing merge

## Current project status

- Product requirements are captured in `docs/prd.md`
- Work must go through branches and PRs; `main` is the protected base branch for merges
- Shared task tracking lives in `tasks/current.md`
- Architecture is not finalized and is tracked in `docs/architecture.md`
- A minimal monorepo scaffold now exists for `apps/mobile`, `apps/web`, `packages/db`, `packages/ai`, `packages/ui`, and `content/age-stages`

## Current commander intent

- Team 1 default goal: improve mobile discovery and guidance capabilities without waiting on major backend changes where avoidable
- Team 1 may include both a product engineer and a designer specialist working inside the same lane
- Team 1 preferred work order:
  1. add home-screen entry points for review, reminders, exports, and future growth
  2. define a typed recommendation contract for daily meal suggestions
  3. add a reminder detail screen shell with done / snooze / dismiss states
  4. add deterministic meal-gap detection for protein, iron, vegetable variety, and repeats
  5. add a first-pass notification center route shell
  6. add correction analytics shape so repeated parent edits can be summarized by category
- Team 2 default goal: advance the project from local MVP shell toward real staged infrastructure
- Team 2 preferred work order:
  1. `AIB-085` real environment bootstrap and app configuration for Supabase auth, database access, and storage
  2. `AIB-081` first real database schema and repository layer
  3. `AIB-082` and `AIB-083` persistence replacement
  4. `AIB-084` real upload and storage flow
  5. `AIB-086` migrations and real seed/reset commands
  6. `AIB-087` authenticated end-to-end smoke pass

## Coordination model

- Codex is the primary implementation agent on the workstation
- OpenClaw can continue work remotely, but should operate on the same Git repository state
- If an agent makes planning decisions, those decisions should be written back into repo files in the same branch
- Work is split across 2 lanes from `docs/product-roadmap.md`: Product and Platform
- Each agent should stay inside one lane unless explicitly reassigned
- The commander should be able to understand progress from repo markdown files without rereading long chat history
- The source of truth for coordination is `tasks/commander.md` plus the per-team logs in `tasks/`
- Teams update only their own team file
- The commander updates only `tasks/commander.md`

## Commander protocol

- The commander should sync to the latest `main` before coordinating work
- The commander should read `AGENT_CONTEXT.md`, `tasks/commander.md`, both team log files, and relevant open-task context in `tasks/current.md`
- The commander should treat repo files and GitHub state as the communication surface, not chat history
- The commander should refresh `tasks/commander.md` with the latest team snapshot, cross-team dependencies, decisions, and interventions needed
- The commander should not rewrite team logs except in exceptional cleanup or recovery situations; teams own their own file updates
- When a team reports a blocker that can be resolved by coordination, the commander should write the resolution or decision into `tasks/commander.md`
- When a pull request is merge-ready, the commander should merge it promptly or record the blocker preventing merge
- If a team is idle because of a blocker, the commander should redirect it to the next best unblocked task in its lane and record that decision in `tasks/commander.md`

Commander work cycle:
1. sync to the latest `main`
2. read `tasks/commander.md` and all team logs
3. identify blockers, stale PRs, and cross-team dependencies
4. update `tasks/commander.md` with current status and decisions
5. merge ready PRs or record why they cannot merge
6. redirect blocked teams to the next best unblocked task when appropriate
7. leave a concise dated summary in `tasks/commander.md`

## Parallel execution protocol

- Start from the assigned team lane and goal; if no exact task ID is provided, choose the best matching `Ready now` item from `docs/product-roadmap.md`
- Before editing, identify the likely files, dependencies, and risks
- If the work needs a new or changed contract, write that down explicitly before or with the implementation
- Prefer tasks that can finish as one reviewable branch
- If blocked for more than a short investigation, stop and report instead of thrashing

## Continuous autonomous mode

- Default assumption: the human may review only once per day, so do not wait for frequent approvals
- Keep working inside the assigned team lane until you hit a true blocker or finish all clearly available work in that lane
- When one task is complete, immediately select the next best unblocked task that fits the same team lane and current goal
- Prefer `tasks/current.md` first; if no suitable open task exists there, use the next matching `Ready now` item from `docs/product-roadmap.md`
- If blocked on another team, external secrets, provider access, deployment access, or an unresolved product decision, record the blocker and then pick the next unblocked task in your lane instead of idling
- Do not stop merely because one slice is review-ready; queue up the next coherent slice if it fits the same lane and does not create risky overlap
- Keep decisions reversible where possible so work can continue without waiting on synchronous review
- Leave durable breadcrumbs in repo files so another agent or the commander can recover context without chat history
- Update your team log as the durable status surface instead of relying on chat

Team file update format:
- `Goal:` assigned goal or task ID
- `State:` `planning` | `in_progress` | `blocked` | `review_ready`
- `Current task:` the slice actively being worked
- `Next step:` the next 1 to 2 steps
- `Blockers:` dependencies, decisions, or `none`
- `Files:` files already touched or expected to change
- `Verification:` commands run or `not run yet`
- `Last updated:` current date

Required team log update points:
- after initial read and plan
- after the first meaningful implementation checkpoint
- immediately when blocked
- when the work is ready for review
- at the end of a work cycle, append one concise `Work Log` entry with completed work, current task, next task, and blockers

Command boundary rules:
- Team 1 owns product-facing UX, guidance logic, recommendation behavior, and parent-visible product surfaces
- Team 2 owns auth, data, storage, API/runtime integration, deployment, and operational readiness
- Do not silently change another team's boundary contract; report it clearly

Team 1 specialist rules:
- A designer specialist may work inside Team 1 on UX structure, navigation, interaction polish, discoverability, and visual presentation
- The designer specialist may change code directly for Product-owned UX work
- The designer specialist must stay out of Platform-owned auth, data, storage, runtime, and deployment changes
- If a design task needs a Platform contract or API change, record that dependency instead of improvising backend work
- Product specialists should use the same Team 1 log and make their role explicit in `Work Log` entries when helpful

Escalate only for:
- destructive or irreversible changes
- cross-team contract decisions that will force other teams to rework
- missing credentials, environment values, or deployment/provider access
- ambiguous product decisions with meaningful user-facing impact
- security, privacy, or data-loss risk

## When starting a task

1. Pull the latest remote changes
2. Read the required files in order
3. Confirm the assigned team lane and goal
4. Create or switch to a dedicated git worktree and branch for the task
5. Confirm the active task in `tasks/current.md`, or select a matching `Ready now` item from `docs/product-roadmap.md` if no task ID is assigned yet
6. Update your assigned team file with the current plan, dependencies, and expected files
7. Do the implementation work on a non-`main` branch inside that worktree
8. Update task status and relevant context files in that same branch before finishing

PR title rule:
- include the task ID in every task-related PR title using the format `type(AIB-123): short description`

## When a slice is ready

- Commit the work on the task branch
- Push the branch to GitHub
- Open or update a pull request targeting `main`
- Merge the pull request to `main` once repository policy allows it
- Do not leave the pull request open as a parking state; merge it promptly or write down the blocker
- After merge, return to the team queue and continue with the next best unblocked task

## When blocked

- Record the blocker in `tasks/current.md`
- Record the blocker in your assigned team file under `Current State`, `Dependency Requests`, and `Work Log`
- Do not leave critical rationale only in chat
- Prefer a small documentation PR over undocumented assumptions
- Make the blocker concrete enough that another agent or the commander can unblock it quickly by reading the repo files alone
