"use client";

/**
 * DashboardChart — the Overview's chart wrapper that keeps all three panels'
 * PLOT areas vertically aligned.
 *
 * The problem it solves: Chart.js renders its legend inside the canvas, so a
 * chart with many series gets a taller legend and a shorter plot — the three
 * panels' bars/axes then don't line up. Here we instead:
 *   1. collapse the series to the top 4 by total + a single "Other" bucket
 *      (so the legend never grows unbounded), and
 *   2. render a FIXED-HEIGHT custom legend below the chart, with the built-in
 *      Chart.js legend disabled.
 * Every panel therefore reserves the same legend height → the plots align.
 * "Other" is clickable and lists the grouped series (name + total).
 *
 * Helm screen template (one chart per screen, time on the x-axis):
 *   - `partialFrom` names the first not-yet-final period; the renderer draws
 *     it dashed/translucent and the legend gains a dashed "Not final yet" key
 *     — only when that period is actually on the axis.
 *   - `stackOptions` + `stackBy` + `onStackByChange` add a small segmented
 *     toggle above the plot that changes what the chart stacks by. The caller
 *     re-queries and passes the new series; this component never renders a
 *     second chart. Whether the series may be stacked at all is the caller's
 *     call via `stackableChartType` (`chart-stacking.ts`).
 */

import { useMemo } from "react";
import { useChartTheme as useTheme } from "./theme.js";
import type {
  StackedBarLabelFormat,
  SplitScaleMode,
  AnalyticsMetricType,
} from "./types.js";
import type { AnalyticsSeries } from "./types.js";
import { resolveSeriesColor } from "./chart-config.js";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@klein-ui/react/compat/popover";
import { ToggleGroup, ToggleGroupItem } from "@klein-ui/react/compat/toggle-group";
import {
  ChartRenderer,
  getLabels,
  type ChartReferenceLine,
  type ChartValueFormat,
} from "./ChartRenderer.js";
import { partialIndexOf } from "./partial-periods.js";

/** One choice in the chart's stack-by toggle (e.g. by tool, by team). */
export interface ChartStackOption {
  /** Stable value handed back to `onStackByChange`. */
  value: string;
  /** Already-translated label shown on the toggle. */
  label: string;
}

/** Key for the synthetic legend "Other" bucket (distinct from any data key). */
export const LEGEND_OTHER_KEY = "__legend_other__";

/** A series that was folded into "Other", kept for the expand-on-click list. */
export interface OtherMember {
  label: string;
  total: number;
}

function seriesTotal(s: AnalyticsSeries): number {
  return s.dataPoints.reduce((sum, dp) => sum + dp.value, 0);
}

/**
 * Collapse a series list to the top `maxNamed` by total plus one aggregated
 * "Other" series (summed per period), preserving the folded members' names +
 * totals. Lists of `maxNamed + 1` or fewer are returned untouched (and in their
 * original order, so small charts like Actual/Forecast keep their colours).
 *
 * @param series - The full series list (already period-aligned/zero-filled).
 * @param otherLabel - Display label for the aggregated bucket.
 * @param maxNamed - How many named series to keep before bucketing (default 4).
 */
export function capSeriesForLegend(
  series: ReadonlyArray<AnalyticsSeries>,
  otherLabel: string,
  maxNamed = 4,
): { display: AnalyticsSeries[]; otherMembers: OtherMember[] } {
  if (series.length <= maxNamed + 1) {
    return { display: [...series], otherMembers: [] };
  }

  const ranked = [...series].sort((a, b) => seriesTotal(b) - seriesTotal(a));
  const named = ranked.slice(0, maxNamed);
  const rest = ranked.slice(maxNamed);

  const periods = series[0]?.dataPoints.map((dp) => dp.period) ?? [];
  const otherSeries: AnalyticsSeries = {
    key: LEGEND_OTHER_KEY,
    label: otherLabel,
    color: "other",
    dataPoints: periods.map((period, idx) => ({
      period,
      value: rest.reduce((sum, s) => sum + (s.dataPoints[idx]?.value ?? 0), 0),
    })),
  };

  const otherMembers = rest
    .map((s) => ({ label: s.label, total: seriesTotal(s) }))
    .sort((a, b) => b.total - a.total);

  return { display: [...named, otherSeries], otherMembers };
}

