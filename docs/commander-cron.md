# Commander Cron

## Purpose

This job reads the team log files and refreshes `tasks/commander.md` with
an updated team snapshot, dependency list, intervention list, and dated summary
entry.

## Behavior

- Read-only inputs:
  - `origin/main:tasks/team-1-product.md`
  - `origin/main:tasks/team-2-platform.md`
  - `origin/main:tasks/current.md`
- Write targets:
  - `tasks/commander.md`
- By default the sync refreshes `origin/main` first, then reads the team logs from
  that ref so the summary reflects merged work instead of a stale local checkout
- The sync also compares each team's current task against `tasks/current.md` and
  flags stale queues when a team log is still pointing at a task already marked
  `done`
- If the remote refresh or ref read fails, the script falls back to the working
  tree so the cron remains observe-and-write instead of hard failing
- The job does not edit team logs
- The job does not merge pull requests
- The job is observe-and-write only

## Manual run

```bash
npm run commander:sync
```

To debug against a specific local ref without fetching, run:

```bash
node scripts/commander-sync.mjs --source-ref HEAD --skip-fetch
```

## Scheduled run

Install a local cron entry that runs every 2 hours and appends output to a
troubleshooting log path outside the repo working files.
