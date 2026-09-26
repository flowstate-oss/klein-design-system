#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import postcss from "postcss";

const replacements = {
  button: "Button or IconButton",
  input: "Field or Input",
  textarea: "Textarea",
  select: "Select",
  table: "Table from @klein-ui/table",
  option: "Select",
};
const bannedImports =
  /@klein-ui\/[^/]+\/compat(?:\/|$)|^(?:@radix-ui\/|@headlessui\/|@tanstack\/react-table|chart\.js|react-chartjs-2|lucide-react|@klein-ui\/[^/]+\/dist(?:\/|$))|(?:^|\/)components\/ui\/(?:button|tabs|input|table)(?:$|\.)/;
const rawColor = /#[\da-f]{3,8}\b|\b(?:rgb|hsl|oklch|oklab|hwb)a?\s*\(/i;
const badUtilities =
  /(?:^|\s)(?:[\w-]+:)*(?:rounded(?!-none)(?:-[\w[\]/.-]+)?|shadow(?!-none)(?:-[\w[\]/.-]+)?|(?:bg|text|border|ring)-(?:red|blue|green|slate|gray|zinc|purple|orange)-\d+|bg-gradient-[\w-]+)(?:\s|$)/;

/** Inspect consumer syntax; comments and string content are not treated as UI. */
export function inspect(source, file = "consumer.tsx") {
  const findings = [];
  const add = (node, rule, message) => {
    const line = node
      ? tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1
      : 1;
    findings.push({ file, line, rule, message });
  };
  const tree = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".jsx") ? ts.ScriptKind.JSX : ts.ScriptKind.TSX,
  );
  if (file.endsWith(".css")) {
    const sheet = postcss.parse(source, { from: file });
    sheet.walkDecls((decl) => {
      if (
        rawColor.test(decl.value) ||
        (/^(border-radius|box-shadow)$/.test(decl.prop) &&
          !["0", "0px", "none"].includes(decl.value))
      )
        findings.push({
          file,
          line: decl.source?.start?.line ?? 1,
          rule: "visual-tokens",
          message: "Use Klein semantic tokens and flat geometry.",
        });
    });
    sheet.walkRules((rule) => {
      if (/\.k-[\w-]+/.test(rule.selector))
        findings.push({
          file,
          line: rule.source?.start?.line ?? 1,
          rule: "internal-selector",
          message: "Do not restyle Klein internal classes.",
        });
    });
    return findings;
  }
  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      bannedImports.test(node.moduleSpecifier.text)
    )
      add(
        node,
        "canonical-import",
        "Use a public Klein component; do not import vendor engines, legacy controls or internals.",
      );
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === "require")) &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0]) &&
      bannedImports.test(node.arguments[0].text)
    )
      add(
        node,
        "canonical-import",
        "Dynamic imports must also use public Klein exports.",
      );
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(tree);
      if (replacements[tag])
        add(
          node,
          "canonical-element",
          `Use ${replacements[tag]} instead of <${tag}>. See the installed Klein catalogue.`,
        );
      for (const attribute of node.attributes.properties) {
        if (!ts.isJsxAttribute(attribute)) continue;
        const name = attribute.name.getText(tree);
        if (name === "style")
          add(
            attribute,
            "style-escape",
            "Use documented layout props and tokens, not inline styles.",
          );
        if (name === "className" && attribute.initializer) {
          const text = attribute.initializer.getText(tree);
          if (
            rawColor.test(text) ||
            badUtilities.test(text.replace(/["'`{}]/g, " "))
          )
            add(
              attribute,
              "visual-tokens",
              "Use canonical component variants; colour/geometry utilities are not allowed.",
            );
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return findings;
}

/** Scan adopted source trees; no automatic exemptions or mutable baselines. */
export function scan(root) {
  const stat = fs.statSync(root);
  if (stat.isFile())
    return /\.(?:[jt]sx?|css)$/.test(root)
      ? inspect(fs.readFileSync(root, "utf8"), root)
      : [];
  return fs
    .readdirSync(root, { withFileTypes: true })
    .flatMap((entry) =>
      ["node_modules", ".git", "dist", "build", ".next"].includes(entry.name)
        ? []
        : scan(path.join(root, entry.name)),
    );
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href
) {
  const targets = process.argv.slice(2);
  if (!targets.length) {
    console.error("Usage: klein-check <adopted-directory-or-file> [...]");
    process.exitCode = 2;
  } else {
    try {
      const findings = targets.flatMap(scan);
      for (const f of findings)
        console.error(`${f.file}:${f.line} [${f.rule}] ${f.message}`);
      if (findings.length) process.exitCode = 1;
      else console.log("Klein consumer checks passed.");
    } catch (error) {
      console.error(error.message);
      process.exitCode = 2;
    }
  }
}
