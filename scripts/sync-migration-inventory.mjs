/** Run after a consumer extraction; CI verifies the checked-in snapshot without a sibling checkout. */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
const root = path.resolve(import.meta.dirname, "..");
const consumer = path.resolve(root, process.argv[2] ?? "../flowstate");
function sources(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? sources(path.join(dir, entry.name))
        : /\.tsx?$/.test(entry.name)
          ? [path.join(dir, entry.name)]
          : [],
    );
}
const modules = [];
for (const file of sources(path.join(consumer, "src")).filter(
  (file) => !/(?:__tests__|\.stories\.|\.generated\.)/.test(file),
)) {
  const source = fs.readFileSync(file, "utf8");
  const destinations = [
    ...new Set(
      [...source.matchAll(/from ['"](@klein-ui\/[^'"]+)/g)].map(
        (match) => match[1],
      ),
    ),
  ].sort();
  if (!destinations.length) continue;
  const content = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/['"]use client['"];?/g, "");
  const isReexport =
    /^\s*(?:export\s+(?:\*|(?:type\s*)?\{[^}]*\})\s+from\s+['"][^'"]+['"];?\s*)+$/.test(
      content,
    );
  modules.push({
    source: path.relative(consumer, file),
    destinations,
    disposition: isReexport ? "re-export" : "application-adapter",
    ownership: isReexport
      ? "Rendering in Klein; existing import retained."
      : "Klein supplies presentation; application retains domain data, formatting, permissions, routing and composition.",
  });
}
const manifest = {
  sourceRevision: execFileSync("git", ["rev-parse", "--short=9", "HEAD"], {
    cwd: consumer,
    encoding: "utf8",
  }).trim(),
  status: "local extraction; unpublished",
  naming: "Table; persisted dataview keys and IDs retained",
  modules,
  retainedApplicationBoundaries: [
    "queries and GraphQL/generated types",
    "server pagination and saved-view preferences",
    "financial calculations and resource hierarchy",
    "scenario comparisons and allocation calculations",
    "Eddy transport, subscriptions and report creation",
    "navigation destinations and viewer entitlements",
    "domain-specific page composition and rich-text editing integrations",
  ],
};
for (const file of [
  "docs/migration-inventory.json",
  "packages/contracts/migration.json",
  "apps/docs/public/migration.json",
])
  fs.writeFileSync(
    path.join(root, file),
    JSON.stringify(manifest, null, 2) + "\n",
  );
console.log(`Recorded ${modules.length} consumer modules.`);
