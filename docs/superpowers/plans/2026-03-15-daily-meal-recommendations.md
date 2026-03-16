# Daily Meal Recommendations Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** add a stable deterministic recommendation payload for daily meal suggestions in `packages/ai`

**Architecture:** keep recommendation generation in a dedicated Team 2 module that reuses age-stage and nutrition heuristics, then emit a render-ready but storage-agnostic payload. Keep logic deterministic so future UI and provider-backed content can build on one contract.

**Tech Stack:** Node.js, CommonJS, `node:test`, existing `packages/ai` helpers

---

## Chunk 1: Contract and Gap Detection

### Task 1: Define the failing recommendation contract test

**Files:**
- Create: `packages/ai/src/daily-meal-recommendations.test.js`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run `node --test src/daily-meal-recommendations.test.js` and verify the failure is caused by the missing module or missing exports**

### Task 2: Implement the minimal recommendation module

**Files:**
- Create: `packages/ai/src/daily-meal-recommendations.js`
- Modify: `packages/ai/src/daily-summary.js`

- [ ] **Step 1: Normalize inputs and age-stage resolution**
- [ ] **Step 2: Add deterministic protein, iron, vegetable-variety, and repeat detection**
- [ ] **Step 3: Generate the ordered recommendation objects and rendered summary**
- [ ] **Step 4: Re-run `node --test src/daily-meal-recommendations.test.js` until green**

## Chunk 2: Integration and Verification

### Task 3: Wire package scripts and documentation

**Files:**
- Modify: `packages/ai/package.json`
- Modify: `packages/ai/README.md`
- Modify: `tasks/current.md`

- [ ] **Step 1: Add the package-level test script**
- [ ] **Step 2: Update README responsibilities**
- [ ] **Step 3: Record the task state in repo tracking**

### Task 4: Verify the affected AI slice

**Files:**
- Verify only

- [ ] **Step 1: Run `npm run test:daily-summary` in `packages/ai`**
- [ ] **Step 2: Run `node --test src/daily-meal-recommendations.test.js` in `packages/ai`**
- [ ] **Step 3: If helpers changed, run `npm run test:weekly-summary`**
