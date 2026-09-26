"use client";

/**
 * Sparkline — minimal SVG sparkline for the AI Terminal sub-language.
 *
 * Constraints from `docs/specs/ai-terminal-design-language.md`:
 *   - Single accent stroke (`var(--accent-ai)`) at 1.25px.
 *   - No fill, no axes, no grid, no tooltips.
 *   - Caller controls width/height — pick something dense (64×20 default).
 *   - If `points.length < 2` we render nothing rather than a misleading dot.
 *
 * Used in the AiKpiRow tile and as a one-line "30d trend" cell in DataView
 * tables. The component is intentionally not a wrapper around recharts —
 * the payload is so small (≤ 90 points) that pure SVG is both faster and
 * yields a cleaner DOM for the desktop-app feel.
 */

import { cn } from "@klein-ui/react/compat/utils";

export interface SparklineProps {
  /**
   * Numeric series. Order matters — index 0 is the oldest sample, index n
   * is the most recent. Caller is responsible for downsampling.
   */
  points: readonly number[];
  /** Width in px. */
  width?: number;
  /** Height in px. */
  height?: number;
  /**
   * Accessible label for the SVG. Required — the sparkline is meaningless
   * without context for screen-readers.
   */
  label: string;
  /**
   * When true, treats a final-point higher than the first as "good"
   * (accent stroke). When false (default) the sparkline is monochrome so
   * the page can reserve `var(--accent-ai)` for the headline tile only.
   */
  accent?: boolean;
  /** Extra class names — escape hatch for layout. */
  className?: string;
  /**
   * Index of the first PARTIAL (not yet final) point — e.g. today's spend
   * while the day is still running. The solid stroke stops at the last
   * complete point (`partialFromIndex - 1`); from there to the end a second,
   * dashed path is drawn, so the line reads "final up to here, still moving
   * after". Omitted (or ≥ `points.length`) draws one solid path, as before;
   * `0` draws the whole series dashed.
   */
  partialFromIndex?: number;
  /**
   * Stroke colour override (any CSS colour, e.g. `currentColor` or a series
   * colour). Takes precedence over `accent`. Omitted keeps the default:
   * `var(--accent-ai)` when `accent`, otherwise `currentColor`.
   */
  color?: string;
}

/** Dash pattern of the partial (not yet final) segment, in px (dash, gap). */
export const SPARKLINE_PARTIAL_DASH = "2 2";

/**
 * Split a sparkline's point indices into the complete run and the partial run.
 *
 * The two runs share the boundary point (`partialFromIndex - 1`) so the dashed
 * path continues from where the solid one stops, with no visual gap.
 *
 * @param length - Number of points in the series.
 * @param partialFromIndex - Index of the first partial point, or undefined.
 * @returns `complete` = [start, end] inclusive index range of the solid path,
 *   or null when fewer than two points are complete; `partial` = the same for
 *   the dashed path, or null when nothing is partial.
 */
export function sparklineSegments(
  length: number,
  partialFromIndex: number | undefined,
): { complete: [number, number] | null; partial: [number, number] | null } {
  const last = length - 1;
  if (partialFromIndex === undefined || partialFromIndex > last) {
    return { complete: length >= 2 ? [0, last] : null, partial: null };
  }
  const from = Math.max(0, partialFromIndex);
  // The solid run ends on the last complete point; it needs two points to draw.
  const completeEnd = from - 1;
  const complete: [number, number] | null =
    completeEnd >= 1 ? [0, completeEnd] : null;
  // The dashed run starts on that same point (or at 0 when nothing is final).
  const partialStart = Math.max(0, completeEnd);
  const partial: [number, number] | null =
    last - partialStart >= 1 ? [partialStart, last] : null;
  return { complete, partial };
}

/**
 * Renders the sparkline. With `partialFromIndex`, the not-yet-final tail is a
 * second, dashed path (Helm visual rule: "Partial days render dashed"). The `ai-sparkline` class is keyed in
 * `globals.css` inside the `.ai-surfaces` block so the stroke colour and
 * width come from the design language even when no `accent` flag is set.
 */
export function Sparkline({
  points,
  width = 64,
  height = 20,
  label,
  accent = false,
  className,
  partialFromIndex,
  color,
}: SparklineProps): React.JSX.Element | null {
  if (points.length < 2) {
    return null;
  }
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min === 0 ? 1 : max - min;
  const stepX = width / (points.length - 1);
  /** SVG path through the points in the inclusive index range. */
  const pathFor = ([start, end]: [number, number]): string =>
    points
      .slice(start, end + 1)
      .map((v, offset) => {
        const x = (start + offset) * stepX;
        const y = height - ((v - min) / range) * (height - 2) - 1;
        return `${offset === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  const { complete, partial } = sparklineSegments(
    points.length,
    partialFromIndex,
  );
  const stroke = color ?? (accent ? "var(--accent-ai)" : "currentColor");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      data-testid="ai-sparkline"
      data-accent={accent ? "true" : "false"}
      className={cn("ai-sparkline shrink-0", className)}
    >
      {complete === null ? null : (
        <path
          d={pathFor(complete)}
          stroke={stroke}
          strokeWidth={1.25}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          data-segment="complete"
        />
      )}
      {partial === null ? null : (
        <path
          d={pathFor(partial)}
          stroke={stroke}
          strokeWidth={1.25}
          strokeDasharray={SPARKLINE_PARTIAL_DASH}
          fill="none"
          strokeLinejoin="round"
          data-segment="partial"
        />
      )}
    </svg>
  );
}
