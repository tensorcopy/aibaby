import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

const TEAM_FILES = [
  {
    key: "team1",
    label: "Team 1: Product",
    relativePath: "tasks/team-1-product.md",
  },
  {
    key: "team2",
    label: "Team 2: Platform",
    relativePath: "tasks/team-2-platform.md",
  },
];

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const commanderPath = path.join(repoRoot, "tasks", "commander.md");
  const commanderSource = await fs.readFile(commanderPath, "utf8");
  const sourceRef = options.sourceRef ?? "origin/main";

  await refreshSourceRef(repoRoot, sourceRef, options);
  const currentTaskStatuses = await readCurrentTaskStatuses(repoRoot, sourceRef, options);
  const teams = await Promise.all(
    TEAM_FILES.map(async (team) => {
      const { source, sourceLabel } = await readRepoFile(repoRoot, team.relativePath, sourceRef, options);
      return {
        ...team,
        sourceLabel,
        ...parseTeamLog(source),
      };
    }),
  );

  const now = new Date(options.now ?? Date.now());
  const formattedNow = formatUtc(now);
  const nextCommander = updateCommander(commanderSource, teams, formattedNow, currentTaskStatuses);

  await fs.writeFile(commanderPath, nextCommander, "utf8");
}

async function readCurrentTaskStatuses(repoRoot, sourceRef, options) {
  try {
    const { source } = await readRepoFile(repoRoot, "tasks/current.md", sourceRef, options);
    return parseCurrentTasks(source);
  } catch {
    return new Map();
  }
}

export function parseTeamLog(source) {
  const currentStateSection = getSection(source, "Current State");
  const currentState = parseBullets(currentStateSection);
  const dependencySection = getSection(source, "Dependency Requests");
  const dependencyRequests = parseListItems(dependencySection).filter(
    (item) => !/^none currently\.?$/i.test(item),
  );
  const activeQueueSection = getSection(source, "Active Queue");
  const activeQueue = parseListItems(activeQueueSection);

  return {
    goal: currentState.goal ?? "unknown",
    state: currentState.state ?? "unknown",
    currentTask: currentState["current task"] ?? "unknown",
    nextStep: currentState["next step"] ?? "unknown",
    blockers: currentState.blockers ?? "none",
    files: currentState.files ?? "not recorded",
    verification: currentState.verification ?? "not recorded",
    lastUpdated: currentState["last updated"] ?? "unknown",
    dependencyRequests,
    activeQueue,
  };
}

export function updateCommander(source, teams, formattedNow, currentTaskStatuses = new Map()) {
  const teamSnapshot = buildTeamSnapshot(teams);
  const crossTeamDependencies = buildCrossTeamDependencies(teams);
  const interventions = buildInterventions(teams, currentTaskStatuses);
  const existingSummaryLog = getMarkedSection(source, "daily-summary-log").trim();
  const preservedSummaryLog = existingSummaryLog.startsWith("### ") ? existingSummaryLog : "";
  const latestSummary = buildSummaryEntry(teams, formattedNow);
  const summaryLog = preservedSummaryLog
    ? `${latestSummary}\n\n${preservedSummaryLog}`
    : latestSummary;

  let output = source;
  output = replaceMarkedSection(output, "team-snapshot", teamSnapshot);
  output = replaceMarkedSection(output, "cross-team-dependencies", crossTeamDependencies);
  output = replaceMarkedSection(output, "interventions-needed", interventions);
  output = replaceMarkedSection(output, "daily-summary-log", summaryLog);
  return output;
}

function buildTeamSnapshot(teams) {
  return teams
    .map((team) => {
      const nextTask = team.activeQueue.find((item) => item !== team.currentTask) ?? team.nextStep;
      return `### ${team.label}

- State: ${team.state}
- Goal: ${team.goal}
- Current task: ${team.currentTask}
- Next task: ${nextTask}
- Blockers: ${team.blockers}
- Source: \`${team.sourceLabel ?? team.relativePath}\``;
    })
    .join("\n\n");
}

function buildCrossTeamDependencies(teams) {
  const lines = [];

  for (const team of teams) {
    for (const request of team.dependencyRequests) {
      lines.push(`- ${team.label}: ${request}`);
    }
  }

  if (lines.length === 0) {
    return "- None recorded at this sync.";
  }

  return lines.join("\n");
}

function buildInterventions(teams, currentTaskStatuses) {
  const lines = [];

  for (const team of teams) {
    const taskId = extractTaskId(team.currentTask);
    if (taskId && currentTaskStatuses.get(taskId) === "done") {
      lines.push(
        `- ${team.label} current task ${taskId} is already marked done in tasks/current.md. ${team.label} should refresh its queue and continue to the next lane-appropriate task without waiting for commander approval.`,
      );
    }

    if (team.state === "review_ready") {
      lines.push(`- Review-ready work exists for ${team.label}. Check or merge the PR promptly.`);
    }

    if (team.state === "blocked") {
      const fallbackTask = team.activeQueue.find((item) => item !== team.currentTask);
      const fallbackText = fallbackTask ? ` Suggested fallback: ${fallbackTask}.` : "";
      lines.push(
        `- Blocked work exists for ${team.label}. Current blocker: ${team.blockers}.${fallbackText}`.replace(
          "..",
          ".",
        ),
      );
    }
  }

  if (lines.length === 0) {
    return "- None at this sync.";
  }

  return lines.join("\n");
}

