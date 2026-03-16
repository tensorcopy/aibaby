import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { spawn } from "node:child_process";

test("commander sync refreshes team snapshot, dependencies, interventions, and summary log", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "aibaby-commander-sync-"));
  const repoRoot = path.join(tempRoot, "repo");

  await fs.mkdir(path.join(repoRoot, "tasks"), { recursive: true });

  await fs.writeFile(
    path.join(repoRoot, "tasks", "team-1-caregiver-experience.md"),
    `# Team 1 Log: Caregiver Experience

## Current State

- Goal: improve mobile discovery
- State: review_ready
- Current task: add home-screen entry points
- Next step: merge the ready PR
- Blockers: none
- Files: apps/mobile/app/index.tsx
- Verification: npm test --workspace @aibaby/mobile
- Last updated: 2026-03-16

## Active Queue

1. add home-screen entry points
2. add reminder detail screen shell

## Dependency Requests

- None currently.

## Work Log
`,
    "utf8",
  );

  await fs.writeFile(
    path.join(repoRoot, "tasks", "team-2-intelligence-and-guidance.md"),
    `# Team 2 Log: Intelligence and Guidance

## Current State

- Goal: define recommendation contract
- State: blocked
- Current task: define recommendation contract
- Next step: wait for a stable repository contract
- Blockers: needs repository contract from Team 3
- Files: packages/ai/src/recommendations.mjs
- Verification: not run yet
- Last updated: 2026-03-16

## Active Queue

1. define recommendation contract
2. add meal-gap detection

## Dependency Requests

- Needs Team 3 repository contract for meal and report access.

## Work Log
`,
    "utf8",
  );

  await fs.writeFile(
    path.join(repoRoot, "tasks", "team-3-platform-and-trust.md"),
    `# Team 3 Log: Platform and Trust

## Current State

- Goal: advance staged infrastructure
- State: in_progress
- Current task: AIB-085 env bootstrap
- Next step: wire env parsing for auth and storage
- Blockers: none
- Files: apps/web/src/runtime/env.ts
- Verification: npm test --workspace @aibaby/web
- Last updated: 2026-03-16

## Active Queue

1. AIB-085 env bootstrap
2. AIB-081 repository layer

## Dependency Requests

- None currently.

## Work Log
`,
    "utf8",
  );

  await fs.writeFile(
    path.join(repoRoot, "tasks", "commander.md"),
    `# Commander Coordination

## Mission

Commander mission text.

## Team Snapshot

<!-- commander-sync:start team-snapshot -->
stale snapshot
<!-- commander-sync:end team-snapshot -->

## Cross-Team Dependencies

<!-- commander-sync:start cross-team-dependencies -->
stale dependencies
<!-- commander-sync:end cross-team-dependencies -->

## Decisions

- Existing decisions stay intact.

## Interventions Needed

<!-- commander-sync:start interventions-needed -->
stale interventions
<!-- commander-sync:end interventions-needed -->

## Daily Summary Log

<!-- commander-sync:start daily-summary-log -->
old summary
<!-- commander-sync:end daily-summary-log -->
`,
    "utf8",
  );

  try {
    await runNodeScript(path.join(process.cwd(), "scripts", "commander-sync.mjs"), [
      "--repo-root",
      repoRoot,
      "--now",
      "2026-03-16T08:00:00Z",
    ]);
  } finally {
    const commanderPath = path.join(repoRoot, "tasks", "commander.md");
    const commanderContents = await fs.readFile(commanderPath, "utf8");

    assert.match(commanderContents, /Team 1: Caregiver Experience/);
    assert.match(commanderContents, /State: review_ready/);
    assert.match(commanderContents, /Team 2: Intelligence and Guidance/);
    assert.match(commanderContents, /needs repository contract from Team 3/i);
    assert.match(commanderContents, /Needs Team 3 repository contract for meal and report access/i);
    assert.match(commanderContents, /Review-ready work exists for Team 1/);
    assert.match(commanderContents, /Blocked work exists for Team 2/);
    assert.match(commanderContents, /2026-03-16 08:00:00 UTC/);
    assert.doesNotMatch(commanderContents, /stale snapshot/);
    assert.doesNotMatch(commanderContents, /stale dependencies/);
    assert.doesNotMatch(commanderContents, /stale interventions/);
    assert.doesNotMatch(commanderContents, /old summary/);
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

async function runNodeScript(scriptPath, args) {
  const child = spawn(process.execPath, [scriptPath, ...args], {
    cwd: process.cwd(),
    stdio: "pipe",
  });

  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  const exitCode = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", resolve);
  });

  assert.equal(exitCode, 0, stderr || `expected exit code 0, got ${exitCode}`);
}
