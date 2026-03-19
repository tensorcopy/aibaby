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
    path.join(repoRoot, "tasks", "team-1-product.md"),
    `# Team 1 Log: Product

## Current State

- Goal: improve mobile discovery and define recommendation contracts
- State: review_ready
- Current task: add home-screen entry points and recommendation contract scaffolding
- Next step: merge the ready PR and continue the combined product queue
- Blockers: none
- Files: apps/mobile/app/index.tsx, packages/ai/src/recommendations.mjs
- Verification: npm test --workspace @aibaby/mobile
- Last updated: 2026-03-16

## Active Queue

1. add home-screen entry points
2. define recommendation contract
3. add reminder detail screen shell
4. add meal-gap detection

## Dependency Requests

- Needs Platform repository contract for meal and report access.

## Work Log
`,
    "utf8",
  );

  await fs.writeFile(
    path.join(repoRoot, "tasks", "team-2-platform.md"),
    `# Team 2 Log: Platform

## Current State

- Goal: advance staged infrastructure
- State: blocked
- Current task: AIB-085 env bootstrap
- Next step: finish repository contract for Product
- Blockers: waiting on real project environment values
- Files: apps/web/src/runtime/env.ts
- Verification: npm test --workspace @aibaby/web
- Last updated: 2026-03-16

## Active Queue

1. AIB-085 env bootstrap
2. AIB-081 repository layer

## Dependency Requests

- Human or environment owner needs to provide real project environment values.

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

    assert.match(commanderContents, /Team 1: Product/);
    assert.match(commanderContents, /State: review_ready/);
    assert.match(commanderContents, /Team 2: Platform/);
    assert.match(commanderContents, /waiting on real project environment values/i);
    assert.match(commanderContents, /Needs Platform repository contract for meal and report access/i);
    assert.match(commanderContents, /Review-ready work exists for Team 1: Product/);
    assert.match(commanderContents, /Blocked work exists for Team 2: Platform/);
    assert.match(commanderContents, /2026-03-16 08:00:00 UTC/);
    assert.doesNotMatch(commanderContents, /stale snapshot/);
    assert.doesNotMatch(commanderContents, /stale dependencies/);
    assert.doesNotMatch(commanderContents, /stale interventions/);
    assert.doesNotMatch(commanderContents, /old summary/);
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("commander sync can read team logs from a git ref instead of the stale working tree", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "aibaby-commander-sync-git-ref-"));
  const repoRoot = path.join(tempRoot, "repo");

  await fs.mkdir(path.join(repoRoot, "tasks"), { recursive: true });
  await runCommand("git", ["init", "-b", "main"], { cwd: repoRoot });
  await runCommand("git", ["config", "user.name", "Codex"], { cwd: repoRoot });
  await runCommand("git", ["config", "user.email", "codex@example.com"], { cwd: repoRoot });

  await fs.writeFile(
    path.join(repoRoot, "tasks", "team-1-product.md"),
    `# Team 1 Log: Product

## Current State

- Goal: committed product goal
- State: review_ready
- Current task: committed product task
- Next step: committed product next step
- Blockers: none
- Files: committed-product.ts
- Verification: committed product verification
- Last updated: 2026-03-18

## Active Queue

1. committed product task

## Dependency Requests

- None currently.

## Work Log
`,
    "utf8",
  );

  await fs.writeFile(
    path.join(repoRoot, "tasks", "team-2-platform.md"),
    `# Team 2 Log: Platform

## Current State

- Goal: committed platform goal
- State: in_progress
- Current task: committed platform task
- Next step: committed platform next step
- Blockers: none
- Files: committed-platform.ts
- Verification: committed platform verification
- Last updated: 2026-03-18

## Active Queue

1. committed platform task

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

  await runCommand("git", ["add", "tasks"], { cwd: repoRoot });
  await runCommand("git", ["commit", "-m", "seed commander sync fixtures"], { cwd: repoRoot });

  await fs.writeFile(
    path.join(repoRoot, "tasks", "team-1-product.md"),
    `# Team 1 Log: Product

## Current State

- Goal: stale local product goal
- State: blocked
- Current task: stale local product task
- Next step: stale local product next step
- Blockers: stale local blocker
- Files: stale-local-product.ts
- Verification: stale local product verification
- Last updated: 2026-03-18

## Active Queue

1. stale local product task

## Dependency Requests

- None currently.

## Work Log
`,
    "utf8",
  );

  try {
    await runNodeScript(path.join(process.cwd(), "scripts", "commander-sync.mjs"), [
      "--repo-root",
      repoRoot,
      "--source-ref",
      "HEAD",
      "--skip-fetch",
      "--now",
      "2026-03-18T22:00:00Z",
    ]);
  } finally {
    const commanderPath = path.join(repoRoot, "tasks", "commander.md");
    const commanderContents = await fs.readFile(commanderPath, "utf8");

    assert.match(commanderContents, /committed product goal/);
    assert.match(commanderContents, /committed product task/);
    assert.doesNotMatch(commanderContents, /stale local product goal/);
    assert.doesNotMatch(commanderContents, /stale local product task/);
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

async function runCommand(command, args, options) {
  const child = spawn(command, args, {
    cwd: options.cwd,
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
