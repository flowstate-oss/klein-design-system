"use client";
import { useMemo } from "react";
import type { Chart, Plugin } from "chart.js";
import { LineChart } from "./chart-base.js";
import { resolveColor } from "./chart-config.js";
import { CHART_PALETTE_LIGHT, CHART_PALETTE_DARK } from "./chart-palette.js";
import { useChartTheme } from "./theme.js";
import { ChartDataTable } from "./ChartDataTable.js";
export interface ForecastAdjustmentPoint {
  /** Stable period identity. */
  id: string;
  /** Accessible, application-localized label. */
  label: string;
  actual: number | null;
  forecast: number | null;
  baseline: number | null;
}
export interface ForecastAdjustmentChartProps {
  /** Accessible, application-localized label. */
  label: string;
  /** Chronological display model; null preserves missing values. */
  points: readonly ForecastAdjustmentPoint[];
  /** Legend labels for the three prepared series. */
  labels: { actual: string; forecast: string; baseline: string };
  /** Prepared limit or target; never included in series totals. */
  referenceLine?: { label: string; value: number };
  /** Application-formatted difference at a stable point ID. */
  annotation?: {
    pointId: string;
    label: string;
    tone: "good" | "bad" | "neutral";
  };
  /** Same formatter for tooltips and the accessible table. */
  formatValue: (value: number) => string;
  /** Plot height in pixels, default 260. */
  height?: number;
}
/** Compare a prepared adjustment with its baseline; no projection or financial calculations live here. */
export function ForecastAdjustmentChart({
  label,
  points,
  labels,
  referenceLine,
  annotation,
  formatValue,
  height = 260,
}: ForecastAdjustmentChartProps) {
  const { theme } = useChartTheme();
  const capAmount = referenceLine?.value ?? null;
  const hasForecast = points.some((point) => point.forecast !== null);
  // Presentation colors follow the supplied theme.
  const colors = useMemo(
    () => ({
      actual: (theme === "dark" ? CHART_PALETTE_DARK : CHART_PALETTE_LIGHT)[0],
      ghost: resolveColor("var(--color-muted-foreground)"),
      cap: resolveColor("var(--color-bad)"),
      annotation: resolveColor(
        `var(--color-${annotation?.tone && annotation.tone !== "neutral" ? annotation.tone : "body"})`,
      ),
    }),
    [theme, annotation?.tone],
  );

  const hasGhost = points.some((p) => p.baseline !== null);

  const chartData = useMemo(
    () => ({
      labels: points.map((p) => p.label),
      datasets: [
        {
          label: labels.actual,
          data: points.map((p) => p.actual),
          borderColor: colors.actual,
          backgroundColor: `${colors.actual}22`,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0,
          fill: true,
          spanGaps: false,
        },
        ...(hasForecast
          ? [
              {
                label: labels.forecast,
                data: points.map((p) => p.forecast),
                borderColor: colors.actual,
                borderWidth: 2,
                borderDash: [5, 4],
                pointRadius: 0,
                tension: 0,
                fill: false,
                spanGaps: false,
              },
            ]
          : []),
        ...(hasGhost
          ? [
              {
                label: labels.baseline,
                data: points.map((p) => p.baseline),
                borderColor: colors.ghost,
                borderWidth: 1.5,
                borderDash: [3, 3],
                pointRadius: 0,
                tension: 0,
                fill: false,
                spanGaps: false,
              },
            ]
          : []),
      ],
    }),
    [points, hasForecast, labels, colors, hasGhost],
  );

  // Horizontal dashed cap line + the adjustment gap, drawn once so neither
  // needs its own dataset (a dataset would pollute the legend and tooltip).
  const plugins = useMemo<Plugin<"line">[]>(() => {
    const out: Plugin<"line">[] = [];

    if (capAmount !== null) {
      out.push({
        id: "forecastReferenceLine",
        afterDraw: (chart: Chart) => {
          const yAxis = chart.scales.y;
          const xAxis = chart.scales.x;
          if (yAxis === undefined || xAxis === undefined) return;
          // Drawn even when the cap sits above the visible range — Chart.js
          // grows the axis to fit the highest series value, and "the cap line
          // is now off the top of the chart" IS the over-budget story.
          const y = yAxis.getPixelForValue(capAmount);
          const ctx = chart.ctx;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(xAxis.left, y);
          ctx.lineTo(xAxis.right, y);
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = colors.cap;
          ctx.setLineDash([4, 3]);
          ctx.stroke();
          ctx.font = "10px sans-serif";
          ctx.fillStyle = colors.cap;
          ctx.textAlign = "end";
          ctx.fillText(
            `${referenceLine?.label} ${formatValue(capAmount)}`,
            xAxis.right - 2,
            y - 5,
          );
          ctx.restore();
        },
      });
    }

    if (annotation) {
      out.push({
        id: "forecastAdjustmentLabel",
        afterDraw: (chart: Chart) => {
          const xAxis = chart.scales.x;
          const yAxis = chart.scales.y;
          if (xAxis === undefined || yAxis === undefined) return;
          const lastIndex = points.findIndex(
            (point) => point.id === annotation.pointId,
          );
          const lastForecast = points[lastIndex]?.forecast;
          if (lastForecast === null || lastForecast === undefined) return;
          const x = xAxis.getPixelForValue(lastIndex);
          const y = yAxis.getPixelForValue(lastForecast);
          if (!annotation) return;
          const ctx = chart.ctx;
          ctx.save();
          ctx.font = "bold 11px sans-serif";
          ctx.fillStyle = colors.annotation;
          ctx.textAlign = "end";
          ctx.fillText(annotation.label, x - 4, y - 8);
          ctx.restore();
        },
      });
    }

    return out;
  }, [
    capAmount,
    points,
    annotation,
    colors,
    referenceLine?.label,
    formatValue,
  ]);

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
          // The cap line is drawn by a plugin, not a dataset, so Chart.js has
          // no series value to auto-scale the axis to it — without this, a
          // cap above the highest actual/forecast point draws off the top of
          // the canvas rather than "line near the ceiling, series below it".
          suggestedMax: capAmount ?? undefined,
          ticks: {
            callback: (value: string | number) => formatValue(Number(value)),
            font: { size: 11 },
          },
        },
        x: { ticks: { font: { size: 11 } }, grid: { display: false } },
      },
    }),
    [formatValue, capAmount],
  );

  return (
    <figure aria-label={label} className="k-chart">
      <LineChart
        data={chartData}
        options={options}
        plugins={plugins}
        height={height}
      />
      {annotation && (
        <p className="k-chart-annotation" data-tone={annotation.tone}>
          {annotation.label}
        </p>
      )}
      <ChartDataTable
        caption={`${label} data`}
        columns={[
          "Period",
          labels.actual,
          labels.forecast,
          labels.baseline,
          ...(referenceLine ? [referenceLine.label] : []),
        ]}
        rows={points.map((point) => ({
          id: point.id,
          values: [
            point.label,
            ...[point.actual, point.forecast, point.baseline].map((value) =>
              value == null ? "—" : formatValue(value),
            ),
            ...(referenceLine ? [formatValue(referenceLine.value)] : []),
          ],
        }))}
      />
    </figure>
  );
}
