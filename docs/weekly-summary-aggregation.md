# Weekly Summary Aggregation

This document defines the first-pass aggregation logic for weekly nutrition summaries.

The weekly summary should answer a different question than the daily summary:
- daily summary: what did today's log suggest?
- weekly summary: what patterns showed up repeatedly across the last 7 days?

## Scope

The weekly summary covers one baby and one 7-day window in the baby's local timezone.

Default window:
- the 7 completed local dates ending the day before the weekly job runs

The output should aggregate persisted daily reports and, when needed, the underlying confirmed records for gap filling.

## Input sources

Preferred inputs:
- `daily_reports` rows for the 7-day window
- persisted `structured_summary_json` from each daily report

Fallback inputs when a daily report is missing:
- confirmed meal records
- confirmed milk records
- confirmed supplement records

The weekly pipeline should not require every day to have a daily report before it can produce a weekly report.

## Aggregation goals

The weekly summary should surface:
- diet diversity across the week
- frequency of major coverage categories
- whether milk feeds were logged consistently
- whether routine supplements were logged consistently
- repeated weak spots instead of one-off misses
- one or two high-value next-week suggestions

## Window normalization

For each weekly run:
1. determine `week_start_date` and `week_end_date` in the baby's local timezone
2. load up to 7 daily reports in that range
3. backfill any missing day with deterministic daily aggregation from confirmed records
4. mark whether each date is `reported`, `backfilled`, or `missing`

The weekly summary should store how many days were actually covered so the UI can disclose partial weeks.

## Weekly metrics

Suggested first-pass metrics:

### Coverage frequency

For each category, compute:
- `daysCovered`
- `daysPartiallyCovered`
- `daysNotObserved`

Target categories:
- protein
- fat
- carbohydrate
- vegetable
- fruit
- ironRichFood
- milk
- supplement

### Diversity

Track:
- `daysWithAnyConfirmedIntake`
- `distinctFoodCount`
- `distinctProteinCount`
- `distinctProduceCount`

For MVP, diversity should be descriptive, not scored like a clinical index.

### Logging completeness

Track:
- `daysWithHighCompleteness`
- `daysWithMediumCompleteness`
- `daysWithLowCompleteness`
- `missingDayCount`
- `pendingOrFailedDayCount`

This is required so the weekly summary does not overstate certainty.

## Interpretation rules

### Strengths

A category can be called a weekly strength when:
- it was `covered` on at least 4 days, or
- it was `covered` or `partially_covered` on at least 5 days

Examples:
- fruit showed up on most days this week
- milk feeds were logged consistently across the week

### Repeated gaps

A category should be called a repeated gap when:
- it was `not_observed` on at least 4 days, and
- the week has at least 4 covered or backfilled days total

Examples:
- vegetables were missing from most logged days
- iron-rich foods appeared too inconsistently across the week

### Mixed signals

When the data is split or sparse, use softer wording:
- "appeared on some days"
- "was uneven across the week"
- "was hard to assess because several days were incomplete"

## Suggested output shape

Suggested `structured_summary_json` shape for weekly reports:

```json
{
  "version": "v1",
  "weekStartDate": "2026-03-02",
  "weekEndDate": "2026-03-08",
  "timezone": "America/Los_Angeles",
  "dayCoverage": {
    "reportedDays": 5,
    "backfilledDays": 1,
    "missingDays": 1,
    "highCompletenessDays": 2,
    "mediumCompletenessDays": 3,
    "lowCompletenessDays": 2
  },
  "categoryFrequency": {
    "protein": { "daysCovered": 4, "daysPartiallyCovered": 1, "daysNotObserved": 2 },
    "vegetable": { "daysCovered": 2, "daysPartiallyCovered": 1, "daysNotObserved": 4 },
    "fruit": { "daysCovered": 5, "daysPartiallyCovered": 1, "daysNotObserved": 1 },
    "ironRichFood": { "daysCovered": 2, "daysPartiallyCovered": 2, "daysNotObserved": 3 },
    "milk": { "daysCovered": 6, "daysPartiallyCovered": 0, "daysNotObserved": 1 },
    "supplement": { "daysCovered": 4, "daysPartiallyCovered": 0, "daysNotObserved": 3 }
  },
  "diversity": {
    "daysWithAnyConfirmedIntake": 6,
    "distinctFoodCount": 18,
    "distinctProteinCount": 4,
    "distinctProduceCount": 7
  },
  "strengths": [
    "Fruit and staple foods appeared on most logged days.",
    "Milk feeds were logged consistently across the week."
  ],
  "gaps": [
    "Vegetables were missing from most logged days.",
    "Iron-rich foods appeared unevenly across the week."
  ],
  "nextWeekSuggestions": [
    "Try planning one clear vegetable serving into at least four days next week."
  ],
  "caveat": "This weekly view is based on 6 of 7 days with confirmed or backfilled records."
}
```

## User-facing wording rules

The rendered weekly summary should:
- emphasize patterns, not single-day misses
- avoid precise nutritional claims
- disclose when the week is incomplete
- keep the number of recommendations small

Recommended order:
1. weekly overview
2. strengths
3. repeated gaps
4. one or two suggestions
5. caveat if coverage is partial

Target length:
- 90 to 170 words

## Incomplete-week handling

When fewer than 4 days have confirmed or backfilled coverage:
- still persist the weekly report
- render the week as low-confidence
- avoid strong trend statements
- shift the copy toward logging completeness rather than nutrition conclusions

Suggested fallback:
- "This week does not have enough complete daily records yet for a strong trend summary."

## Idempotency and persistence

The weekly job should:
- derive `generated_by_job_key` as `{baby_id}:{week_start_date}:weekly`
- upsert by `(baby_id, week_start_date)`
- notify only once per persisted weekly report

This keeps retries safe and matches the idempotency rules already accepted in `docs/architecture.md`.

## Follow-on dependencies

This contract feeds:
- `AIB-034` weekly summary generation flow
- `AIB-035` summary history view
- future push notification copy for weekly review
