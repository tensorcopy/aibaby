# Architecture

## Status

This file is the evolving architecture record for the project. It exists so Codex, OpenClaw, and humans can share the same implementation assumptions outside of chat history.

## Current state

- Product definition exists in [docs/prd.md](docs/prd.md)
- No application stack has been finalized yet
- No runtime code has been scaffolded yet

## Initial system shape

- Client: chat-first mobile or web experience for parents and caregivers
- AI layer: multimodal input handling for image plus text meal logging
- Data layer: structured records for baby profile, feeding events, supplements, and summaries
- Review layer: timeline and trend views for 7-day and 30-day lookback

## Planned core domains

- Baby profile
- Feeding records
- Milk and supplement records
- Daily summaries
- Weekly summaries
- Age-based reminders

## Pending decisions

- app platform and stack
- auth approach
- storage model
- image ingestion pipeline
- LLM/provider strategy
- deployment target

## Update rule

When implementation choices become real, update this file in the same PR as the code that depends on them.
