# AI Provider Decision

## Status

Accepted as the MVP AI provider baseline.

This document defines the first-pass provider strategy and abstraction boundary for parsing, summaries, and reminders so later implementation work can wire one provider without hard-coding the whole system around it.

## Decision summary

Use **OpenAI** as the primary AI provider for MVP.

For MVP:

- primary provider: OpenAI
- provider selection remains server-side
- one internal AI package should own prompt, schema, and provider adaptation
- rules remain outside the model layer and are not delegated to the provider
- fallback to a second provider is deferred until there is a real reliability or cost reason

## Why this approach

### 1. Fastest path to a working multimodal loop

The MVP needs:

- image plus text parsing
- structured extraction
- concise natural-language summaries
- parent-friendly reminder generation

Using one provider first reduces orchestration complexity and speeds up validation of the core product loop.

### 2. Matches the current environment and repo conventions

The repo already standardizes:

- `AI_PROVIDER=openai`
- `OPENAI_API_KEY`

Locking that in as the MVP baseline removes ambiguity for the first wiring PRs.

### 3. Keeps the abstraction where it matters

The team should not spread provider-specific calls across app code.

Instead:

- `packages/ai` owns provider-specific adapters
- the backend calls internal AI functions
- prompts, schemas, and validation stay in one place

That gives a clean future path to provider replacement without pretending multi-provider support is needed on day one.

## Functional split

The AI layer should stay split into two concerns:

### Rules layer

Rules are deterministic and provider-independent.

Examples:

- nutrition coverage checks
- reminder scheduling logic
- completeness evaluation
- report idempotency and persistence rules

### Model layer

The provider-backed model layer is responsible for:

- multimodal parsing of meal input
- follow-up question generation
- user-facing daily summary wording
- user-facing reminder wording

## Abstraction boundary

Implementation should define a narrow internal interface in `packages/ai`.

Recommended first-pass modules:

- `parseMealInput`
- `generateDailySummaryText`
- `generateWeeklySummaryText`
- `generateReminderText`

Each module should:

- accept typed input
- return schema-validated typed output
- avoid leaking provider SDK types outside the package

## Provider configuration

For MVP, environment configuration should support:

- `AI_PROVIDER=openai`
- `OPENAI_API_KEY`
- optional per-capability model names when implementation begins

Recommended future env names:

- `OPENAI_MODEL_PARSING`
- `OPENAI_MODEL_SUMMARY`
- `OPENAI_MODEL_REMINDERS`

Do not add multiple-provider env complexity until there is a committed second provider.

## Prompting and schema policy

Prompt templates and schemas should be stored in the repo, not hidden in ad hoc handlers.

Recommended rules:

- every structured extraction path must validate model output
- prompts should request bounded JSON-compatible output where possible
- invalid model output should be retried or downgraded to a clarification flow
- business rules should not depend on fragile prose parsing

## Error and fallback policy

For MVP:

- retry transient provider failures
- surface graceful user-facing fallback when parsing or generation fails
- preserve raw messages and media for retry
- do not automatically call a second provider yet

Fallback provider support should be added only if one of these becomes true:

- reliability is materially blocking users
- cost needs require provider switching
- one provider is weak on a specific capability

## Privacy and safety boundary

- send only the minimum required user content to the provider
- never send service-role credentials or internal secrets
- avoid logging raw provider payloads unless redacted
- keep medical and diagnostic claims outside the model's role

## Alternatives considered

### Multi-provider from day one

Rejected because it adds integration overhead before the product loop is validated.

### Pure rules with no LLM wording layer

Rejected because meal parsing, follow-up questions, and parent-facing summaries need flexible language generation.

### Provider-specific calls directly inside route handlers

Rejected because it couples business logic to SDK calls and makes later migration harder.

## Follow-up implementation tasks now unlocked

- wire the first OpenAI adapter in `packages/ai`
- define prompt and schema files for meal parsing and summaries
- add backend orchestration wrappers in `apps/web`
- revisit fallback-provider support only after real usage data exists

