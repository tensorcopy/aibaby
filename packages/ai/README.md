# `packages/ai`

Placeholder for shared AI orchestration code.

Planned responsibilities:

- multimodal meal parsing contracts
- confidence and follow-up policies
- nutrition rules helpers
- summary and reminder prompting boundaries

Current first-pass implementation:

- deterministic daily summary generation contract in `src/daily-summary.js`
- deterministic weekly summary generation contract in `src/weekly-summary.js`
- repository-backed age-stage reminder templates and deterministic reminder rendering in `src/stage-reminders.js`

No provider-specific implementation has been added yet.
