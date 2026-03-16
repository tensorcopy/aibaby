import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const TEAM_FILES = [
  {
    key: "team1",
    label: "Team 1: Caregiver Experience",
    relativePath: "tasks/team-1-caregiver-experience.md",
  },
  {
    key: "team2",
    label: "Team 2: Intelligence and Guidance",
    relativePath: "tasks/team-2-intelligence-and-guidance.md",
  },
  {
    key: "team3",
    label: "Team 3: Platform and Trust",
    relativePath: "tasks/team-3-platform-and-trust.md",
  },
];

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const commanderPath = path.join(repoRoot, "tasks", "commander.md");
  const commanderSource = await fs.readFile(commanderPath, "utf8");
  const teams = await Promise.all(
    TEAM_FILES.map(async (team) => {
      const source = await fs.readFile(path.join(repoRoot, team.relativePath), "utf8");
      return {
        ...team,
        ...parseTeamLog(source),
      };
    }),
  );

  const now = new Date(options.now ?? Date.now());
  const formattedNow = formatUtc(now);
  const nextCommander = updateCommander(commanderSource, teams, formattedNow);

  await fs.writeFile(commanderPath, nextCommander, "utf8");
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

export function updateCommander(source, teams, formattedNow) {
  const teamSnapshot = buildTeamSnapshot(teams);
  const crossTeamDependencies = buildCrossTeamDependencies(teams);
  const interventions = buildInterventions(teams);
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
- Source: \`${team.relativePath}\``;
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

function buildInterventions(teams) {
  const lines = [];

  for (const team of teams) {
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
    }
  }

  return options;
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