function buildSummaryEntry(teams, formattedNow) {
  const blockedTeams = teams.filter((team) => team.state === "blocked").map((team) => team.label);
  const reviewReadyTeams = teams
    .filter((team) => team.state === "review_ready")
    .map((team) => team.label);
  const dependencyCount = teams.reduce((count, team) => count + team.dependencyRequests.length, 0);

  const lines = [
    `### ${formattedNow}`,
    "",
    `- Synced ${teams.length} team log files.`,
    `- Blocked teams: ${blockedTeams.length > 0 ? blockedTeams.join(", ") : "none"}.`,
    `- Review-ready teams: ${reviewReadyTeams.length > 0 ? reviewReadyTeams.join(", ") : "none"}.`,
    `- Open dependency requests: ${dependencyCount}.`,
  ];

  return lines.join("\n");
}

function parseArgs(args) {
  const options = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const value = args[index + 1];

    if (arg === "--repo-root") {
      options.repoRoot = value;
      index += 1;
      continue;
    }

    if (arg === "--now") {
      options.now = value;
      index += 1;
      continue;
    }

    if (arg === "--source-ref") {
      options.sourceRef = value;
      index += 1;
      continue;
    }

    if (arg === "--skip-fetch") {
      options.skipFetch = true;
    }
  }

  return options;
}

async function refreshSourceRef(repoRoot, sourceRef, options) {
  if (options.skipFetch || !shouldFetchSourceRef(sourceRef)) {
    return;
  }

  const [remoteName, ...branchParts] = sourceRef.split("/");
  const branchName = branchParts.join("/");
  const fetchArgs = ["fetch", remoteName];

  if (branchName) {
    fetchArgs.push(branchName);
  }

  try {
    await runGit(repoRoot, fetchArgs);
  } catch (error) {
    console.warn(
      `commander-sync: unable to refresh ${sourceRef}; falling back to the latest local ref state. ${error.message}`,
    );
  }
}

async function readTeamLog(repoRoot, relativePath, sourceRef, options) {
  return readRepoFile(repoRoot, relativePath, sourceRef, options);
}

async function readRepoFile(repoRoot, relativePath, sourceRef, options) {
  if (!sourceRef) {
    return {
      source: await fs.readFile(path.join(repoRoot, relativePath), "utf8"),
      sourceLabel: relativePath,
    };
  }

  try {
    const source = await runGit(repoRoot, ["show", `${sourceRef}:${relativePath}`]);
    return {
      source,
      sourceLabel: `${sourceRef}:${relativePath}`,
    };
  } catch (error) {
    console.warn(
      `commander-sync: unable to read ${relativePath} from ${sourceRef}; falling back to the working tree. ${error.message}`,
    );
    return {
      source: await fs.readFile(path.join(repoRoot, relativePath), "utf8"),
      sourceLabel: relativePath,
    };
  }
}

function shouldFetchSourceRef(sourceRef) {
  return sourceRef.startsWith("origin/");
}

export function parseCurrentTasks(source) {
  const taskStatuses = new Map();
  const taskPattern = /^-\s+(AIB-\d+)\s+`([^`]+)`/gm;

  for (const match of source.matchAll(taskPattern)) {
    taskStatuses.set(match[1], match[2].toLowerCase());
  }

  return taskStatuses;
}

function parseBullets(section) {
  const result = {};

  for (const line of section.split("\n")) {
    const match = line.match(/^- ([^:]+):\s*(.*)$/);
    if (!match) {
      continue;
    }

    result[match[1].trim().toLowerCase()] = match[2].trim();
  }

  return result;
}

function parseListItems(section) {
  return section
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "").trim())
    .filter(Boolean);
}

function getSection(source, heading) {
  const escapedHeading = escapeRegex(heading);
  const match = source.match(new RegExp(`## ${escapedHeading}\\n\\n([\\s\\S]*?)(?=\\n## |\\s*$)`));

  if (!match) {
    return "";
  }

  return match[1].trim();
}

function getMarkedSection(source, markerName) {
  const match = source.match(
    new RegExp(
      `<!-- commander-sync:start ${escapeRegex(markerName)} -->\\n([\\s\\S]*?)\\n<!-- commander-sync:end ${escapeRegex(markerName)} -->`,
      "m",
    ),
  );

  if (!match) {
    throw new Error(`Missing commander sync marker: ${markerName}`);
  }

  return match[1];
}

function replaceMarkedSection(source, markerName, content) {
  const pattern = new RegExp(
    `<!-- commander-sync:start ${escapeRegex(markerName)} -->\\n([\\s\\S]*?)\\n<!-- commander-sync:end ${escapeRegex(markerName)} -->`,
    "m",
  );

  return source.replace(
    pattern,
    `<!-- commander-sync:start ${markerName} -->\n${content}\n<!-- commander-sync:end ${markerName} -->`,
  );
}

function formatUtc(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractTaskId(text) {
  return text.match(/\bAIB-\d+\b/)?.[0] ?? null;
}

async function runGit(repoRoot, args) {
  const child = spawn("git", args, {
    cwd: repoRoot,
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  const exitCode = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", resolve);
  });

  if (exitCode !== 0) {
    throw new Error(stderr.trim() || `git ${args.join(" ")} exited with ${exitCode}`);
  }

  return stdout;
}

if (isDirectExecution()) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

function isDirectExecution() {
  if (!process.argv[1]) {
    return false;
  }

  return import.meta.url === pathToFileURL(process.argv[1]).href;
}
