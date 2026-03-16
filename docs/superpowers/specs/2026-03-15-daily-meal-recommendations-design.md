# Daily Meal Recommendations Design

## Goal

Add a stable, typed Team 2 recommendation contract for future daily meal suggestion surfaces without coupling it to a UI route or storage layer.

## Chosen Approach

Use a separate `packages/ai` recommendation module that consumes:

- baby age context
- recent confirmed meals
- allergy exclusions
- deterministic nutrition heuristics

It will emit one structured payload with:

- age-stage metadata
- recommendation confidence based on recent logging coverage
- deterministic gap signals for protein, iron-rich foods, vegetable variety, and repeated foods
- a small ordered set of meal suggestion cards with template keys, reasons, and example foods
- one rendered summary string for lightweight clients

## Why This Approach

This keeps Team 2 ownership at the guidance-contract layer:

- Team 1 can render the payload later without inventing guidance rules
- Team 3 does not need a new persistence contract yet
- later recipe-template work can extend `templateKey` and `exampleFoods` without breaking consumers

## Rules

- only confirmed meals count
- default analysis window: the latest 3 logged days
- protein gap: fewer than 2 logged days with a protein signal
- iron gap: fewer than 2 logged days with an iron-rich signal
- vegetable variety gap: fewer than 2 distinct vegetables in the window
- repeat signal: any non-milk, non-supplement food repeated in 3 or more meals in the window
- guidance stays supportive and explicitly avoids medical language

## Files

- add `packages/ai/src/daily-meal-recommendations.js`
- add `packages/ai/src/daily-meal-recommendations.test.js`
- optionally extract shared nutrition helpers if duplication with `daily-summary.js` becomes material
- update `packages/ai/package.json`, `packages/ai/README.md`, and repo tracking docs if the contract lands

## Follow-on Work

- recipe-template content and rendering rules can extend the same payload
- correction analytics can later feed repeat suppression and preference learning without changing the basic contract
