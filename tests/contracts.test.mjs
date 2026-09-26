import { describe, it, expect } from "vitest";
import { inspect } from "../packages/contracts/check.mjs";
describe("consumer enforcement", () => {
  it("rejects raw controls and points to the canonical replacement", () => {
    const result = inspect("export const View=()=> <button>Save</button>");
    expect(result[0].rule).toBe("canonical-element");
    expect(result[0].message).toContain("Button");
  });
  it("rejects aliased vendor imports, reexports, and dynamic imports", () => {
    for (const source of [
      "import {Root as LocalTabs} from '@radix-ui/react-tabs';",
      "export { Root } from '@radix-ui/react-tabs';",
      "const mod=import('chart.js');",
    ]) {
      expect(inspect(source).some((f) => f.rule === "canonical-import")).toBe(
        true,
      );
    }
  });
  it("allows documented public components and ignores comments", () => {
    expect(
      inspect(
        "import {Button as Action} from '@klein-ui/react'; // <button>\nexport const View=()=> <Action>Save</Action>;",
      ),
    ).toEqual([]);
  });
  it("rejects inline visual escapes and off-system utility classes", () => {
    expect(
      inspect(
        'const View=()=> <div style={{color: "red"}} className="rounded-lg bg-blue-500" />',
      ).map((x) => x.rule),
    ).toEqual(["style-escape", "visual-tokens"]);
  });
  it("parses CSS declarations and rejects internal restyling", () => {
    expect(
      inspect(".k-button { color: #fff; border-radius: 8px; }", "consumer.css"),
    ).toHaveLength(3);
    expect(
      inspect(
        "/* #fff */ .region { color: var(--k-text-body); }",
        "consumer.css",
      ),
    ).toEqual([]);
  });
});

it("runs when invoked through an npm-style executable symlink", async () => {
  const fs = await import("node:fs");
  const os = await import("node:os");
  const path = await import("node:path");
  const { spawnSync } = await import("node:child_process");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "klein-check-test-"));
  try {
    const link = path.join(dir, "klein-check");
    fs.symlinkSync(path.resolve("packages/contracts/check.mjs"), link);
    const file = path.join(dir, "view.tsx");
    fs.writeFileSync(file, "export const View=()=> <button>Save</button>");
    const result = spawnSync(process.execPath, [link, file], {
      encoding: "utf8",
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("canonical-element");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

it("rejects a new compatibility import while allowing closed family APIs", () => {
  expect(
    inspect("import {Button} from '@klein-ui/react/compat/button';").some(
      (finding) => finding.rule === "canonical-import",
    ),
  ).toBe(true);
  expect(
    inspect(
      "import {Table} from '@klein-ui/table'; import {Chart} from '@klein-ui/charts';",
    ),
  ).toEqual([]);
});
