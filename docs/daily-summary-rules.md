# Daily Summary Rules

This document defines the first-pass daily summary contract for MVP nutrition feedback.

The goal is not clinical scoring. The goal is to give caregivers a compact, useful end-of-day readout based on what was actually logged, while making uncertainty visible when the record is incomplete.

## Scope

The daily summary covers one baby and one local calendar day.

Inputs:
- confirmed meal records for the report date
- confirmed milk records for the report date
- confirmed supplement records for the report date
- the baby's age and profile context

Out of scope for MVP:
- calorie estimation
- gram-level nutrient calculations
- medical diagnosis
- growth percentile interpretation
- personalized medical advice

## Generation triggers

The summary should be generated when:
- the scheduled daily summary job runs for a baby with `daily_summary_enabled = true`
- a caregiver manually requests regeneration for the same date in a future admin or debug flow

The summary should only use data persisted for that report date in the baby's local timezone.

## Input quality gates

Before generating output, the pipeline should compute:
- `logged_meal_count`
- `logged_milk_count`
- `logged_supplement_count`
- `has_confirmed_records`
- `has_unconfirmed_records`
- `has_failed_ingestion_events`
- `coverage_flags_json`

Suggested first-pass coverage flags:
- `has_protein_source`
- `has_fat_source`
- `has_carbohydrate_source`
- `has_vegetable`
- `has_fruit`
- `has_iron_rich_food`
- `has_milk`
- `has_supplement`

The generator should treat the summary as low-confidence when:
- there are no confirmed records for the day
- only one small event is logged for the whole day
- a large share of same-day inputs are still draft / failed / pending

## Summary principles

The summary must:
- stay supportive and non-judgmental
- describe what was logged, not what is definitively true
- avoid medical or absolute claims
- separate observed coverage from inferred gaps
- prefer plain caregiver language over technical nutrition language

The summary must not:
- say the child is deficient, unhealthy, or behind
- imply that missing logs prove missing intake
- prescribe medication or dosing
- overstate precision when quantity data is weak

## First-pass rules

### 1. Build the day snapshot

Aggregate the day's confirmed records into a compact snapshot:
- meals logged
- foods mentioned
- milk feedings logged
- supplements logged
- duplicated food groups collapsed into simple coverage signals

This snapshot is the deterministic input for downstream wording.

### 2. Determine food-group coverage

For MVP, coverage is binary or ternary, not score-heavy.

Suggested statuses:
- `covered`
- `partially_covered`
- `not_observed`

Suggested interpretation:
- protein: meat, fish, egg, tofu, beans, yogurt, cheese, nut butter
- fat: avocado, nut butter, full-fat dairy, cooking oil explicitly mentioned, fatty fish
- carbohydrate / staple: rice, noodles, bread, oats, porridge, potato, pasta, other staple grains
- vegetables: any non-starchy vegetable
- fruit: fresh, cooked, frozen, or mashed fruit
- iron-rich foods: red meat, liver, iron-fortified cereal, beans, tofu, egg yolk, dark leafy greens when explicitly logged
- milk: breast milk, formula, or mixed feeding
- supplement: vitamin D, iron, or caregiver-configured routine supplements

If classification is ambiguous, prefer `partially_covered` or omit the claim.

### 3. Determine completeness

The summary should assign a coarse completeness band:
- `high`: multiple confirmed records across the day and no major pending gaps
- `medium`: some meaningful records, but likely incomplete
- `low`: sparse or unreliable logging for the day

This band should feed both `completeness_score` and user-facing caveat text.

### 4. Produce caregiver-facing observations

The daily summary should report:
- what categories appeared in today's logs
- whether milk and supplements were logged
- one or two likely gaps based on missing observed categories
- one practical next-day suggestion

Observations should be phrased as:
- "Today's log included ..."
- "The log also showed ..."
- "Vegetables were not clearly logged today."
- "If that matches the full day, you could aim to add ..."

### 5. Handle uncertainty explicitly

When completeness is not high, the summary must include a caveat such as:
- "This summary is based on the meals and feedings logged so far."
- "Some parts of today may be missing if they were not recorded."

If there are zero confirmed records, the system should store a summary object but render a fallback message instead of a normal nutrition review.

## Output contract

The daily summary should persist both structured data and rendered text.

Suggested `structured_summary_json` shape:

```json
{
  "version": "v1",
  "reportDate": "2026-03-11",
  "timezone": "America/Los_Angeles",
  "completenessBand": "medium",
  "inputStats": {
    "mealCount": 3,
    "milkCount": 2,
    "supplementCount": 1,
    "hasPendingInputs": false,
    "hasFailedInputs": false
  },
  "coverage": {
    "protein": "covered",
    "fat": "partially_covered",
    "carbohydrate": "covered",
    "vegetable": "not_observed",
    "fruit": "covered",
    "ironRichFood": "partially_covered",
    "milk": "covered",
    "supplement": "covered"
  },
  "highlights": [
    "Protein, fruit, and staple foods appeared in today's log.",
    "Milk feeds and routine supplements were also recorded."
  ],
  "gaps": [
    "Vegetables were not clearly logged today."
  ],
  "nextDaySuggestions": [
    "If that reflects the full day, try adding one vegetable serving tomorrow."
  ],
  "caveat": "This summary is based on the meals and feedings logged so far."
}
```

Suggested rendering fields:
- `rendered_summary`: short multi-sentence paragraph for timeline and report history views
- `suggestions_text`: the single most important next-step suggestion, duplicated for compact UI surfaces

## Recommended user-facing format

The rendered summary should follow this order:
1. intake overview
2. covered categories
3. likely gaps
4. one next-day suggestion
5. caveat when data is incomplete

Target length:
- 70 to 140 words for the main rendered summary
- 1 sentence for the suggestion callout

Example:

> Today's log included fruit, staple foods, and a protein source, and milk feeds were also recorded. Vegetables were not clearly logged, and iron-rich foods only appeared lightly. If that reflects the full day, consider adding a vegetable and one clearly iron-rich food tomorrow. This summary is based on the meals and feedings logged so far.

## Fallback cases

### No confirmed records

Store a report row with:
- low completeness
- empty or `not_observed` coverage
- fallback text that asks the caregiver to log meals before a nutrition review can be generated

Suggested rendered summary:
- "No confirmed meals or feedings were logged for this day yet, so a nutrition summary could not be generated."

### Only milk or supplements logged

The system should:
- acknowledge what was logged
- avoid broader food-balance conclusions
- suggest logging solid meals if they occurred

### Failed or pending ingestion exists

The system should:
- still generate a summary from confirmed data
- include a caveat when pending or failed items may materially change the interpretation

## Implementation notes

For MVP, the logic should be mostly deterministic:
- classify foods into coverage buckets using rule-based tags
- compute completeness and gaps with application rules
- optionally use the AI provider only to smooth wording into natural language

This keeps the output testable and reduces hallucination risk for `AIB-031`.

## Follow-on dependencies

This document defines the contract for:
- `AIB-031` daily summary generation flow
- `AIB-032` daily summary storage and retrieval
- future daily summary UI and notification copy
