import { execFileSync } from "node:child_process";
for (const name of ["react", "table", "charts", "forecast", "eddy"])
  execFileSync("npx", ["tsc", "-p", `packages/${name}/tsconfig.build.json`], {
    stdio: "inherit",
  });
execFileSync(
  "npx",
  [
    "@tailwindcss/cli",
    "-i",
    "packages/react/compat.source.css",
    "-o",
    "packages/react/compat.css",
    "--minify",
  ],
  { stdio: "inherit" },
);
