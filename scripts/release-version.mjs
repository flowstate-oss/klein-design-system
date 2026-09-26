import fs from "node:fs";
import { execFileSync } from "node:child_process";
const version = process.argv[2];
if (!/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(version ?? ""))
  throw new Error("Usage: npm run release:version -- 0.1.1");
const packages = fs
  .readdirSync("packages")
  .map((name) => `packages/${name}/package.json`);
for (const file of ["package.json", ...packages, "apps/docs/package.json"]) {
  const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
  if (file !== "apps/docs/package.json") manifest.version = version;
  for (const field of ["dependencies", "devDependencies", "peerDependencies"])
    for (const name of Object.keys(manifest[field] ?? {}))
      if (name.startsWith("@klein-ui/")) manifest[field][name] = version;
  fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + "\n");
}
execFileSync("npm", ["install", "--package-lock-only", "--ignore-scripts"], {
  stdio: "inherit",
});
console.log(
  `Aligned all public packages at ${version}. Commit manifests and lockfile with the release changes.`,
);
