"use client";
import { tokens } from "@klein-ui/tokens";
import type { ReactNode } from "react";
import { BarChart } from "./chart-base.js";
import { CHART_PALETTE_LIGHT, CHART_PALETTE_DARK } from "./chart-palette.js";
import { useChartTheme } from "./theme.js";
/** A segment's value and display text are calculated by the application. */
export interface CapacitySegment {
  id: string;
  label: string;
  value: number;
  displayValue: string;
  /** Optional direct label inside the bar (for example "7.0 (70%)"). */
  barLabel?: string;
}
/** Stacked capacity chart with its matching metrics and an optional assessment. */
export interface CapacityBreakdownProps {
  label: string;
  description?: string;
  segments: readonly CapacitySegment[];
  summary?: {
    label: string;
    value: ReactNode;
    statusLabel?: string;
    tone?: "neutral" | "good" | "watch" | "bad";
  };
  height?: number;
  emptyLabel?: string;
}
export function CapacityBreakdown({
  label,
  description,
  segments,
  summary,
  height = 120,
  emptyLabel = "No capacity data",
}: CapacityBreakdownProps) {
  const { theme } = useChartTheme();
  const palette = theme === "dark" ? CHART_PALETTE_DARK : CHART_PALETTE_LIGHT;
  const hasValues = segments.some(
    (segment) => Number.isFinite(segment.value) && segment.value > 0,
  );
  return (
    <section
      aria-label={label}
      className="border border-line bg-paper p-4 text-ink"
    >
      <h3 className="text-sm font-semibold">{label}</h3>
      {description && <p className="text-sm text-body">{description}</p>}
      {hasValues ? (
        <BarChart
          height={height}
          data={{
            labels: [label],
            datasets: segments.map((segment, index) => ({
              label: segment.label,
              data: [segment.value],
              backgroundColor: palette[index % palette.length],
              stack: "capacity",
              barPercentage: 0.6,
              categoryPercentage: 1,
            })),
          }}
          options={{
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (context: { datasetIndex: number }) =>
                    `${segments[context.datasetIndex].label}: ${segments[context.datasetIndex].displayValue}`,
                },
              },
              datalabels: {
                display: (context: { datasetIndex: number }) =>
                  Boolean(segments[context.datasetIndex].barLabel) &&
                  segments[context.datasetIndex].value > 0,
                formatter: (
                  _value: unknown,
                  context: { datasetIndex: number },
                ) => segments[context.datasetIndex].barLabel ?? "",
                color: theme === "dark" ? tokens.ink : tokens.paper,
              },
            },
            scales: {
              x: { display: false, stacked: true },
              y: { display: false, stacked: true },
            },
          }}
        />
      ) : (
        <p role="status">{emptyLabel}</p>
      )}
      <dl className="mt-4 flex flex-wrap gap-4 border-t border-line pt-4">
        {segments.map((segment, index) => (
          <div key={segment.id} className="min-w-0 flex-1">
            <dt className="text-xs text-body">
              <span
                aria-hidden="true"
                style={{ backgroundColor: palette[index % palette.length] }}
                className="mr-2 inline-block h-2 w-2"
              />
              {segment.label}
            </dt>
            <dd className="font-mono text-lg tabular-nums">
              {segment.displayValue}
            </dd>
          </div>
        ))}
        {summary && (
          <div className="min-w-0 flex-1">
            <dt className="text-xs text-body">{summary.label}</dt>
            <dd className="font-mono text-lg tabular-nums">{summary.value}</dd>
            {summary.statusLabel && (
              <span
                className={
                  summary.tone === "good"
                    ? "text-good"
                    : summary.tone === "watch"
                      ? "text-watch"
                      : summary.tone === "bad"
                        ? "text-bad"
                        : "text-body"
                }
              >
                {summary.statusLabel}
              </span>
            )}
          </div>
        )}
      </dl>
    </section>
  );
}
