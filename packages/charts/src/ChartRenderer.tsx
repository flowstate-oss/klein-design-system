"use client";

import { useMemo } from "react";
import type {
  LegendItem,
  ChartData,
  ScriptableLineSegmentContext,
} from "chart.js";
import type { Context as DatalabelsContext } from "chartjs-plugin-datalabels";
import {
  BarChart,
  LineChart,
  PieChart,
  DoughnutChart,
  ScatterChart,
} from "./chart-base.js";
import { useMeasure } from "@uidotdev/usehooks";
import type {
  ChartType,
  SplitScaleMode,
  StackedBarLabelFormat,
  AnalyticsMetricType,
} from "./types.js";
import { METRIC_LABELS } from "./types.js";
import type { AnalyticsDataPoint, AnalyticsSeries } from "./types.js";
import { formatMoneyK } from "./format.js";
import { comparePeriods } from "./period-order.js";
import {
  CHART_COLORS,
  CHART_COLORS_DARK,
  resolveColor,
  resolveSeriesColor,
} from "./chart-config.js";
import { useChartTheme as useTheme } from "./theme.js";
import { SplitScaleStackedBar } from "./SplitScaleStackedBar.js";
import { computeSplitIndex } from "./split-scale.js";
import { createSpikeHighlightPlugin } from "./spike-highlight.js";
import {
  PARTIAL_BAR_ALPHA,
  PARTIAL_DASH,
  createPartialBarOutlinePlugin,
  isPartialPeriod,
  isPartialSegment,
  partialIndexOf,
} from "./partial-periods.js";

// Map legacy palette or use new one
function getSeriesColor(
  index: number,
  isDark: boolean,
  series?: AnalyticsSeries,
): string {
  return resolveSeriesColor(series?.color, isDark, index);
}

export interface ChartRendererProps {
  chartType: ChartType;
  series: AnalyticsSeries[];
  currencyCode: string;
  metric: AnalyticsMetricType;
  minimal?: boolean;
  showAverage?: boolean;
  stackedBarLabel?: StackedBarLabelFormat;
  splitScale?: SplitScaleMode;
  /** When false, the built-in Chart.js legend is hidden (a caller renders its own). */
  showLegend?: boolean;
  /**
   * Category indices to paint a translucent red band behind (line charts only)
   * — the agent-insights spend trendline uses this to show WHERE
   * `detectSpendAnomalies` flagged a spike. Empty/omitted draws nothing.
   */
  highlightIndices?: readonly number[];
  /**
   * Override how values read on the axis + in tooltips when the panel plots a
   * ratio of `metric` rather than `metric` itself (see {@link ChartValueFormat}).
   */
  valueFormat?: ChartValueFormat;
  /**
   * A flat target line (e.g. the month's budget) drawn across every period as
   * a dashed line. Drawn for `stackedBar`, `groupedBar`, `line` and `multiLine`;
   * ignored for other chart types. Never stacked into the bars, excluded from
   * the built-in legend (callers with their own legend add an entry), and it
   * turns split-scale off — one flat line across two independently-scaled
   * panels would read as two different targets.
   */
  referenceLine?: ChartReferenceLine;
  /**
   * When true, every series is drawn as a running total over the period axis
   * (month-to-date spend rather than spend per day). Applies to the time-axis
   * charts (`stackedBar`, `groupedBar`, `stackedArea`, `line`, `multiLine`);
   * ignored for categorical/total charts where a running sum means nothing.
   * Tooltips and labels show the running total. The input is not mutated.
   */
  cumulative?: boolean;
  /**
   * The FIRST period that is not final yet (e.g. today, while its spend is
   * still arriving), in the same format as `dataPoints[].period`. From it to
   * the end of the axis: `line`/`multiLine` segments ending on a partial
   * period are dashed; `stackedBar`/`groupedBar` bars are translucent with a
   * dashed outline (and split-scale is turned off so the partial state stays
   * visible). Omitted, or not on the axis, draws everything as final. See
   * `partial-periods.ts`.
   */
  partialFrom?: string;
  /**
   * The y-axis title on the time-axis charts, already translated. Omitted, it
   * is the metric's name (`METRIC_LABELS`) — which for a count the analytics
   * metrics don't name (e.g. requests raised) would be wrong. Named edit, H4.
   */
  axisTitle?: string;
}

/** A flat horizontal target line — see {@link ChartRendererProps.referenceLine}. */
export interface ChartReferenceLine {
  /** Where the line sits on the value axis, in the chart's metric units. */
  value: number;
  /** Already-translated name of the line, shown in tooltips (e.g. "Budget"). */
  label: string;
}

/** Chart types that draw {@link ChartRendererProps.referenceLine}. */
const REFERENCE_LINE_CHARTS: ReadonlySet<ChartType> = new Set<ChartType>([
  "stackedBar",
  "groupedBar",
  "line",
  "multiLine",
]);

/** Chart types with a period axis, where {@link ChartRendererProps.cumulative} applies. */
const CUMULATIVE_CHARTS: ReadonlySet<ChartType> = new Set<ChartType>([
  "stackedBar",
  "groupedBar",
  "stackedArea",
  "line",
  "multiLine",
]);

/** Chart types that draw {@link ChartRendererProps.partialFrom}. */
const PARTIAL_LINE_CHARTS: ReadonlySet<ChartType> = new Set<ChartType>([
  "line",
  "multiLine",
]);
const PARTIAL_BAR_CHARTS: ReadonlySet<ChartType> = new Set<ChartType>([
  "stackedBar",
  "groupedBar",
]);

/** Stroke + label colour of the `showAverage` overlay (orange-600). */
const AVERAGE_LINE_COLOR = "#ea580c";

