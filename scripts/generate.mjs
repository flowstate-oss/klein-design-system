import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
const root = path.resolve(import.meta.dirname, "..");
const check = process.argv.includes("--check");
function emit(file, text) {
  const dest = path.join(root, file);
  if (check) {
    if (!fs.existsSync(dest) || fs.readFileSync(dest, "utf8") !== text)
      throw new Error(`${file} is stale. Run npm run generate.`);
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, text);
  }
}
const tokens = JSON.parse(
  fs.readFileSync(path.join(root, "packages/tokens/source.json"), "utf8"),
);
const tokenJson = JSON.stringify(tokens, null, 2);
emit(
  "packages/tokens/tokens.css",
  "/* Generated from source.json. Do not edit. */\n:root {\n" +
    Object.entries(tokens)
      .map(([k, v]) => `  --k-${k}: ${v};`)
      .join("\n") +
    "\n}\n",
);
emit(
  "packages/tokens/index.js",
  `/** Canonical Klein token values. CSS references remain references. */\nexport const tokens = Object.freeze(${tokenJson});\n`,
);
emit(
  "packages/tokens/index.d.ts",
  `export declare const tokens: Readonly<{${Object.entries(tokens)
    .map(([k]) => `\n  ${JSON.stringify(k)}: string;`)
    .join("")}\n}>;\n`,
);
emit(
  "packages/tokens/index.ts",
  `/** Generated typed token source. */\nexport const tokens = ${tokenJson} as const;\n`,
);
const metadata = JSON.parse(
  fs.readFileSync(
    path.join(root, "packages/contracts/catalogue.source.json"),
    "utf8",
  ),
);
const config = ts.readConfigFile(
  path.join(root, "tsconfig.json"),
  ts.sys.readFile,
);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
const program = ts.createProgram(parsed.fileNames, parsed.options);
const checker = program.getTypeChecker();
const exportedByPackage = new Map(
  ["react", "table", "charts", "forecast", "eddy"].map((name) => {
    const file = program.getSourceFile(
      path.join(
        root,
        `packages/${name}/src/index.${["forecast", "eddy"].includes(name) ? "tsx" : "ts"}`,
      ),
    );
    return [
      `@klein-ui/${name}`,
      checker.getExportsOfModule(checker.getSymbolAtLocation(file)),
    ];
  }),
);
const examplesFile = program.getSourceFile(
  path.join(root, "apps/docs/src/examples.tsx"),
);
const props = {};
const releaseVersion = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
).version;
/** Include imported symbols and local fixture/helper dependencies so examples can be copied. */
function executableExample(example) {
  const bindings = new Map();
  for (const statement of examplesFile.statements) {
    const names = ts.isVariableStatement(statement)
      ? statement.declarationList.declarations.map((d) => d.name)
      : ts.isFunctionDeclaration(statement)
        ? [statement.name]
        : [];
    for (const name of names)
      if (name && ts.isIdentifier(name))
        bindings.set(checker.getSymbolAtLocation(name), statement);
  }
  const selected = new Set([example]);
  const used = new Set();
  function collect(node) {
    if (ts.isIdentifier(node)) {
      const symbol = checker.getSymbolAtLocation(node);
      used.add(symbol);
      const dependency = bindings.get(symbol);
      if (dependency && !selected.has(dependency)) {
        selected.add(dependency);
        collect(dependency);
      }
    }
    ts.forEachChild(node, collect);
  }
  collect(example);
  const imports = [];
  for (const statement of examplesFile.statements.filter(
    ts.isImportDeclaration,
  )) {
    const clause = statement.importClause;
    if (!clause) continue;
    const names =
      clause.namedBindings && ts.isNamedImports(clause.namedBindings)
        ? clause.namedBindings.elements.filter((e) =>
            used.has(checker.getSymbolAtLocation(e.name)),
          )
        : [];
    const defaultName =
      clause.name && used.has(checker.getSymbolAtLocation(clause.name))
        ? clause.name.text
        : "";
    if (names.length || defaultName)
      imports.push(
        `import ${clause.isTypeOnly ? "type " : ""}${defaultName}${defaultName && names.length ? ", " : ""}${names.length ? "{ " + names.map((n) => n.getText(examplesFile)).join(", ") + " }" : ""} from ${statement.moduleSpecifier.getText(examplesFile)};`,
      );
  }
  return [
    ...imports,
    "",
    ...examplesFile.statements
      .filter((s) => selected.has(s))
      .map((s) => s.getText(examplesFile)),
  ].join("\n\n");
}
for (const component of metadata) {
  const exported = exportedByPackage.get(
    component.package ?? "@klein-ui/react",
  );
  const publicComponents = exported.filter((s) => /^[A-Z]/.test(s.name));
  const symbol = exported.find((s) => s.name === component.name + "Props");
  if (!symbol || !publicComponents.some((s) => s.name === component.name))
    throw new Error(`Missing public API: ${component.name}`);
  const resolved =
    symbol.flags & ts.SymbolFlags.Alias
      ? checker.getAliasedSymbol(symbol)
      : symbol;
  const type = checker.getDeclaredTypeOfSymbol(resolved);
  const members = type.isUnion() ? type.types : [type];
  const collected = new Map();
  for (const member of members) {
    for (const prop of member.getProperties()) {
      const declaration = prop.valueDeclaration ?? prop.declarations?.[0];
      // Native HTML props are linked from docs, not repeated hundreds of times.
      if (
        !declaration ||
        !declaration.getSourceFile().fileName.includes("/packages/")
      )
        continue;
      const detail = checker.typeToString(
        checker.getTypeOfSymbolAtLocation(prop, declaration),
        declaration,
        ts.TypeFormatFlags.NoTruncation,
      );
      const existing = collected.get(prop.name);
      const description = ts.displayPartsToString(
        prop.getDocumentationComment(checker),
      );
      const defaultTag = prop
        .getJsDocTags(checker)
        .find((t) => t.name === "default");
      collected.set(prop.name, {
        name: prop.name,
        type: [
          ...new Set([
            ...(existing?.type.split(" | ") ?? []),
            ...detail.split(" | "),
          ]),
        ].join(" | "),
        required: members.every((m) => {
          const p = m.getProperty(prop.name);
          return p && !(p.flags & ts.SymbolFlags.Optional);
        }),
        description,
        default: defaultTag?.text?.map((t) => t.text).join("") ?? null,
      });
    }
  }
  const declaration = resolved.declarations?.[0];
  const supporting =
    declaration
      ?.getSourceFile()
      .statements.filter(
        (node) =>
          ts.isTypeAliasDeclaration(node) &&
          ["Appearance", "NativeButton"].includes(node.name.text),
      )
      .map((node) => node.getText())
      .join("\n\n") ?? "";
  props[component.name] = {
    declaration: [supporting, declaration?.getText()]
      .filter(Boolean)
      .join("\n\n"),
    props: [...collected.values()],
  };
  const example = examplesFile?.statements.find(
    (node) =>
      ts.isFunctionDeclaration(node) &&
      node.name?.text === component.name + "Example",
  );
  if (!example) throw new Error(`Missing typed example for ${component.name}`);
  component.example = executableExample(example);
  component.import = `import { ${component.name} } from '${component.package ?? "@klein-ui/react"}';`;
  component.version = releaseVersion;
}
emit(
  "packages/contracts/components.json",
  JSON.stringify(metadata, null, 2) + "\n",
);
emit("packages/contracts/props.json", JSON.stringify(props, null, 2) + "\n");
emit(
  "packages/contracts/AGENTS.md",
  fs.readFileSync(path.join(root, "docs/CONSUMER_AGENTS.md"), "utf8"),
);
console.log(
  check
    ? "Generated contracts and tokens match source."
    : "Generated tokens, API reference, examples and component catalogue.",
);

for (const name of ["components.json", "props.json", "AGENTS.md"])
  emit(
    `apps/docs/public/${name}`,
    fs.readFileSync(path.join(root, `packages/contracts/${name}`), "utf8"),
  );
