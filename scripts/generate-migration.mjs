import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
const root = path.resolve(import.meta.dirname, "..");
const check = process.argv.includes("--check");
const entries = [];
function reference(file, entry) {
  const source = fs.readFileSync(file, "utf8");
  const tree = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const declarations = tree.statements
    .filter(
      (node) =>
        ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node),
    )
    .map((node) => node.getText(tree));
  const exports = tree.statements
    .filter(
      (node) =>
        node.modifiers?.some(
          (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
        ) || ts.isExportDeclaration(node),
    )
    .map((node) => node.getText(tree).split("\n")[0]);
  entries.push({
    name: entry.split("/").slice(1).join("/"),
    import: entry,
    status: "migration-api",
    usage:
      "Extracted application API. New features use the closed API in the main catalogue or extend it in Klein. Data, permissions and persistence stay in application adapters.",
    exports,
    declarations,
  });
}
for (const pkg of ["react", "table", "charts", "forecast", "eddy"]) {
  const base = path.join(root, "packages", pkg);
  const manifest = JSON.parse(
    fs.readFileSync(path.join(base, "package.json"), "utf8"),
  );
  for (const [entry, target] of Object.entries(manifest.exports)) {
    if (entry === "." || typeof target === "string") continue;
    const relative = target.types.replace("./dist/", "").replace(".d.ts", "");
    if (relative.includes("*")) {
      const directory = relative.split("*")[0];
      for (const file of fs
        .readdirSync(path.join(base, "src", directory))
        .filter((file) => /\.tsx?$/.test(file)))
        reference(
          path.join(base, "src", directory, file),
          `@klein-ui/${pkg}/${entry.slice(2).replace("*", file.replace(/\.tsx?$/, ""))}`,
        );
    } else {
      const file = [".tsx", ".ts"]
        .map((extension) => path.join(base, "src", relative + extension))
        .find((file) => fs.existsSync(file));
      if (file) reference(file, `@klein-ui/${pkg}/${entry.slice(2)}`);
    }
  }
}
const text = JSON.stringify(entries, null, 2) + "\n";
for (const file of [
  "packages/contracts/compatibility.json",
  "apps/docs/public/compatibility.json",
]) {
  const target = path.join(root, file);
  if (check) {
    if (fs.readFileSync(target, "utf8") !== text)
      throw Error(`${file} is stale`);
  } else fs.writeFileSync(target, text);
}

const inventory = fs.readFileSync(
  path.join(root, "docs/migration-inventory.json"),
  "utf8",
);
for (const file of [
  "packages/contracts/migration.json",
  "apps/docs/public/migration.json",
]) {
  const target = path.join(root, file);
  if (check) {
    if (fs.readFileSync(target, "utf8") !== inventory)
      throw Error(`${file} is stale`);
  } else fs.writeFileSync(target, inventory);
}
