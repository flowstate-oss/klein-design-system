/**
 * Pure helpers for the split-scale stacked bar.
 *
 * Split-scale renders a stacked bar as two vertically stacked panels — a
 * magnified "tail" panel above a clipped "dominant" panel — when the data
 * has a long tail that would otherwise collapse into an unreadable sliver.
 */

import type { AnalyticsSeries } from "./types.js";
import type { SplitScaleMode } from "./types.js";

const DOMINANCE_RATIO = 0.5; // top series must contribute >=50% of the largest column to count as dominant
const TAIL_RATIO = 0.05; // a series whose peak is <5% of the largest column is "tail"
const MIN_SERIES_FOR_SPLIT = 4;

/**
 * Build a `splitIndex` that partitions `series` into bottom (dominant) and
 * top (tail) panels, given they're already sorted by total desc on the server.
 *
 * Returns `null` when split-scale should NOT render (caller falls back to a
 * normal stacked bar).
 */
export function computeSplitIndex(
  series: AnalyticsSeries[],
  mode: SplitScaleMode,
): number | null {
  if (mode === "off") return null;
  if (series.length < MIN_SERIES_FOR_SPLIT) return null;

  const periods = collectPeriods(series);
  if (periods.length === 0) return null;

  const columnTotals = periods.map((p) =>
    series.reduce((sum, s) => sum + (lookupPeriod(s, p) ?? 0), 0),
  );
  const maxColumn = Math.max(...columnTotals);
  if (maxColumn <= 0) return null;

  const seriesPeaks = series.map((s) =>
    Math.max(0, ...s.dataPoints.map((dp) => dp.value)),
  );

  // Auto: require a clearly dominant top series. 'on' skips this guard.
  if (mode === "auto" && seriesPeaks[0] < maxColumn * DOMINANCE_RATIO) {
    return null;
  }

  const tailThreshold = maxColumn * TAIL_RATIO;
  const splitIndex = seriesPeaks.findIndex((peak) => peak < tailThreshold);

  // No tail found, or split would empty a panel.
  if (splitIndex <= 0 || splitIndex >= series.length) {
    if (mode === "on") {
      // Force a 50/50 split as a fallback so 'on' is never a no-op.
      return Math.max(1, Math.floor(series.length / 2));
    }
    return null;
  }

  return splitIndex;
}

/**
 * Compute the Y-axis max for the bottom (dominant) panel: the largest
 * cumulative total across the dominant series, padded ~5% so the bars don't
 * touch the axis-break edge.
 */
export function computeBottomMax(
  series: AnalyticsSeries[],
  splitIndex: number,
): number {
  const periods = collectPeriods(series);
  const dominant = series.slice(0, splitIndex);
  const max = Math.max(
    0,
    ...periods.map((p) =>
      dominant.reduce((sum, s) => sum + (lookupPeriod(s, p) ?? 0), 0),
    ),
  );
  return max * 1.05;
}

/**
 * Compute the Y-axis max for the top (tail) panel: the largest cumulative
 * tail-only total across all periods, padded so segment labels have headroom.
 */
export function computeTopMax(
  series: AnalyticsSeries[],
  splitIndex: number,
): number {
  const periods = collectPeriods(series);
  const tail = series.slice(splitIndex);
  const max = Math.max(
    0,
    ...periods.map((p) =>
      tail.reduce((sum, s) => sum + (lookupPeriod(s, p) ?? 0), 0),
    ),
  );
  // Round up to a "nice" number so axis ticks are readable.
  return niceCeil(max * 1.15);
}

function collectPeriods(series: AnalyticsSeries[]): string[] {
  const set = new Set<string>();
  for (const s of series) for (const dp of s.dataPoints) set.add(dp.period);
  return Array.from(set);
}

function lookupPeriod(s: AnalyticsSeries, period: string): number | null {
  const dp = s.dataPoints.find((d) => d.period === period);
  return dp ? dp.value : null;
}

/**
 * Round up to a "nice" number (1, 2, 5 × 10^n) for friendly axis ticks.
 * E.g. 7 → 10, 23 → 25, 47 → 50, 130 → 200.
 */
function niceCeil(n: number): number {
  if (n <= 0) return 0;
  const exp = Math.floor(Math.log10(n));
  const base = Math.pow(10, exp);
  const m = n / base;
  if (m <= 1) return 1 * base;
  if (m <= 2) return 2 * base;
  if (m <= 2.5) return 2.5 * base;
  if (m <= 5) return 5 * base;
  return 10 * base;
}
