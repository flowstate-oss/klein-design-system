/**
 * One fixed colour per AI tool, in every chart, bar and legend.
 *
 * Will's dashboards spec (`docs/fabric/designs/helm-dashboards-spec.md`,
 * §"Visual rules"): "One fixed colour per tool in every chart, bar and logo."
 * A tool's colour must not depend on which other tools share the chart or on
 * its rank, so it is looked up by the tool's identity, never by series index.
 *
 * Why not the catalogue's `brandColor`: brands collide. Claude Enterprise,
 * the Anthropic API and Anthropic Compliance are all `#D97757`; three Google
 * products are `#4285F4`; Cursor and the OpenAI logs are both black. Two tools
 * in one stacked bar would be indistinguishable. The colours here come from the
 * Klein chart palette with documented product extensions (`chart-palette.ts`, the one `docs/DESIGN_GUIDE.md`
 * names) plus six extra hues in the same register for the tools past twelve.
 *
 * Every spelling of a tool maps to one colour: usage system ids
 * (`claude_code`), catalogue slugs (`claude-enterprise`) and the raw
 * `ai_usage.service` values the seeded data carries (`chatgpt-web`,
 * `anthropic-claude-ai`). A tool with no entry gets a colour from a stable hash
 * of its normalised id, so it is still the same colour on every screen.
 *
 * Client-safe and pure.
 *
 * @module tool-colours
 */

import { CHART_PALETTE_DARK, CHART_PALETTE_LIGHT } from "./chart-palette.js";
import { tokens } from "@klein-ui/tokens";

/** A tool's colour in the light and the dark theme. */
export interface ToolColour {
  /** Hex colour on a light background. */
  readonly light: string;
  /** Hex colour on a dark background. */
  readonly dark: string;
}

/**
 * The palette colour at `index` (0-based) in both themes.
 *
 * @param index - Position in the 12-colour extended palette.
 * @returns The light and dark hex for that position.
 */
function palette(index: number): ToolColour {
  return {
    light: CHART_PALETTE_LIGHT[index % CHART_PALETTE_LIGHT.length],
    dark: CHART_PALETTE_DARK[index % CHART_PALETTE_DARK.length],
  };
}

/** Extra hues for tools past the palette's twelve, in the same earthy register. */
const EXTRA = {
  umber: {
    light: tokens["identity-umber-light"],
    dark: tokens["identity-umber-dark"],
  },
  teal: {
    light: tokens["identity-teal-light"],
    dark: tokens["identity-teal-dark"],
  },
  camel: {
    light: tokens["identity-camel-light"],
    dark: tokens["identity-camel-dark"],
  },
  moss: {
    light: tokens["identity-moss-light"],
    dark: tokens["identity-moss-dark"],
  },
  plum: {
    light: tokens["identity-plum-light"],
    dark: tokens["identity-plum-dark"],
  },
  denim: {
    light: tokens["identity-denim-light"],
    dark: tokens["identity-denim-dark"],
  },
} as const satisfies Record<string, ToolColour>;

/**
 * The tools with a fixed colour, keyed by the canonical tool key, and every
 * other spelling that names the same tool. Chosen so the tools most often seen
 * together (Claude Code, Claude Enterprise, Cursor, GitHub Copilot, ChatGPT,
 * the OpenAI API, M365 Copilot and Gemini) are twelve distinct colours.
 */
