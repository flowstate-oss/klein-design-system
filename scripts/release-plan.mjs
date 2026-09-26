import fs from "node:fs";
import { execFileSync } from "node:child_process";
const names = [
  "tokens",
  "react",
  "table",
  "charts",
  "forecast",
  "eddy",
  "contracts",
];
const version = JSON.parse(fs.readFileSync("package.json", "utf8")).version;
const packages = names.map((name) => {
  const manifest = JSON.parse(
    fs.readFileSync(`packages/${name}/package.json`, "utf8"),
  );
  if (manifest.version !== version)
    throw new Error(`${name}: versions must be aligned`);
  return { directory: `packages/${name}`, name: manifest.name, version };
});
for (const pkg of packages) {
  let published = false;
  try {
    const result = execFileSync(
      "npm",
      ["view", `${pkg.name}@${version}`, "version", "--json"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    published = JSON.parse(result) === version;
  } catch (error) {
    if (!String(error.stderr).includes("E404")) throw error;
  }
  // Retry is safe after a partial release; published versions are immutable.
  if (!published)
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT ?? "/dev/stdout",
      `pending_${pkg.directory.split("/")[1]}=true\n`,
    );
}
