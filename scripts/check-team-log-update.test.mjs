import assert from "node:assert/strict";
import test from "node:test";

import { evaluateChangedFiles } from "./check-team-log-update.mjs";

test("passes when a Product team log changes", () => {
  const result = evaluateChangedFiles([
    "apps/mobile/app/index.tsx",
    "tasks/team-1-product.md",
  ]);

  assert.equal(result.ok, true);
});

test("passes when a Platform team log changes", () => {
  const result = evaluateChangedFiles([
    "packages/db/src/baby-profile.js",
    "tasks/team-2-platform.md",
  ]);

  assert.equal(result.ok, true);
});

test("passes for docs and coordination only changes", () => {
  const result = evaluateChangedFiles([
    "AGENT_CONTEXT.md",
    ".github/pull_request_template.md",
    "docs/commander-cron.md",
    "tasks/commander.md",
  ]);

  assert.equal(result.ok, true);
});

test("fails for code changes without a team log update", () => {
  const result = evaluateChangedFiles([
    "apps/mobile/app/index.tsx",
    "packages/ai/src/daily-summary.js",
  ]);

  assert.equal(result.ok, false);
  assert.match(result.message, /must update either tasks\/team-1-product\.md or tasks\/team-2-platform\.md/i);
});

test("fails for mixed code and docs changes without a team log update", () => {
  const result = evaluateChangedFiles([
    "docs/commander-cron.md",
    "apps/web/src/runtime/env.ts",
  ]);

  assert.equal(result.ok, false);
});
