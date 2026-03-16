# Commander Cron

## Purpose

This job reads the three team log files and refreshes `tasks/commander.md` with
an updated team snapshot, dependency list, intervention list, and dated summary
entry.

## Behavior

- Read-only inputs:
  - `tasks/team-1-caregiver-experience.md`
  - `tasks/team-2-intelligence-and-guidance.md`
  - `tasks/team-3-platform-and-trust.md`
- Write targets:
  - `tasks/commander.md`
- The job does not edit team logs
- The job does not merge pull requests
- The job is observe-and-write only

## Manual run

```bash
npm run commander:sync
```

## Scheduled run

Install a local cron entry that runs every 2 hours and appends output to a
troubleshooting log path outside the repo working files.
