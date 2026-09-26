"use client";

import { useMemo } from "react";
import { useChartTheme as useTheme } from "./theme.js";
import { useMeasure } from "@uidotdev/usehooks";
import { BarChart } from "./chart-base.js";
import type { AnalyticsSeries } from "./types.js";
import type { StackedBarLabelFormat, AnalyticsMetricType } from "./types.js";
import { resolveSeriesColor } from "./chart-config.js";
import { comparePeriods } from "./period-order.js";
import { computeBottomMax, computeTopMax } from "./split-scale.js";

interface Props {
  /** Pre-sorted series (largest total first) — same shape as ChartRenderer feeds today. */
  series: AnalyticsSeries[];
  /** Index where the dominant block ends and the tail begins. */
  splitIndex: number;
  metric: AnalyticsMetricType;
  currencyCode: string;
  minimal?: boolean;
  stackedBarLabel: StackedBarLabelFormat;
  formatValue: (
    value: number,
    metric: AnalyticsMetricType,
    code: string,
  ) => string;
  pickContrastingTextColor: (bg: string | undefined) => string;
}

const TOP_PANEL_HEIGHT_PCT = 32;

export function SplitScaleStackedBar({
  series,
  splitIndex,
  metric,
  currencyCode,
  minimal,
  stackedBarLabel,
  formatValue,
  pickContrastingTextColor,
}: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [ref, { width }] = useMeasure<HTMLDivElement>();

  const labels = useMemo(() => {
    const set = new Set<string>();
    for (const s of series) for (const dp of s.dataPoints) set.add(dp.period);
    return Array.from(set).sort(comparePeriods);
  }, [series]);

  const bottomSeries = useMemo(
    () => series.slice(0, splitIndex),
    [series, splitIndex],
  );
  const topSeries = useMemo(
    () => series.slice(splitIndex),
    [series, splitIndex],
  );

  const columnTotals = useMemo(
    () =>
      labels.map((p) =>
        series.reduce(
          (sum, s) =>
            sum + (s.dataPoints.find((d) => d.period === p)?.value ?? 0),
          0,
        ),
      ),
    [series, labels],
  );

  const bottomMax = useMemo(
    () => computeBottomMax(series, splitIndex),
    [series, splitIndex],
  );
  const topMax = useMemo(
    () => computeTopMax(series, splitIndex),
    [series, splitIndex],
  );

  const buildDatasets = (subset: AnalyticsSeries[], offset: number) =>
    subset.map((s, i) => {
      const dataMap = new Map(s.dataPoints.map((dp) => [dp.period, dp.value]));
      const data = labels.map((label) => dataMap.get(label) ?? 0);
      const color = resolveSeriesColor(s.color, isDark, offset + i);
      return {
        label: s.label,
        data,
        backgroundColor: color,
        borderColor: color,
        borderWidth: 1,
      };
    });

  const bottomData = useMemo(
    () => ({ labels, datasets: buildDatasets(bottomSeries, 0) }),
    [labels, bottomSeries, isDark],
  );
  const topData = useMemo(
    () => ({ labels, datasets: buildDatasets(topSeries, splitIndex) }),
    [labels, topSeries, splitIndex, isDark],
  );

  const barWidth = (width || 600) / Math.max(labels.length, 1);
  const minBarWidthForSegmentLabel = stackedBarLabel === "value" ? 55 : 35;
  const showSegmentLabels = barWidth > minBarWidthForSegmentLabel;

  const segmentLabelPlugin = (panelMin: number) => ({
    labels: {
      segment: {
        display: (ctx: any) => {
          if (!showSegmentLabels) return false;
          const value = ctx.dataset.data[ctx.dataIndex] ?? 0;
          // In the magnified top panel, surface labels at much lower share —
          // the panel's local scale gives them visual room.
          return Math.abs(value) >= panelMin;
        },
        color: (ctx: any) => {
          const bg = ctx.dataset.backgroundColor;
          const resolved = Array.isArray(bg) ? bg[ctx.dataIndex] : bg;
          return pickContrastingTextColor(resolved);
        },
        font: { size: 10, weight: "bold" as const, family: "var(--font-mono)" },
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
    },
  });

  const tooltipFormatter = (context: any) => {
    const label = context.dataset.label || "";
    const total = columnTotals[context.dataIndex] || 1;
    const value = Number(context.raw ?? 0);
    const pct = ((value / total) * 100).toFixed(1);
    return `${label}: ${formatValue(value, metric, currencyCode)} (${pct}%)`;
  };

  const sharedScalesX = {
    stacked: true,
    grid: { display: false },
    categoryPercentage: 0.95,
    barPercentage: 1.0,
  };

  // Top panel: hide X labels (bottom panel owns them), show total labels above bars.
  const topOptions = useMemo(
    () => ({
      maintainAspectRatio: false,
      layout: { padding: { top: 18, bottom: 0 } },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: tooltipFormatter } },
        datalabels: minimal
          ? { display: false }
          : {
              ...segmentLabelPlugin(topMax * 0.04),
              labels: {
                ...segmentLabelPlugin(topMax * 0.04).labels,
                total: {
                  display: (ctx: any) =>
                    ctx.datasetIndex === topData.datasets.length - 1,
                  anchor: "end" as const,
                  align: "end" as const,
                  color: isDark ? "#e7e5e4" : "#44403c",
                  font: {
                    size: 11,
                    weight: "bold" as const,
                    family: "var(--font-mono)",
                  },
                  formatter: (_v: number, ctx: any) =>
                    formatValue(
                      columnTotals[ctx.dataIndex] ?? 0,
                      metric,
                      currencyCode,
                    ),
                },
              },
            },
      },
      scales: {
        x: { ...sharedScalesX, display: false },
        y: {
          display: !minimal,
          stacked: true,
          min: 0,
          max: topMax,
          border: { display: false },
          ticks: {
            font: { size: 11 },
            maxTicksLimit: 4,
            callback: (value: any) =>
              formatValue(Number(value), metric, currencyCode),
          },
        },
      },
    }),
    [
      topData.datasets.length,
      topMax,
      columnTotals,
      metric,
      currencyCode,
      minimal,
      isDark,
      showSegmentLabels,
      stackedBarLabel,
    ],
  );

  // Bottom panel: standard X axis, capped Y. Legend is rendered separately
  // (unified across both panels) so we hide Chart.js's per-panel legend here.
  const bottomOptions = useMemo(
    () => ({
      maintainAspectRatio: false,
      layout: { padding: { top: 0, bottom: 0 } },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: tooltipFormatter } },
        datalabels: minimal
          ? { display: false }
          : segmentLabelPlugin(bottomMax * 0.08),
      },
      scales: {
        x: {
          ...sharedScalesX,
          display: !minimal,
          ticks: { font: { size: 11 } },
        },
        y: {
          display: !minimal,
          stacked: true,
          min: 0,
          max: bottomMax,
          border: { display: false },
          ticks: {
            font: { size: 11 },
            callback: (value: any) =>
              formatValue(Number(value), metric, currencyCode),
          },
        },
      },
    }),
    [
      bottomMax,
      columnTotals,
      metric,
      currencyCode,
      minimal,
      isDark,
      width,
      showSegmentLabels,
      stackedBarLabel,
    ],
  );

  // Unified legend across both panels — Chart.js can't span its own legend
  // across two chart instances, so we render an HTML legend that lists every
  // series in the user's stack order.
  const legendItems = useMemo(
    () =>
      series.map((s, i) => ({
        label: s.label,
        color: resolveSeriesColor(s.color, isDark, i),
      })),
    [series, isDark],
  );

  const showLegend = !minimal && (width || 0) > 350;

  return (
    <div ref={ref} className="flex h-full w-full flex-col">
      <div style={{ height: `${TOP_PANEL_HEIGHT_PCT}%` }} className="min-h-0">
        <BarChart
          key="split-top"
          data={topData}
          options={topOptions}
          height="100%"
        />
      </div>
      {!minimal && <AxisBreak isDark={isDark} />}
      <div className="min-h-0 flex-1">
        <BarChart
          key="split-bottom"
          data={bottomData}
          options={bottomOptions}
          height="100%"
        />
      </div>
      {showLegend && (
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-2 pt-3 text-[11px]">
          {legendItems.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
              <span className="text-foreground">{item.label}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Visual indicator that the Y-axis is broken between the two panels.
 * A 1px dashed line with a small zigzag glyph — subtle but unmistakable.
 */
function AxisBreak({ isDark }: { isDark: boolean }) {
  const stroke = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";
  return (
    <div className="relative h-2 w-full">
      <div
        className="absolute left-0 right-0 top-1/2 h-px"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, ${stroke} 0 4px, transparent 4px 8px)`,
        }}
      />
      <svg
        className="absolute left-2 top-0"
        width="20"
        height="8"
        viewBox="0 0 20 8"
        aria-hidden="true"
      >
        <path
          d="M0 4 L4 0 L8 8 L12 0 L16 8 L20 4"
          fill="none"
          stroke={stroke}
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}