/** Dash pattern of the reference line, in pixels (dash, gap). */
export const REFERENCE_LINE_DASH: readonly number[] = [6, 4];

/** Stack id that keeps the reference line out of the stacked bars' sum. */
export const REFERENCE_LINE_STACK = "_ref";

/**
 * Turn each series into a running total over the sorted period axis.
 *
 * A period the series has no point for adds 0 to the running sum. Periods
 * BEFORE the series' first real point are left out, so a line chart still
 * starts where the data starts (a leading gap, not a confident zero); from the
 * first real point onward every period carries the running total forward.
 * Bar charts zero-fill the omitted leading periods, which is also the running
 * total there. The input series and their points are not mutated.
 *
 * @param series - The series to accumulate (any period order).
 * @param labels - The chart's period axis, already sorted (see `getLabels`).
 * @returns New series whose points are running totals, one per period from the
 *   series' first real point to the end of the axis.
 */
export function toCumulativeSeries(
  series: readonly AnalyticsSeries[],
  labels: readonly string[],
): AnalyticsSeries[] {
  return series.map((s) => {
    // Same period → value lookup the chart itself uses (last point wins).
    const valueByPeriod = new Map(
      s.dataPoints.map((dp) => [dp.period, dp.value]),
    );
    const dataPoints: AnalyticsDataPoint[] = [];
    let running = 0;
    let started = false;
    for (const period of labels) {
      const value = valueByPeriod.get(period);
      if (value !== undefined) started = true;
      if (!started) continue;
      running += value ?? 0;
      dataPoints.push({ period, value: running });
    }
    return { ...s, dataPoints };
  });
}

/** Datalabel config for a horizontal line's single end-of-line label. */
interface EndLabelDatalabels {
  display: (ctx: DatalabelsContext) => boolean;
  anchor: "end";
  align: "right";
  color: string;
  font: { size: number; weight: "bold"; family: string };
  formatter: () => string;
}

/**
 * Datalabel config that draws nothing on the line. The named `segment` and
 * `total` labels are the stacked bar's multi-label config; a `null` entry
 * removes a named label for this one dataset (chartjs-plugin-datalabels), so
 * the bars' segment/total labels never paint onto the line.
 */
interface NoDatalabels {
  display: false;
  labels: { segment: null; total: null };
}

/** An extra Chart.js line dataset drawing a flat horizontal line. */
export interface HorizontalLineDataset {
  label: string;
  data: number[];
  type: "line";
  borderColor: string;
  borderWidth: number;
  borderDash?: number[];
  pointRadius: number;
  fill: false;
  stack?: string;
  datalabels: EndLabelDatalabels | NoDatalabels;
}

/** Inputs to {@link buildHorizontalLineDataset}. */
export interface HorizontalLineOptions {
  /** Height of the line on the value axis. */
  value: number;
  /** Dataset label (legend + tooltip). */
  label: string;
  /** Number of periods on the axis — the line has one point per period. */
  labelCount: number;
  /** Stroke colour. */
  color: string;
  /** Stroke width in pixels. */
  borderWidth: number;
  /** Dash pattern; omitted leaves the dataset's key out entirely. */
  borderDash?: number[];
  /** Stack id, so a line on a stacked bar chart isn't summed into the bars. */
  stack?: string;
  /** Text drawn beside the line's last point; omitted draws no label. */
  endLabel?: string;
}

/**
 * Build the extra line dataset for a flat horizontal line across every
 * period — shared by the average overlay (`showAverage`) and the target line
 * (`referenceLine`) so both are drawn the same way.
 *
 * @param options - See {@link HorizontalLineOptions}.
 * @returns A Chart.js `line` dataset with no points and no fill.
 */
export function buildHorizontalLineDataset(
  options: HorizontalLineOptions,
): HorizontalLineDataset {
  const {
    value,
    label,
    labelCount,
    color,
    borderWidth,
    borderDash,
    stack,
    endLabel,
  } = options;
  const lastIndex = labelCount - 1;
  const datalabels: EndLabelDatalabels | NoDatalabels =
    endLabel === undefined
      ? { display: false, labels: { segment: null, total: null } }
      : {
          display: (ctx: DatalabelsContext) => ctx.dataIndex === lastIndex,
          anchor: "end",
          align: "right",
          color,
          font: { size: 11, weight: "bold", family: "var(--font-mono)" },
          formatter: () => endLabel,
        };
  return {
    label,
    data: Array.from({ length: labelCount }, () => value),
    type: "line",
    borderColor: color,
    borderWidth,
    ...(borderDash === undefined ? {} : { borderDash }),
    pointRadius: 0,
    fill: false,
    ...(stack === undefined ? {} : { stack }),
    datalabels,
  };
}

/**
 * Build the dashed target-line dataset for {@link ChartRendererProps.referenceLine}.
 *
 * @param referenceLine - Value + translated label of the line.
 * @param labelCount - Number of periods on the axis.
 * @param color - Stroke colour (the theme's destructive colour at the call site).
 * @param stacked - True on a stacked bar chart: the line gets its own stack so
 *   its value is never added to the bars.
 * @returns The dataset to append after the series datasets.
 */
export function buildReferenceLineDataset(
  referenceLine: ChartReferenceLine,
  labelCount: number,
  color: string,
  stacked: boolean,
): HorizontalLineDataset {
  return buildHorizontalLineDataset({
    value: referenceLine.value,
    label: referenceLine.label,
    labelCount,
    color,
    borderWidth: 1.5,
    borderDash: [...REFERENCE_LINE_DASH],
    stack: stacked ? REFERENCE_LINE_STACK : undefined,
  });
}

