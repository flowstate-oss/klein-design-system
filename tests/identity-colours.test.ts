import { it, expect } from "vitest";
import {
  toolColour,
  toolColourKey,
  withToolColours,
} from "../packages/charts/src/tool-colours";
import {
  CHART_PALETTE_LIGHT,
  CHART_PALETTE_DARK,
} from "../packages/charts/src/chart-palette";
it("retains twelve distinct series and sixteen concurrent tool identities in both themes", () => {
  expect(new Set(CHART_PALETTE_LIGHT).size).toBe(12);
  expect(new Set(CHART_PALETTE_DARK).size).toBe(12);
  const tools = [
    "claude_code",
    "cursor",
    "gemini_cli",
    "claude_enterprise",
    "github_copilot",
    "openai-api",
    "chatgpt-web",
    "microsoft_365_copilot",
    "gemini-web",
    "aws_bedrock",
    "azure-openai",
    "google-vertex-ai",
    "openai_codex",
    "anthropic-api",
    "openrouter",
    "windsurf",
  ];
  for (const dark of [false, true])
    expect(new Set(tools.map((tool) => toolColour(tool, dark))).size).toBe(
      tools.length,
    );
});
it("preserves identity across aliases, ranking changes and unknown normalized keys", () => {
  expect(toolColourKey("anthropic-claude-ai")).toBe("claude-enterprise");
  expect(toolColour("Claude Code")).toBe(toolColour("claude_code"));
  expect(toolColour("New_Tool")).toBe(toolColour("new-tool"));
  const input = Object.freeze([
    { key: "cursor", color: null },
    { key: "claude_code", color: null },
  ]);
  const first = withToolColours(input);
  const second = withToolColours([...input].reverse());
  expect(first[0].color).toBe(second[1].color);
  expect(input[0].color).toBeNull();
});
