import fs from "node:fs";
import ts from "typescript";
const problems = [];
function sources(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? sources(`${dir}/${entry.name}`)
        : /\.tsx?$/.test(entry.name)
          ? [`${dir}/${entry.name}`]
          : [],
    );
}
for (const name of ["react", "table", "charts", "forecast", "eddy"].flatMap(
  (pkg) => sources(`packages/${pkg}/src`),
)) {
  const source = ts.createSourceFile(
    name,
    fs.readFileSync(name, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  function visit(node) {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      /^(?:@\/|next(?:\/|$)|@apollo\/|@prisma\/)/.test(
        node.moduleSpecifier.text,
      )
    )
      problems.push(
        `${name}: application dependency ${node.moduleSpecifier.text}`,
      );
    if (
      ts.isCallExpression(node) &&
      /^(fetch|localStorage\.|sessionStorage\.)/.test(
        node.expression.getText(source),
      )
    )
      problems.push(
        `${name}: application effect ${node.expression.getText(source)}`,
      );
    ts.forEachChild(node, visit);
  }
  visit(source);
}
if (problems.length) throw new Error(problems.join("\n"));
console.log("Presentation dependency boundaries passed.");