function parseColorToRgb(
  color: string,
): { r: number; g: number; b: number } | null {
  if (!color) return null;
  const hex = color.trim();
  if (hex.startsWith("#")) {
    const normalized =
      hex.length === 4
        ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
        : hex;
    if (normalized.length !== 7) return null;
    const r = parseInt(normalized.slice(1, 3), 16);
    const g = parseInt(normalized.slice(3, 5), 16);
    const b = parseInt(normalized.slice(5, 7), 16);
    if ([r, g, b].some(Number.isNaN)) return null;
    return { r, g, b };
  }
  const match = hex.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!match) return null;
  return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]) };
}

/**
 * Per-period fills for one bar series: the series colour on final periods,
 * the same colour at {@link PARTIAL_BAR_ALPHA} on partial ones.
 *
 * @param color - The series colour (hex or `rgb(…)`).
 * @param labelCount - Number of periods on the axis.
 * @param partialIndex - Index of the first partial period.
 * @returns One fill per period. A colour we can't parse stays solid — the
 *   dashed outline still marks the partial bars.
 */
export function partialBarFills(
  color: string,
  labelCount: number,
  partialIndex: number,
): string[] {
  const rgb = parseColorToRgb(color);
  const faded =
    rgb === null
      ? color
      : `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${PARTIAL_BAR_ALPHA})`;
  return Array.from({ length: labelCount }, (_, i) =>
    isPartialPeriod(i, partialIndex) ? faded : color,
  );
}

// WCAG relative luminance: pick readable text color per segment fill.
function pickContrastingTextColor(bg: string | undefined): string {
  const rgb = bg ? parseColorToRgb(bg) : null;
  if (!rgb) return "#ffffff";
  const toLinear = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const luminance =
    0.2126 * toLinear(rgb.r) +
    0.7152 * toLinear(rgb.g) +
    0.0722 * toLinear(rgb.b);
  return luminance > 0.55 ? "#1c1917" : "#ffffff";
}

// ... Data transformation helpers ...

/**
 * The chart's period axis: every period any series has a point for, sorted
 * with `comparePeriods` (labels it can't order keep their first-seen order).
 * Exported so a wrapper can reason about the same axis the chart draws.
 *
 * @param series - The series on the chart.
 * @returns The distinct periods, in axis order.
 */
export function getLabels(series: readonly AnalyticsSeries[]): string[] {
  const periodSet = new Set<string>();
  for (const s of series) {
    for (const dp of s.dataPoints) {
      periodSet.add(dp.period);
    }
  }
  return Array.from(periodSet).sort(comparePeriods);
}

/**
 * Chart types drawn as a continuous line, where a period with no data point
 * must break the line rather than plot at zero. Bar/area stacking keeps its
 * zero-fill — see the `missingValue` note in `chartData`.
 */
const LINE_FAMILY_CHARTS: ReadonlySet<string> = new Set(["line", "multiLine"]);

// Currency-axis metrics (rendered with the org currency); the rest are counts
// or 0–1/decimal scores. Kept here so axis + tooltip formatting stay in step.
const CURRENCY_METRICS: ReadonlySet<AnalyticsMetricType> = new Set([
  "COST",
  "AI_COST",
  "COST_PER_PR",
  // Helm's one AI spend figure (H9's engine source): money, in the reporting currency.
  "AI_SPEND",
  // Helm's total cost (seat cost + metered, H6): money too. NAMED EDIT (H7, Tools and contracts, 2026-09-26).
  "AI_TOTAL_COST",
]);
const DECIMAL_METRICS: ReadonlySet<AnalyticsMetricType> = new Set([
  "FTE",
  "AI_FRUSTRATION",
  "AI_INPUT_QUALITY_AVG",
]);

/**
 * Presentation-only override of how a value reads on the axis and in tooltips.
 *
 * `percent` exists because some panels plot a RATIO of a metric rather than the
 * metric itself (e.g. attribution coverage = attributed ÷ reported spend).
 * Those are not new metrics — adding them to `AnalyticsMetricSchema` would put
 * a meaningless option in the report builder's metric picker — so the value
 * FORMAT is overridden instead, and the underlying metric stays honest.
 */
export type ChartValueFormat = "percent";

function formatValue(
  value: number,
  metric: AnalyticsMetricType,
  currencyCode: string,
  valueFormat?: ChartValueFormat,
): string {
  if (valueFormat === "percent") {
    return `${Math.round(value)}%`;
  }
  if (CURRENCY_METRICS.has(metric)) {
    return formatMoneyK(value, 1, currencyCode);
  }
  if (DECIMAL_METRICS.has(metric)) {
    return value.toFixed(1);
  }
  // Counts: HEADCOUNT, AI_SESSIONS, PR_COUNT, LINES_CHANGED.
  return Math.round(value).toString();
}

function getYAxisLabel(
  metric: AnalyticsMetricType,
  valueFormat?: ChartValueFormat,
): string {
  return valueFormat === "percent" ? "%" : METRIC_LABELS[metric];
}

