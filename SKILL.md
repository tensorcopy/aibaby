# AIbaby Execution Skill

Use this repository in continuous-execution mode.

## Task continuation rule

- After finishing the current task, immediately reopen `tasks/current.md`
- Pick the next open task marked `todo`
- Continue implementation work without waiting for human confirmation
- Only stop when blocked, when a destructive or ambiguous decision needs approval, or when the human explicitly redirects the work

## Completion rule

- Update `tasks/current.md` when a task status changes
- Update any related repo state files in the same branch
- Then continue directly into the next open task
