"use client";

import { useMemo } from "react";
import type { Chart, Plugin } from "chart.js";
import { LineChart } from "./chart-base.js";
import { CHART_COLORS } from "./chart-config.js";

/** One month's forecast + actual (non-cumulative) figure. */
export interface BurndownPoint {
  /** Display label for the month, e.g. "Jan". */
  month: string;
  /** Forecast value for the month (cost or effort, per `mode`). */
  forecast: number;
  /**
   * Actual value for the month. Use `null` for future months that have no
   * actuals yet — the actual line stops at "today" instead of dropping to 0.
   */
  actual: number | null;
}

export interface BurndownChartProps {
  /** Monthly series (chronological). Already cumulative; calculated by the application. */
  series: BurndownPoint[];
  /** Cost (money) or Effort (FTE/days) — drives the axis formatter + labels. */
  mode: "cost" | "effort";
  /** Pre-translated dataset labels. */
  labels: { forecast: string; actual: string };
  /** Index of the "today" month in `series` (red marker). -1 to omit. */
  todayIndex: number;
  /** Format an axis/tooltip value (caller injects currency/effort formatting). */
  formatValue: (value: number) => string;
  /** Copy for the empty state. */
  emptyText?: string;
  height?: number;
  className?: string;
  "data-testid"?: string;
}

/**
 * The Initiative burndown: cumulative forecast-vs-actual over the month series,
 * with a red dashed vertical line on "today". Reuses the codebase's Chart.js
 * `LineChart` wrapper, the dual-cumulative dataset shape from
 * `ForecastVsActualsChart`, and the `currentMonthLine` afterDraw plugin from
 * `BurnUpChart` (recoloured rose for "today"). Cost or Effort by `mode` —
 * the caller picks which based on the viewer's cost access. Presentational: the
 * value formatter + labels are injected (Storybook-safe, no locale hooks).
 */
export function BurndownChart({
  series,
  mode,
  labels,
  todayIndex,
  formatValue,
  emptyText = "No burndown data yet.",
  height = 240,
  className,
  "data-testid": testId,
}: BurndownChartProps): React.JSX.Element {
  const chartData = useMemo(() => {
    const forecast = series.map((point) => point.forecast);
    const actual = series.map((point) => point.actual);
    return {
      labels: series.map((p) => p.month),
      datasets: [
        {
          label: labels.forecast,
          data: forecast,
          borderColor: CHART_COLORS[0],
          backgroundColor: `${CHART_COLORS[0]}22`,
          borderWidth: 2,
          borderDash: [5, 4],
          pointRadius: 0,
          tension: 0,
          fill: false,
        },
        {
          label: labels.actual,
          data: actual,
          borderColor: CHART_COLORS[1],
          backgroundColor: `${CHART_COLORS[1]}22`,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0,
          fill: true,
          spanGaps: false,
        },
      ],
    };
  }, [series, labels.forecast, labels.actual]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index" as const, intersect: false },
      plugins: {
        legend: {
          display: true,
          position: "bottom" as const,
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: true,
            font: { size: 11 },
          },
        },
        datalabels: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: {
              dataset: { label?: string };
              parsed: { y: number | null };
            }) => {
              const y = ctx.parsed.y;
              if (y === null) return "";
              return `${ctx.dataset.label ?? ""}: ${formatValue(y)}`;
            },
          },
        },
      },
      scales: {
        y: {
          ticks: {
            callback: (value: string | number) => formatValue(Number(value)),
            font: { size: 11 },
          },
        },
        x: { ticks: { font: { size: 11 } }, grid: { display: false } },
      },
    }),
    [formatValue],
  );

  // Red dashed "today" line (afterDraw plugin, recoloured from BurnUpChart).
  const plugins = useMemo<Plugin<"line">[]>(() => {
    if (todayIndex < 0 || todayIndex >= series.length) return [];
    return [
      {
        id: "initiativeTodayLine",
        afterDraw: (chart: Chart) => {
          const xAxis = chart.scales.x;
          const yAxis = chart.scales.y;
          if (xAxis === undefined || yAxis === undefined) return;
          const x = xAxis.getPixelForValue(todayIndex);
          const ctx = chart.ctx;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(x, yAxis.top);
          ctx.lineTo(x, yAxis.bottom);
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = "#e11d48"; // rose-600 — the "today" marker
          ctx.setLineDash([4, 3]);
          ctx.stroke();
          ctx.restore();
        },
      },
    ];
  }, [todayIndex, series.length]);

  if (series.length === 0) {
    return (
      <p
        className="text-muted-foreground px-1 py-3 text-sm"
        data-testid={testId}
      >
        {emptyText}
      </p>
    );
  }

  return (
    <div
      className={className}
      style={{ height }}
      data-testid={testId}
      data-mode={mode}
    >
      <LineChart
        data={chartData}
        options={options}
        plugins={plugins}
        height="100%"
      />
    </div>
  );
}