export function ChartRenderer({
  chartType,
  series,
  currencyCode,
  metric,
  minimal,
  showAverage,
  stackedBarLabel = "percent",
  splitScale = "auto",
  showLegend = true,
  highlightIndices,
  valueFormat,
  referenceLine,
  cumulative = false,
  partialFrom,
  axisTitle,
}: ChartRendererProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [ref, { width }] = useMeasure<HTMLDivElement>();

  const applyCumulative = cumulative && CUMULATIVE_CHARTS.has(chartType);
  const processedSeries = useMemo(
    () =>
      applyCumulative ? toCumulativeSeries(series, getLabels(series)) : series,
    [applyCumulative, series],
  );

  // Only drawn where it means something, and never at a non-number height.
  const activeReferenceLine =
    referenceLine !== undefined &&
    REFERENCE_LINE_CHARTS.has(chartType) &&
    Number.isFinite(referenceLine.value)
      ? referenceLine
      : null;
  const hasReferenceLine = activeReferenceLine !== null;
  // The theme's destructive colour (a budget line is the "don't cross" mark).
  // Resolved through the DOM on each render (the value follows the theme), so
  // only when a line is actually drawn.
  const referenceLineColor = hasReferenceLine
    ? resolveColor("var(--color-destructive)")
    : "";

  // Spike bands are an inline Chart.js plugin (no annotation package here).
  // Rebuilt whenever the flagged indices or the palette change — Chart.js
  // compares plugin objects by identity across renders.
  const highlightKey = (highlightIndices ?? []).join(",");
  const spikePlugins = useMemo(
    () =>
      highlightKey.length === 0
        ? []
        : [
            createSpikeHighlightPlugin(
              highlightKey.split(",").map(Number),
              isDark,
            ),
          ],
    [highlightKey, isDark],
  );

  const labels = useMemo(() => getLabels(processedSeries), [processedSeries]);

  // Where the not-yet-final tail starts, on the chart types that draw it.
  const drawsPartial =
    PARTIAL_LINE_CHARTS.has(chartType) || PARTIAL_BAR_CHARTS.has(chartType);
  const partialIndex = drawsPartial
    ? partialIndexOf(labels, partialFrom)
    : null;
  const partialBarPlugins = useMemo(
    () =>
      partialIndex === null
        ? []
        : [createPartialBarOutlinePlugin(partialIndex)],
    [partialIndex],
  );

  const chartData = useMemo(() => {
    // A period a series has no point for is UNKNOWN, not zero — and on a line
    // that distinction is the whole story. Zero-filling drew an org's actual
    // AI spend as a confident £0 across months we had no bill for, and pulled
    // the forecast line down to the axis for every month already past, so the
    // two lines crossed the chart at zero and met in a spike. Chart.js renders
    // `null` as a gap, which is what "we don't know" should look like.
    // Bars still fill with 0: a missing category genuinely stacks as nothing.
    const missingValue = LINE_FAMILY_CHARTS.has(chartType) ? null : 0;
    return {
      labels: labels,
      datasets: processedSeries.map((s, i) => {
        // Map data points to labels (ensure alignment)
        const dataMap = new Map(
          s.dataPoints.map((dp) => [dp.period, dp.value]),
        );
        const data = labels.map((label) => dataMap.get(label) ?? missingValue);
        const color = getSeriesColor(i, isDark, s);
        const base = {
          label: s.label,
          data: data,
          backgroundColor: color,
          borderColor: color,
          borderWidth: 1, // Default
        };
        if (partialIndex === null) return base;
        if (PARTIAL_LINE_CHARTS.has(chartType)) {
          // A segment ending on a partial period is dashed; the partial point
          // itself is still drawn.
          return {
            ...base,
            segment: {
              borderDash: (ctx: ScriptableLineSegmentContext) =>
                isPartialSegment(ctx.p1DataIndex, partialIndex)
                  ? [...PARTIAL_DASH]
                  : undefined,
            },
          };
        }
        // Bars: translucent fill, and no filled border (Chart.js can't dash
        // it) — the outline plugin strokes a dashed one instead.
        return {
          ...base,
          backgroundColor: partialBarFills(color, labels.length, partialIndex),
          borderWidth: labels.map((_, idx) =>
            isPartialPeriod(idx, partialIndex) ? 0 : 1,
          ),
        };
      }),
    };
  }, [processedSeries, labels, isDark, chartType, partialIndex]);

  // Specific data transforms
  const pieData = useMemo(() => {
    // Sum per series
    const data = processedSeries.map((s) =>
      s.dataPoints.reduce((sum, dp) => sum + dp.value, 0),
    );
    return {
      labels: processedSeries.map((s) => s.label),
      datasets: [
        {
          data,
          backgroundColor: processedSeries.map((s, i) =>
            getSeriesColor(i, isDark, s),
          ),
          borderWidth: 0,
        },
      ],
    };
  }, [processedSeries, isDark]);

  const waterfallData = useMemo(() => {
    if (!processedSeries.length) return { labels: [], datasets: [] };
    // Waterfall logic: derived from first series
    const s = processedSeries[0];
    const dataPoints = s.dataPoints.sort((a, b) =>
      comparePeriods(a.period, b.period),
    );

    let runningTotal = 0;
    const floatingData: number[][] = [];
    const backgroundColors: string[] = [];
    const labels: string[] = [];

    dataPoints.forEach((dp) => {
      const delta = dp.value - runningTotal;
      const start = runningTotal;
      const end = dp.value;
      floatingData.push([start, end]);
      backgroundColors.push(
        delta >= 0
          ? resolveColor("var(--color-chart-2)")
          : resolveColor("var(--color-destructive)"),
      );
      labels.push(dp.period);
      runningTotal = dp.value;
    });

    // Total bar
    floatingData.push([0, runningTotal]);
    backgroundColors.push(resolveColor("var(--color-chart-1)"));
    labels.push("Total");

    return {
      labels,
      datasets: [
        {
          label: s.label,
          data: floatingData,
          backgroundColor: backgroundColors,
          barPercentage: 0.9,
        },
      ],
    };
  }, [processedSeries]);

  const scatterData = useMemo(() => {
    // Scatter: x=index, y=sum, z=count (bubble)
    return {
      datasets: processedSeries.map((s, i) => {
        const sum = s.dataPoints.reduce((acc, dp) => acc + dp.value, 0);
        const count = s.dataPoints.length;
        return {
          label: s.label,
          data: [{ x: i, y: sum, r: count * 2 }], // r is radius in pixels
          backgroundColor: getSeriesColor(i, isDark, s),
        };
      }),
    };
  }, [processedSeries, isDark]);

  // Shared Options
  const commonOptions = useMemo(
    () => ({
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: showLegend && !minimal && (width || 0) > 350,
          position: "bottom" as const,
          // Dense, point-style keys: small dots + tight padding so more series
          // fit per row in compact dashboard panels.
          labels: {
            usePointStyle: true,
            pointStyle: "circle" as const,
            boxWidth: 6,
            boxHeight: 6,
            padding: 8,
            font: { size: 10 },
            // The reference line is always the LAST dataset of the branches that
            // draw it; keep it out of the built-in legend. Absent otherwise, so
            // charts without a reference line get exactly the options they had.
            ...(hasReferenceLine
              ? {
                  filter: (item: LegendItem, data: ChartData) =>
                    item.datasetIndex !== data.datasets.length - 1,
                }
              : {}),
          },
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              let label = context.dataset.label || "";
              if (
                context.raw &&
                typeof context.raw === "object" &&
                context.raw.y !== undefined
              ) {
                // Scatter
                return `${label}: ${formatValue(context.raw.y, metric, currencyCode)}`;
              }
              // Waterfall (floating bar)
              if (Array.isArray(context.raw)) {
                const val = context.raw[1] - context.raw[0];
                // Wait, raw is [start, end]. Value is end. Delta is end-start?
                // Logic depends on waterfall implementation.
                // Here [start, end]. Actual value is end.
                return `${context.label}: ${formatValue(context.raw[1], metric, currencyCode, valueFormat)}`;
              }
              return `${label}: ${formatValue(context.raw, metric, currencyCode, valueFormat)}`;
            },
          },
        },
      },
      scales: {
        x: {
          display: !minimal,
          grid: { display: false },
          ticks: { font: { size: 11 } },
        },
        y: {
          display: !minimal,
          ticks: {
            font: { size: 11 },
            // A count is labelled whole (formatValue rounds it), so its ticks
            // must be whole too — a max of 1 otherwise draws "0 0 0 1 1 1"
            // (named edit, H4: requests per day).
            ...(CURRENCY_METRICS.has(metric) ||
            DECIMAL_METRICS.has(metric) ||
            valueFormat === "percent"
              ? {}
              : { precision: 0 }),
            callback: (value: any) =>
              formatValue(value, metric, currencyCode, valueFormat),
          },
          title: {
            display: !minimal,
            text: axisTitle ?? getYAxisLabel(metric, valueFormat),
            font: { size: 10 },
          },
        },
      },
    }),
    [
      metric,
      currencyCode,
      minimal,
      width,
      showLegend,
      valueFormat,
      hasReferenceLine,
      axisTitle,
    ],
  );

  /** The target-line dataset for this render, or none. */
  const referenceDatasets = (stacked: boolean): HorizontalLineDataset[] =>
    activeReferenceLine === null
      ? []
      : [
          buildReferenceLineDataset(
            activeReferenceLine,
            labels.length,
            referenceLineColor,
            stacked,
          ),
        ];

  if (processedSeries.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 p-4 text-center">
        <p className="text-muted-foreground text-sm font-medium">
          No data available
        </p>
        <p className="text-muted-foreground text-xs">
          Try adjusting the date range or filters
        </p>
      </div>
    );
  }

  // Renders
  if (chartType === "pie" || chartType === "donut") {
    const pieTotal = pieData.datasets[0].data.reduce(
      (a: number, b: number) => a + b,
      0,
    );
    const pieOptions = {
      ...commonOptions,
      plugins: {
        ...commonOptions.plugins,
        datalabels: minimal
          ? { display: false }
          : {
              display: (ctx: any) => {
                const value = ctx.dataset.data[ctx.dataIndex] ?? 0;
                return Math.abs(value / (pieTotal || 1)) >= 0.04;
              },
              color: "#fff",
              font: {
                size: 11,
                weight: "bold" as const,
                family: "var(--font-mono)",
              },
              formatter: (value: number) => {
                const pct = Math.round((value / (pieTotal || 1)) * 100);
                return `${formatValue(value, metric, currencyCode)}\n(${pct}%)`;
              },
            },
      },
    };

    if (chartType === "pie") {
      return (
        <div ref={ref} className="h-full w-full">
          <PieChart
            key={chartType}
            data={pieData}
            options={pieOptions}
            height="100%"
          />
        </div>
      );
    }

    return (
      <div ref={ref} className="relative h-full w-full">
        <DoughnutChart
          key={chartType}
          data={pieData}
          options={pieOptions}
          height="100%"
        />
        {!minimal && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-8">
            <div className="text-lg font-semibold">
              {formatValue(pieTotal, metric, currencyCode)}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (chartType === "stackedArea") {
    const options = {
      ...commonOptions,
      scales: {
        ...commonOptions.scales,
        y: { ...commonOptions.scales.y, stacked: true },
        x: { ...commonOptions.scales.x, stacked: true }, // Usually X not stacked for area, but points match
      },
      elements: {
        line: { fill: true },
      },
    };
    // Ensure datasets have fill: true
    const data = {
      ...chartData,
      datasets: chartData.datasets.map((ds) => ({ ...ds, fill: true })),
    };
    return (
      <div ref={ref} className="h-full w-full">
        <LineChart
          key={chartType}
          data={data}
          options={options}
          height="100%"
        />
      </div>
    );
  }

  if (chartType === "line" || chartType === "multiLine") {
    const options = {
      ...commonOptions,
      elements: {
        line: { tension: 0 },
      },
      scales: {
        ...commonOptions.scales,
        x: {
          ...commonOptions.scales.x,
          // Keep time-axis labels horizontal (auto-skipping overlaps) so the
          // x-axis stays a single row — matching the bar charts' label height so
          // their plot baselines align when shown side by side.
          ticks: {
            ...commonOptions.scales.x.ticks,
            maxRotation: 0,
            autoSkip: true,
          },
        },
      },
    };
    const lineData = hasReferenceLine
      ? {
          ...chartData,
          datasets: [...chartData.datasets, ...referenceDatasets(false)],
        }
      : chartData;
    return (
      <div ref={ref} className="h-full w-full">
        <LineChart
          key={chartType}
          data={lineData}
          options={options}
          plugins={spikePlugins}
          height="100%"
        />
      </div>
    );
  }

  if (chartType === "stackedBar") {
    // Split-scale: two-panel render for long-tail data. Skipped when the
    // user wants an average overlay or a target line (a single horizontal
    // line across two independently-scaled panels would be misleading).
    // Also skipped with a partial period on the axis: the split panels don't
    // draw the partial state, and "not final yet" must stay visible.
    const splitIndex =
      !showAverage && !hasReferenceLine && partialIndex === null
        ? computeSplitIndex(processedSeries, splitScale)
        : null;
    if (splitIndex != null) {
      return (
        <div ref={ref} className="h-full w-full">
          <SplitScaleStackedBar
            series={processedSeries}
            splitIndex={splitIndex}
            metric={metric}
            currencyCode={currencyCode}
            minimal={minimal}
            stackedBarLabel={stackedBarLabel}
            formatValue={formatValue}
            pickContrastingTextColor={pickContrastingTextColor}
          />
        </div>
      );
    }

    const columnTotals = labels.map((_, colIdx) =>
      chartData.datasets.reduce((sum, ds) => sum + (ds.data[colIdx] ?? 0), 0),
    );

    const barWidth = (width || 600) / Math.max(labels.length, 1);
    // Value strings ("£42.1k") need ~1.5x the horizontal room of "%" labels.
    const minBarWidthForSegmentLabel = stackedBarLabel === "value" ? 55 : 35;
    const minSegmentShare = stackedBarLabel === "value" ? 0.1 : 0.08;
    const showSegmentLabels =
      stackedBarLabel !== "none" && barWidth > minBarWidthForSegmentLabel;

    const stackedBarOptions = {
      ...commonOptions,
      // Reserve headroom above the plot so the bar-total label on the tallest
      // column isn't clipped at the panel's top edge.
      layout: { padding: { top: 18 } },
      scales: {
        x: {
          ...commonOptions.scales.x,
          stacked: true,
          categoryPercentage: 0.95,
          barPercentage: 1.0,
        },
        y: { ...commonOptions.scales.y, stacked: true },
      },
      plugins: {
        ...commonOptions.plugins,
        datalabels: minimal
          ? { display: false }
          : {
              labels: {
                segment: {
                  display: (ctx: any) => {
                    if (!showSegmentLabels) return false;
                    const value = ctx.dataset.data[ctx.dataIndex] ?? 0;
                    const total = columnTotals[ctx.dataIndex] || 1;
                    return Math.abs(value / total) >= minSegmentShare;
                  },
                  color: (ctx: any) => {
                    const bg = ctx.dataset.backgroundColor;
                    const resolved = Array.isArray(bg) ? bg[ctx.dataIndex] : bg;
                    return pickContrastingTextColor(resolved);
                  },
                  font: {
                    size: 10,
                    weight: "bold" as const,
                    family: "var(--font-mono)",
                  },
                  anchor: "center" as const,
                  align: "center" as const,
                  formatter: (value: number, ctx: any) => {
                    if (stackedBarLabel === "value") {
                      return formatValue(value, metric, currencyCode);
                    }
                    const total = columnTotals[ctx.dataIndex] || 1;
                    return `${Math.round((value / total) * 100)}%`;
                  },
                },
                total: {
                  // Only on the top dataset, and never on an empty (£0) column —
                  // a zero total renders at the baseline and collides with the legend.
                  display: (ctx: any) =>
                    ctx.datasetIndex === chartData.datasets.length - 1 &&
                    (columnTotals[ctx.dataIndex] ?? 0) > 0,
                  anchor: "end" as const,
                  align: "end" as const,
                  color: isDark ? "#e7e5e4" : "#44403c",
                  font: {
                    size: 11,
                    weight: "bold" as const,
                    family: "var(--font-mono)",
                  },
                  formatter: (_value: number, ctx: any) =>
                    formatValue(
                      columnTotals[ctx.dataIndex] ?? 0,
                      metric,
                      currencyCode,
                    ),
                },
              },
            },
      },
    };

    const extraDatasets: HorizontalLineDataset[] = [];

    if (showAverage && !minimal) {
      const avg =
        columnTotals.length > 0
          ? columnTotals.reduce((a, b) => a + b, 0) / columnTotals.length
          : 0;
      const avgText = `Ø ${formatValue(avg, metric, currencyCode)}`;
      extraDatasets.push(
        buildHorizontalLineDataset({
          value: avg,
          label: avgText,
          labelCount: labels.length,
          color: AVERAGE_LINE_COLOR,
          borderWidth: 2,
          stack: "_avg",
          endLabel: avgText,
        }),
      );
    }

    // Target line last, so the legend filter can find it.
    extraDatasets.push(...referenceDatasets(true));

    const stackedData = {
      ...chartData,
      datasets: [...chartData.datasets, ...extraDatasets],
    };

    return (
      <div ref={ref} className="h-full w-full">
        <BarChart
          key={chartType}
          data={stackedData}
          options={stackedBarOptions}
          plugins={partialBarPlugins}
          height="100%"
        />
      </div>
    );
  }

  if (chartType === "horizontalBar") {
    // Categorical view: one bar per series, sorted highest to lowest.
    // If DATE is included in dimensions, dataPoints are per-period — sum them here
    // so a series becomes a single bar. ReportBuilder auto-drops DATE alongside
    // another dimension, but users can still land here via saved configs.
    const entries = processedSeries
      .map((s, i) => ({
        label: s.label,
        value: s.dataPoints.reduce((sum, dp) => sum + dp.value, 0),
        color: getSeriesColor(i, isDark, s),
      }))
      .sort((a, b) => b.value - a.value);

    const barData = {
      labels: entries.map((e) => e.label),
      datasets: [
        {
          label: getYAxisLabel(metric),
          data: entries.map((e) => e.value),
          backgroundColor: entries.map((e) => e.color),
          borderColor: entries.map((e) => e.color),
          borderWidth: 1,
        },
      ],
    };

    const options = {
      ...commonOptions,
      indexAxis: "y" as const,
      plugins: {
        ...commonOptions.plugins,
        legend: { display: false },
        datalabels: minimal
          ? { display: false }
          : {
              anchor: "end" as const,
              align: "end" as const,
              clamp: true,
              color: isDark ? "#e5e7eb" : "#111827",
              font: {
                size: 11,
                weight: "bold" as const,
                family: "var(--font-mono)",
              },
              formatter: (value: number) =>
                formatValue(value, metric, currencyCode),
            },
      },
      scales: {
        x: {
          display: !minimal,
          grid: { display: false },
          ticks: {
            font: { size: 11 },
            callback: (value: any) => formatValue(value, metric, currencyCode),
          },
        },
        y: {
          display: !minimal,
          grid: { display: false },
          ticks: { font: { size: 11 } },
        },
      },
    };

    return (
      <div ref={ref} className="h-full w-full">
        <BarChart
          key={chartType}
          data={barData}
          options={options}
          height="100%"
        />
      </div>
    );
  }

  if (chartType === "groupedBar") {
    const barLabelOptions = {
      ...commonOptions,
      plugins: {
        ...commonOptions.plugins,
        datalabels: { display: false },
      },
    };

    const extraDatasets: HorizontalLineDataset[] = [];
    if (showAverage && !minimal) {
      // A period with no data point is not a zero and must not drag the mean
      // down. (Grouped bars zero-fill today, so this filter is belt-and-braces
      // — but the average must stay right if that ever changes.)
      const allValues = chartData.datasets
        .flatMap((ds) => ds.data)
        .filter((v): v is number => v !== null);
      const avg =
        allValues.length > 0
          ? allValues.reduce((a, b) => a + b, 0) / allValues.length
          : 0;
      const avgText = `Ø ${formatValue(avg, metric, currencyCode)}`;
      extraDatasets.push(
        buildHorizontalLineDataset({
          value: avg,
          label: avgText,
          labelCount: labels.length,
          color: AVERAGE_LINE_COLOR,
          borderWidth: 2,
          borderDash: [],
          endLabel: avgText,
        }),
      );
    }
    // Target line last, so the legend filter can find it.
    extraDatasets.push(...referenceDatasets(false));

    const barData =
      extraDatasets.length > 0
        ? { ...chartData, datasets: [...chartData.datasets, ...extraDatasets] }
        : chartData;

    return (
      <div ref={ref} className="h-full w-full">
        <BarChart
          key={chartType}
          data={barData}
          options={barLabelOptions}
          plugins={partialBarPlugins}
          height="100%"
        />
      </div>
    );
  }

  if (chartType === "waterfall") {
    const options = {
      ...commonOptions,
      plugins: {
        ...commonOptions.plugins,
        tooltip: {
          callbacks: {
            label: (ctx: any) => {
              const raw = ctx.raw; // [start, end]
              const val = raw[1] - raw[0]; // Delta
              // Total bar is [0, val]
              // Delta bars [prev, curr]
              // Actually waterfall value is often the delta.
              // My transform calculates start/end.
              // So displaying end value is cumulative. Displaying delta is step.
              // I'll show end value (Cumulative).
              return `${ctx.label}: ${formatValue(raw[1], metric, currencyCode)}`;
            },
          },
        },
      },
    };
    return (
      <div ref={ref} className="h-full w-full">
        <BarChart
          key={chartType}
          data={waterfallData}
          options={options}
          height="100%"
        />
      </div>
    );
  }

  if (chartType === "scatter") {
    return (
      <div ref={ref} className="h-full w-full">
        <ScatterChart
          key={chartType}
          data={scatterData}
          options={commonOptions}
          height="100%"
        />
      </div>
    );
  }

  // Legacy/Custom Types
  if (chartType === "heatmap") {
    // Re-implement Heatmap Table logic inline or reuse code?
    // I'll reuse the logic from previous file read.
    const heatmapData = (() => {
      let minVal = Infinity,
        maxVal = -Infinity;
      for (const s of processedSeries) {
        for (const dp of s.dataPoints) {
          if (dp.value < minVal) minVal = dp.value;
          if (dp.value > maxVal) maxVal = dp.value;
        }
      }
      const range = maxVal - minVal || 1;
      const cells: any[] = [];
      const baseColor = resolveColor("var(--color-chart-1)"); // Use theme color 1 (Blue usually)

      // We can't easily interpolate CSS variables in JS without parsing them.
      // But we can use opacity with the base color if we assume the base color is a solid color.
      // If baseColor is hex/rgb, we can modify opacity.
      // For now, let's use a simple opacity scale on the primary chart color.

      for (const s of processedSeries) {
        for (const dp of s.dataPoints) {
          const normalized = (dp.value - minVal) / range;
          // Opacity from 0.1 to 1.0 based on value
          const opacity = 0.1 + normalized * 0.9;

          let fill;
          if (baseColor.startsWith("#")) {
            const r = parseInt(baseColor.slice(1, 3), 16);
            const g = parseInt(baseColor.slice(3, 5), 16);
            const b = parseInt(baseColor.slice(5, 7), 16);
            fill = `rgba(${r}, ${g}, ${b}, ${opacity})`;
          } else if (baseColor.startsWith("rgb")) {
            fill = baseColor
              .replace(")", `, ${opacity})`)
              .replace("rgb", "rgba");
          } else {
            // Fallback for named colors or variables if resolveColor failed
            fill = `rgba(59, 130, 246, ${opacity})`;
          }

          cells.push({
            period: dp.period,
            series: s.label,
            value: dp.value,
            fill,
          });
        }
      }
      return cells;
    })();

    const seriesLabels = [...new Set(heatmapData.map((c) => c.series))];
    const periods = [...new Set(heatmapData.map((c) => c.period))].sort(
      comparePeriods,
    );

    return (
      <div className="flex h-full flex-col overflow-auto p-2">
        <div className="flex-1">
          <table className="w-full border-collapse text-xs">
            {!minimal && (
              <thead>
                <tr>
                  <th className="border-muted bg-muted/50 border p-1 text-left font-medium"></th>
                  {periods.map((period) => (
                    <th
                      key={period}
                      className="border-muted bg-muted/50 border p-1 text-center font-medium"
                    >
                      {period}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {seriesLabels.map((seriesLabel) => (
                <tr key={seriesLabel}>
                  {!minimal && (
                    <td className="border-muted bg-muted/50 border p-1 font-medium">
                      {seriesLabel}
                    </td>
                  )}
                  {periods.map((period) => {
                    const cell = heatmapData.find(
                      (c) => c.series === seriesLabel && c.period === period,
                    );
                    return (
                      <td
                        key={`${seriesLabel}-${period}`}
                        className="border-muted border p-1 text-center"
                        style={{ backgroundColor: cell?.fill, color: "#fff" }}
                        title={
                          !minimal && cell
                            ? formatValue(cell.value, metric, currencyCode)
                            : undefined
                        }
                      >
                        {!minimal && cell
                          ? formatValue(cell.value, metric, currencyCode)
                          : ""}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (chartType === "table") {
    // Plain tabular read of the cube: one row per series (dimension value), one
    // column per period, plus per-row and per-column totals. Mirrors the heatmap
    // table markup but without the colour fills — the point is exact, scannable
    // numbers. Flat, hairline-divided, no Card.
    const periods = labels;
    const rows = processedSeries.map((s) => {
      const dataMap = new Map(s.dataPoints.map((dp) => [dp.period, dp.value]));
      const cells = periods.map((period) => dataMap.get(period) ?? 0);
      const total = cells.reduce((sum, value) => sum + value, 0);
      return { label: s.label, cells, total };
    });
    const columnTotals = periods.map((_, colIdx) =>
      rows.reduce((sum, row) => sum + row.cells[colIdx], 0),
    );
    const grandTotal = columnTotals.reduce((sum, value) => sum + value, 0);

    return (
      <div className="flex h-full flex-col overflow-auto p-2">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="border-muted bg-muted/50 border p-1.5 text-left font-medium">
                {getYAxisLabel(metric)}
              </th>
              {periods.map((period) => (
                <th
                  key={period}
                  className="border-muted bg-muted/50 border p-1.5 text-right font-medium"
                >
                  {period}
                </th>
              ))}
              <th className="border-muted bg-muted/50 border p-1.5 text-right font-semibold">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="border-muted border p-1.5 text-left font-medium">
                  {row.label}
                </td>
                {row.cells.map((value, colIdx) => (
                  <td
                    key={periods[colIdx]}
                    className="border-muted border p-1.5 text-right font-mono tabular-nums"
                  >
                    {formatValue(value, metric, currencyCode)}
                  </td>
                ))}
                <td className="border-muted border p-1.5 text-right font-mono font-semibold tabular-nums">
                  {formatValue(row.total, metric, currencyCode)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="border-muted bg-muted/50 border p-1.5 text-left font-semibold">
                Total
              </td>
              {columnTotals.map((value, colIdx) => (
                <td
                  key={periods[colIdx]}
                  className="border-muted bg-muted/50 border p-1.5 text-right font-mono font-semibold tabular-nums"
                >
                  {formatValue(value, metric, currencyCode)}
                </td>
              ))}
              <td className="border-muted bg-muted/50 border p-1.5 text-right font-mono font-semibold tabular-nums">
                {formatValue(grandTotal, metric, currencyCode)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }

  if (chartType === "wholeNumber") {
    const totalValue = series.reduce((sum, s) => {
      return sum + s.dataPoints.reduce((sSum, dp) => sSum + dp.value, 0);
    }, 0);
    return (
      <div className="flex h-full flex-col items-center justify-center p-4">
        <div
          className={`font-bold ${minimal ? "text-3xl" : "text-5xl"} tracking-tight`}
        >
          {formatValue(totalValue, metric, currencyCode)}
        </div>
        {!minimal && (
          <p className="text-muted-foreground mt-2 text-sm font-medium tracking-wide uppercase">
            {getYAxisLabel(metric)}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-muted-foreground text-sm">
        {minimal ? "" : `Unsupported chart type: ${chartType}`}
      </p>
    </div>
  );
}
