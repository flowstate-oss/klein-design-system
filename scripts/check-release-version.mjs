import { execFileSync } from "node:child_process";
import fs from "node:fs";
const base = process.env.RELEASE_BASE;
if (!base || /^0+$/.test(base)) {
  console.log("Initial release: no previous revision.");
  process.exit(0);
}
const changed = execFileSync("git", ["diff", "--name-only", `${base}...HEAD`], {
  encoding: "utf8",
})
  .trim()
  .split("\n");
if (!changed.some((file) => file.startsWith("packages/"))) process.exit(0);
let prior;
try {
  prior = JSON.parse(
    execFileSync("git", ["show", `${base}:package.json`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }),
  );
} catch {
  console.log("New package repository.");
  process.exit(0);
}
const current = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (prior.version === current.version)
  throw new Error(
    "Package changes require a release version: npm run release:version -- <next-version>",
  );
for (const name of fs.readdirSync("packages")) {
  const pkg = JSON.parse(
    fs.readFileSync(`packages/${name}/package.json`, "utf8"),
  );
  if (pkg.version !== current.version)
    throw new Error(`Unaligned version: ${name}`);
}
console.log(`Release version ${prior.version} → ${current.version}`);