export function DashboardChart({
  chartType,
  series,
  currencyCode,
  metric,
  stackedBarLabel,
  splitScale,
  highlightIndices,
  valueFormat,
  referenceLine,
  cumulative,
  partialFrom,
  axisTitle,
  stackOptions,
  stackBy,
  onStackByChange,
  labels,
  formatValue,
}: {
  labels: {
    other: string;
    otherCount: (count: number) => string;
    otherGrouped: string;
    stackBy: string;
    partial: string;
  };
  formatValue: (value: number) => string;
  chartType: "stackedBar" | "line";
  series: AnalyticsSeries[];
  currencyCode: string;
  metric: AnalyticsMetricType;
  stackedBarLabel?: StackedBarLabelFormat;
  splitScale?: SplitScaleMode;
  /**
   * Category indices to paint a translucent red band behind (line charts only)
   * — used by the spend trendline to show where a spike was detected.
   */
  highlightIndices?: readonly number[];
  /**
   * Override how values read on the axis + tooltips when the panel plots a
   * ratio of `metric` rather than `metric` itself (e.g. attribution coverage %).
   */
  valueFormat?: ChartValueFormat;
  /**
   * A flat dashed target line (e.g. the month's budget) across every period.
   * Also gets its own entry — dashed swatch + `label` — at the end of the legend.
   */
  referenceLine?: ChartReferenceLine;
  /** Draw every series as a running total over the periods (month-to-date). */
  cumulative?: boolean;
  /**
   * The first period that is not final yet (same format as
   * `dataPoints[].period`, e.g. `'2026-09-25'`). Drawn dashed / translucent,
   * with a legend key while it is on the axis.
   */
  partialFrom?: string;
  /** The y-axis title, already translated; omitted, it is the metric's name (named edit, H4). */
  axisTitle?: string;
  /** What the chart can stack by. The toggle shows only with two or more. */
  stackOptions?: readonly ChartStackOption[];
  /** The selected stack-by value (one of `stackOptions`). */
  stackBy?: string;
  /** Called with the new value when the user picks another stack-by option. */
  onStackByChange?: (value: string) => void;
}): React.JSX.Element {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { display, otherMembers } = useMemo(
    () => capSeriesForLegend(series, labels.other),
    [series, labels.other],
  );

  // The legend's "Not final yet" key shows only while that period is drawn.
  const showsPartial = useMemo(
    () => partialIndexOf(getLabels(display), partialFrom) !== null,
    [display, partialFrom],
  );
  const stackToggle =
    stackOptions !== undefined &&
    stackOptions.length >= 2 &&
    onStackByChange !== undefined
      ? { options: stackOptions, onChange: onStackByChange }
      : null;

  return (
    <div className="flex h-full flex-col">
      {stackToggle !== null ? (
        <div className="flex justify-end pb-1.5">
          <ToggleGroup
            type="single"
            size="sm"
            value={stackBy}
            onValueChange={(value) => {
              // Radix sends '' when the active item is clicked again; keep the choice.
              if (value !== "" && value !== stackBy)
                stackToggle.onChange(value);
            }}
            aria-label={labels.stackBy}
            className="rounded-md p-0.5 shadow-none"
            data-testid="dashboard-chart-stack-toggle"
          >
            {stackToggle.options.map((option) => (
              <ToggleGroupItem
                key={option.value}
                value={option.value}
                className="h-6 min-w-0 px-2 text-[11px] shadow-none"
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      ) : null}
      <div className="min-h-0 flex-1">
        <ChartRenderer
          chartType={chartType}
          series={display}
          currencyCode={currencyCode}
          metric={metric}
          stackedBarLabel={stackedBarLabel}
          splitScale={splitScale}
          showLegend={false}
          highlightIndices={highlightIndices}
          valueFormat={valueFormat}
          referenceLine={referenceLine}
          cumulative={cumulative}
          partialFrom={partialFrom}
          axisTitle={axisTitle}
        />
      </div>
      {/* Fixed-height legend → every panel's plot area is the same height. */}
      <div className="flex h-[44px] flex-wrap content-start gap-x-3 gap-y-1 overflow-hidden px-1 pt-1.5">
        {display.map((s, i) => {
          const color = resolveSeriesColor(s.color, isDark, i);
          if (s.key === LEGEND_OTHER_KEY) {
            return (
              <Popover key={s.key}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 underline-offset-2 hover:underline"
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[10px] leading-none">
                      {labels.otherCount(otherMembers.length)}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-60 p-2">
                  <p className="text-muted-foreground mb-1.5 text-[10px] font-medium tracking-wide uppercase">
                    {labels.otherGrouped}
                  </p>
                  <ul className="flex max-h-56 flex-col gap-0.5 overflow-y-auto">
                    {otherMembers.map((m) => (
                      <li
                        key={m.label}
                        className="flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="min-w-0 truncate">{m.label}</span>
                        <span className="mono-value text-muted-foreground shrink-0">
                          {formatValue(m.total)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </PopoverContent>
              </Popover>
            );
          }
          return (
            <span
              key={s.key}
              className="text-muted-foreground inline-flex min-w-0 items-center gap-1.5 text-[10px]"
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="max-w-[150px] truncate">{s.label}</span>
            </span>
          );
        })}
        {referenceLine !== undefined && (
          <span
            data-testid="dashboard-chart-reference-legend"
            className="text-muted-foreground inline-flex min-w-0 items-center gap-1.5 text-[10px]"
          >
            <span className="border-destructive w-3 shrink-0 border-t border-dashed" />
            <span className="max-w-[150px] truncate">
              {referenceLine.label}
            </span>
          </span>
        )}
        {showsPartial && (
          <span
            data-testid="dashboard-chart-partial-legend"
            className="text-muted-foreground inline-flex min-w-0 items-center gap-1.5 text-[10px]"
          >
            <span className="border-muted-foreground w-3 shrink-0 border-t border-dashed" />
            <span className="max-w-[150px] truncate">{labels.partial}</span>
          </span>
        )}
      </div>
    </div>
  );
}
