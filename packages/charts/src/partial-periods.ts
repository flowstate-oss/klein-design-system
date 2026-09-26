/**
 * Partial periods on a time chart — the not-yet-final tail of the axis.
 *
 * Helm dashboards spec, §"Visual rules": "Lines stop at the last complete day.
 * Partial days render dashed." Today's spend is still arriving, so a line
 * drawn through it at full weight reads as a fall that hasn't happened. The
 * caller names the FIRST partial period (`partialFrom`, same format as the
 * chart's period labels); from there on:
 *   - a line segment that ENDS on a partial period is drawn dashed
 *     ({@link isPartialSegment}, wired to Chart.js `segment.borderDash`);
 *   - a bar on a partial period is drawn translucent with a dashed outline.
 *     Chart.js 4 fills a bar's border rather than stroking it, so `borderDash`
 *     does nothing on a bar; {@link createPartialBarOutlinePlugin} strokes the
 *     outline instead — a small inline plugin, no new package.
 *
 * Periods after the last one with data are not zero-filled for lines — the
 * chart's existing null gap already leaves them undrawn.
 *
 * @module partial-periods
 */

/** Dash pattern of a partial line segment or bar outline, in px (dash, gap). */
export const PARTIAL_DASH: readonly number[] = [4, 3];

/** Opacity of a partial bar's fill, so it reads as "still filling". */
export const PARTIAL_BAR_ALPHA = 0.35;

/** An ISO calendar period: `2026-09` or `2026-09-25`. */
const ISO_PERIOD = /^\d{4}-\d{2}(-\d{2})?$/;

/**
 * Find where the partial run starts on the chart's period axis.
 *
 * An exact label match wins. When `partialFrom` is not on the axis (e.g. no
 * series has a point for today yet) and both it and every label are ISO dates,
 * the partial run starts at the first label after it — ISO dates order as
 * strings. Otherwise nothing on screen is marked partial: a label format we
 * can't order is never guessed at.
 *
 * @param labels - The chart's period axis, in display order.
 * @param partialFrom - The first partial period, or undefined.
 * @returns The index of the first partial label, or `null` when no label on
 *   the axis is partial.
 */
export function partialIndexOf(
  labels: readonly string[],
  partialFrom: string | undefined,
): number | null {
  if (partialFrom === undefined) return null;
  const exact = labels.indexOf(partialFrom);
  if (exact !== -1) return exact;
  if (
    !ISO_PERIOD.test(partialFrom) ||
    !labels.every((label) => ISO_PERIOD.test(label))
  )
    return null;
  const after = labels.findIndex((label) => label > partialFrom);
  return after === -1 ? null : after;
}

/**
 * Whether the period at `index` is partial (not final yet).
 *
 * @param index - A period's index on the axis (a bar's data index).
 * @param partialIndex - From {@link partialIndexOf}; `null` means none.
 * @returns True from the first partial period to the end of the axis.
 */
export function isPartialPeriod(
  index: number,
  partialIndex: number | null,
): boolean {
  return partialIndex !== null && index >= partialIndex;
}

/**
 * Whether a line segment is drawn dashed: it is when it ENDS on a partial
 * period, so the stretch from the last complete point into the first partial
 * point is already dashed.
 *
 * @param p1DataIndex - Data index of the segment's end point (Chart.js
 *   `ScriptableLineSegmentContext.p1DataIndex`).
 * @param partialIndex - From {@link partialIndexOf}; `null` means none.
 * @returns True when the segment should be dashed.
 */
export function isPartialSegment(
  p1DataIndex: number,
  partialIndex: number | null,
): boolean {
  return isPartialPeriod(p1DataIndex, partialIndex);
}

/** A bar element's resolved geometry, in chart pixels (vertical bars). */
export interface BarGeometry {
  /** Horizontal centre. */
  x: number;
  /** The value end of the bar. */
  y: number;
  /** The base end of the bar. */
  base: number;
  /** Bar width. */
  width: number;
}

/** A rectangle in chart pixels, ready for `strokeRect`. */
export interface OutlineRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * The rectangle to outline for one vertical bar.
 *
 * @param bar - The bar's resolved geometry.
 * @returns Its outline, or `null` for a zero-height bar (nothing to outline).
 */
export function barOutlineRect(bar: BarGeometry): OutlineRect | null {
  const height = Math.abs(bar.base - bar.y);
  if (height === 0 || bar.width <= 0) return null;
  return {
    left: bar.x - bar.width / 2,
    top: Math.min(bar.y, bar.base),
    width: bar.width,
    height,
  };
}

/** The slice of a Chart.js bar element the outline plugin reads. */
interface BarElementLike {
  getProps: (props: ["x", "y", "base", "width"], final: boolean) => BarGeometry;
}

/** The slice of a Chart.js chart the outline plugin reads. */
interface ChartLike {
  ctx: Pick<
    CanvasRenderingContext2D,
    | "save"
    | "restore"
    | "setLineDash"
    | "strokeRect"
    | "lineWidth"
    | "strokeStyle"
  >;
  data: { datasets: ReadonlyArray<{ borderColor?: unknown; type?: unknown }> };
  isDatasetVisible: (datasetIndex: number) => boolean;
  getDatasetMeta: (datasetIndex: number) => { data: readonly BarElementLike[] };
}

/**
 * Build the Chart.js plugin that strokes a dashed outline round every bar on a
 * partial period. Line datasets drawn over the bars (average, target line) are
 * skipped.
 *
 * Returned as a factory because the partial index changes with the period
 * window and Chart.js compares plugin objects by identity across renders.
 *
 * @param partialIndex - From {@link partialIndexOf}.
 * @returns A Chart.js plugin.
 */
export function createPartialBarOutlinePlugin(partialIndex: number): {
  id: string;
  afterDatasetsDraw: (chart: ChartLike) => void;
} {
  return {
    id: "partialBarOutline",
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      ctx.save();
      ctx.setLineDash([...PARTIAL_DASH]);
      ctx.lineWidth = 1;
      chart.data.datasets.forEach((dataset, datasetIndex) => {
        if (dataset.type === "line" || !chart.isDatasetVisible(datasetIndex))
          return;
        if (typeof dataset.borderColor !== "string") return;
        ctx.strokeStyle = dataset.borderColor;
        chart.getDatasetMeta(datasetIndex).data.forEach((element, index) => {
          if (!isPartialPeriod(index, partialIndex)) return;
          const rect = barOutlineRect(
            element.getProps(["x", "y", "base", "width"], true),
          );
          if (rect === null) return;
          ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
        });
      });
      ctx.restore();
    },
  };
}
