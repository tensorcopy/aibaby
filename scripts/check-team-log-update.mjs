import { execFileSync } from "node:child_process";

const TEAM_LOGS = new Set(["tasks/team-1-product.md", "tasks/team-2-platform.md"]);
const BYPASS_EXACT = new Set(["AGENT_CONTEXT.md", "tasks/commander.md", "tasks/current.md"]);
const BYPASS_PREFIXES = [".github/", "docs/"];
const BYPASS_SCRIPT_PATTERNS = [/^scripts\/commander-sync(\.test)?\.mjs$/];

export function evaluateChangedFiles(changedFiles) {
  const files = changedFiles.filter(Boolean);

  if (files.length === 0) {
    return { ok: true, message: "No changed files detected." };
  }

  if (files.some((file) => TEAM_LOGS.has(file))) {
    return { ok: true, message: "Team log update detected." };
  }

  if (files.every(isBypassFile)) {
    return { ok: true, message: "Docs/coordination-only PR bypass detected." };
  }

  return {
    ok: false,
    message:
      "This PR changes product/platform files and must update either tasks/team-1-product.md or tasks/team-2-platform.md.",
  };
}

function isBypassFile(file) {
  return (
    BYPASS_EXACT.has(file) ||
    BYPASS_PREFIXES.some((prefix) => file.startsWith(prefix)) ||
    BYPASS_SCRIPT_PATTERNS.some((pattern) => pattern.test(file))
  );
}

function parseArgs(args) {
  const options = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const value = args[index + 1];

    if (arg === "--base") {
      options.base = value;
      index += 1;
      continue;
    }

    if (arg === "--head") {
      options.head = value;
      index += 1;
    }
  }

  return options;
}

function main() {
  const { base, head } = parseArgs(process.argv.slice(2));

  if (!base || !head) {
    throw new Error("Expected --base <sha> and --head <sha>.");
  }

  const output = execFileSync("git", ["diff", "--name-only", `${base}..${head}`], {
    encoding: "utf8",
  });
  const changedFiles = output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const result = evaluateChangedFiles(changedFiles);

  if (!result.ok) {
    console.error(result.message);
    console.error(`Changed files: ${changedFiles.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  console.log(result.message);
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main();
}
