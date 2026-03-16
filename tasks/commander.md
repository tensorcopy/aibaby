# Commander Coordination

## Mission

Keep the three product lanes moving in parallel with minimal human intervention.
Read each team file, summarize the current state, resolve or route cross-team
dependencies, and record decisions that help teams keep working.

## Team Snapshot

<!-- commander-sync:start team-snapshot -->
### Team 1: Caregiver Experience

- State: ready_to_start
- Goal: improve mobile discovery and workflow access without waiting on major backend changes
- Current task: add home-screen entry points for review, reminders, exports, and future growth
- Next task: add a reminder detail screen shell with done / snooze / dismiss states
- Blockers: none
- Source: `tasks/team-1-caregiver-experience.md`

### Team 2: Intelligence and Guidance

- State: ready_to_start
- Goal: define the next stable guidance contract and deterministic recommendation logic for future product surfaces
- Current task: define a typed recommendation contract for daily meal suggestions
- Next task: add deterministic meal-gap detection for protein, iron, vegetable variety, and repeats
- Blockers: none
- Source: `tasks/team-2-intelligence-and-guidance.md`

### Team 3: Platform and Trust

- State: ready_to_start
- Goal: advance the project from local MVP shell toward real staged infrastructure
- Current task: `AIB-085` real environment bootstrap and app configuration for Supabase auth, database access, and storage
- Next task: `AIB-081` first real database schema and repository layer
- Blockers: later staging validation still depends on real project environment values and full provider setup
- Source: `tasks/team-3-platform-and-trust.md`
<!-- commander-sync:end team-snapshot -->

## Cross-Team Dependencies

<!-- commander-sync:start cross-team-dependencies -->
- Team 3: Platform and Trust: Human or environment owner will eventually need to provide real project environment values and provider setup for authenticated staging validation.
<!-- commander-sync:end cross-team-dependencies -->

## Decisions

- The coordination surface for multi-agent work is repo-managed markdown under `tasks/`.
- Teams update only their own team file.
- The commander updates only this file.
- Human review is expected at low frequency; teams should keep working inside their lane unless blocked by a true dependency or risk.

## Interventions Needed

<!-- commander-sync:start interventions-needed -->
- None at this sync.
<!-- commander-sync:end interventions-needed -->

## Daily Summary Log

<!-- commander-sync:start daily-summary-log -->
### 2026-03-16 18:11:26 UTC

- Synced 3 team log files.
- Blocked teams: none.
- Review-ready teams: none.
- Open dependency requests: 1.

### 2026-03-15

- Seeded the markdown coordination workflow.
- Team logs were created for all 3 lanes.
- Commander file is ready to be the once-daily review surface.
<!-- commander-sync:end daily-summary-log -->
