import { execFileSync } from "node:child_process";
import fs from "node:fs";

// Builds release notes from Conventional Commit subjects between two revisions.
// Usage: node scripts/release-notes.mjs [--from <rev>] [--to <rev>] [--bump]
//   --from  defaults to the newest v* tag before --to (or the whole history)
//   --to    defaults to HEAD
//   --bump  print the recommended semver bump (major|minor|patch) instead
const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
};
const git = (...gitArgs) =>
  execFileSync("git", gitArgs, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();

const to = option("--to") ?? "HEAD";
let from = option("--from");
if (!from) {
  try {
    from = git("describe", "--tags", "--abbrev=0", "--match", "v*", `${to}^`);
  } catch {
    from = undefined;
  }
}

const separator = "\x1e";
const log = git(
  "log",
  "--no-merges",
  `--format=%h${separator}%s${separator}%b${separator}%an\x1f`,
  from ? `${from}..${to}` : to,
);

const SECTIONS = [
  ["feat", "Features"],
  ["fix", "Bug fixes"],
  ["perf", "Performance"],
  ["refactor", "Refactoring"],
  ["docs", "Documentation"],
  ["test", "Tests"],
  ["build", "Build"],
  ["ci", "CI"],
  ["chore", "Chores"],
  ["other", "Other changes"],
];
const grouped = new Map(SECTIONS.map(([type]) => [type, []]));
const breaking = [];
const conventional = /^(\w+)(?:\(([^)]+)\))?(!)?:\s+(.+)$/;

for (const entry of log.split("\x1f").filter((item) => item.trim())) {
  const [sha, subject, body] = entry.trim().split(separator);
  const match = conventional.exec(subject);
  const type = match && grouped.has(match[1]) ? match[1] : "other";
  const scope = match?.[2];
  const description = match ? match[4] : subject;
  const line = `- ${scope ? `**${scope}:** ` : ""}${description} (${sha})`;
  grouped.get(type).push(line);
  const note = /^BREAKING[ -]CHANGE:\s*(.+)$/m.exec(body ?? "");
  if (match?.[3] || note)
    breaking.push(`- ${note?.[1] ?? description} (${sha})`);
}

if (args.includes("--bump")) {
  const bump = breaking.length
    ? "major"
    : grouped.get("feat").length
      ? "minor"
      : "patch";
  console.log(bump);
  process.exit(0);
}

const version = JSON.parse(fs.readFileSync("package.json", "utf8")).version;
const out = [`## Klein ${version}`, ""];
if (breaking.length) out.push("### ⚠ Breaking changes", "", ...breaking, "");
for (const [type, title] of SECTIONS) {
  const lines = grouped.get(type);
  if (lines.length) out.push(`### ${title}`, "", ...lines, "");
}
if (out.length === 2) out.push("No changes recorded.", "");
console.log(out.join("\n").trimEnd());
