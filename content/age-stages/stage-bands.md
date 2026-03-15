# Baseline Stage Bands

This file defines the first-pass age-stage bands used by `AIB-040`.

These ranges are a deterministic MVP baseline for reminder routing. They are not yet the full curated reminder-content library.

## Bands

- `newborn`: 0-6 weeks
- `early_infant`: 6-16 weeks
- `supported_sitter`: 4-6 months
- `solids_ready`: 6-9 months
- `finger_food_explorer`: 9-12 months
- `young_toddler`: 12-18 months
- `older_toddler`: 18-24 months
- `age_24_plus`: 24+ months

## Notes

- The stage keys are intended to stay stable so reminder templates can attach to them later.
- The feeding-focus labels in code are lightweight routing hints, not final caregiver-facing reminder copy.