const TOOLS: ReadonlyArray<{
  readonly key: string;
  readonly aliases: readonly string[];
  readonly colour: ToolColour;
}> = [
  { key: "claude-code", aliases: [], colour: palette(0) },
  {
    key: "claude-enterprise",
    aliases: ["claude-ai", "anthropic-claude-ai", "claude"],
    colour: palette(6),
  },
  {
    key: "anthropic-api",
    aliases: ["anthropic", "anthropic-api-direct", "anthropic-compliance"],
    colour: palette(4),
  },
  { key: "cursor", aliases: [], colour: palette(5) },
  { key: "github-copilot", aliases: ["copilot"], colour: palette(10) },
  {
    key: "openai-api",
    aliases: ["openai", "openai-platform", "openai-api-direct", "openai-logs"],
    colour: palette(3),
  },
  {
    key: "chatgpt",
    aliases: ["chatgpt-web", "openai-chatgpt", "chatgpt-enterprise"],
    colour: palette(8),
  },
  {
    key: "openai-codex",
    aliases: ["codex", "codex-enterprise"],
    colour: EXTRA.moss,
  },
  {
    key: "microsoft-365-copilot",
    aliases: ["m365-copilot", "microsoft-copilot"],
    colour: palette(7),
  },
  {
    key: "gemini",
    aliases: ["gemini-web", "google-workspace-gemini", "gemini-in-workspace"],
    colour: palette(2),
  },
  {
    key: "gemini-api",
    aliases: ["google-gemini-api", "google-gemini-api-direct", "google"],
    colour: palette(9),
  },
  { key: "gemini-cli", aliases: [], colour: EXTRA.camel },
  {
    key: "google-vertex-ai",
    aliases: ["google-vertex", "vertex", "vertex-ai", "google-vertex-content"],
    colour: EXTRA.teal,
  },
  {
    key: "aws-bedrock",
    aliases: ["bedrock", "aws-bedrock-content"],
    colour: palette(11),
  },
  {
    key: "azure-openai",
    aliases: ["microsoft-azure-openai"],
    colour: palette(1),
  },
  { key: "openrouter", aliases: [], colour: EXTRA.umber },
  { key: "windsurf", aliases: [], colour: EXTRA.denim },
  { key: "mistral", aliases: [], colour: EXTRA.plum },
];

/**
 * Lower-case, trimmed, with `_` and spaces as `-`, so `claude_code`,
 * `Claude-Code` and `claude code` are one key.
 *
 * @param id - Any tool identifier.
 * @returns The normalised form.
 */
function normalise(id: string): string {
  return id
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
}

/** Every normalised spelling → the canonical key. */
const KEY_OF: ReadonlyMap<string, string> = new Map(
  TOOLS.flatMap((tool) =>
    [tool.key, ...tool.aliases].map((spelling) => [
      normalise(spelling),
      tool.key,
    ]),
  ),
);

/** Canonical key → colour. */
const COLOUR_OF: ReadonlyMap<string, ToolColour> = new Map(
  TOOLS.map((tool) => [tool.key, tool.colour]),
);

/**
 * The canonical key for a tool: every spelling of one tool gives the same key.
 * An unknown tool's key is its normalised id.
 *
 * @param id - A usage system id, catalogue slug or `ai_usage.service` value.
 * @returns The canonical tool key.
 */
export function toolColourKey(id: string): string {
  const normal = normalise(id);
  return KEY_OF.get(normal) ?? normal;
}

/**
 * A 32-bit FNV-1a hash — stable across runs and machines, so an unknown tool
 * keeps its colour on every screen.
 *
 * @param text - The text to hash.
 * @returns An unsigned 32-bit hash.
 */
function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/**
 * A tool's fixed colour in both themes.
 *
 * @param id - Any spelling of the tool.
 * @returns Its colour; an unknown tool gets a palette colour chosen by a stable
 *   hash of its canonical key.
 */
export function toolColours(id: string): ToolColour {
  const key = toolColourKey(id);
  return COLOUR_OF.get(key) ?? palette(fnv1a(key) % CHART_PALETTE_LIGHT.length);
}

/**
 * A tool's fixed colour for the current theme.
 *
 * @param id - Any spelling of the tool.
 * @param isDark - Whether the dark theme is showing.
 * @returns A hex colour. Chart series can pass it as `color`: the shared
 *   `resolveSeriesColor` uses a hex as given.
 */
export function toolColour(id: string, isDark = false): string {
  const colour = toolColours(id);
  return isDark ? colour.dark : colour.light;
}

/**
 * Give every series that names a tool its tool's colour, so a chart stacked by
 * tool paints each tool the way every other chart and bar does.
 *
 * @param series - Chart series whose `key` is a tool id.
 * @param isDark - Whether the dark theme is showing.
 * @returns New series with `color` set; the input is not mutated.
 */
export function withToolColours<
  T extends { readonly key: string; readonly color?: string | null },
>(series: readonly T[], isDark = false): T[] {
  return series.map((s) => ({ ...s, color: toolColour(s.key, isDark) }));
}
