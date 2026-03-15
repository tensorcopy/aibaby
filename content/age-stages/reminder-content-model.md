# Reminder Content Model

This file defines the first-pass repository-managed content shape for age-stage reminders.

## Source of truth

- `reminder-templates.json` is the machine-readable reminder library
- `stage-bands.md` provides the stable age-stage keys used for routing

## Template shape

Each template row includes:

- `ageStageKey`
- `stageLabel`
- `title`
- `cadenceDays`
- `feedingFocus`
- `developmentFocus`
- `safetyReminders`
- `playSuggestions`
- `routineFocus`
- `commonQuestions`

## MVP decisions

- The stage key must match one entry from `stage-bands.md`
- `cadenceDays` controls deterministic reminder scheduling inside a stage band
- Content stays repository-managed and versioned instead of being left to open-ended model recall
- Recent meal logs can personalize wording, but the base guidance must still be understandable without recent data
