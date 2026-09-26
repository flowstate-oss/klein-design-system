"use client";
import { useMemo } from "react";
import { BarChart, LineChart } from "./chart-base.js";
import { resolveColor } from "./chart-config.js";
import { useChartTheme } from "./theme.js";
import { ChartDataTable } from "./ChartDataTable.js";
/** Prepared floating bar. Running totals and meaning are supplied by the data layer. */
export interface WaterfallBar {
  id: string;
  label: string;
  title: string;
  range: [number, number];
  valueLabel: string;
  tooltipLines: readonly string[];
  tone: "neutral" | "good" | "bad";
  direction: "total" | "up" | "down";
  showLabel?: boolean;
}
export interface WaterfallChartProps {
  label: string;
  bars: readonly WaterfallBar[];
  legend: readonly { label: string; tone: "neutral" | "good" | "bad" }[];
  emptyLabel: string;
  height?: number | "fill";
  valueRange?: { min?: number; max?: number };
  /** Same columns on a separate aligned axis. Null leaves an intentional gap. */
  secondary?: {
    label: string;
    values: readonly (number | null)[];
    formatValue: (value: number) => string;
    formatAxisValue: (value: number) => string;
  };
}
const AXIS_WIDTH = 56;
const pinAxisWidth = (scale: { width: number }) => {
  scale.width = AXIS_WIDTH;
};
function withAlpha(color: string, alpha: number) {
  const channels = color.match(/\d+(?:\.\d+)?/g);
  if (!channels || channels.length < 3) return color;
  return `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, ${alpha})`;
}
/** Floating changes with a separately scaled but column-aligned companion series. */
export function WaterfallChart({
  label,
  bars,
  legend,
  emptyLabel,
  height = 256,
  valueRange,
  secondary,
}: WaterfallChartProps) {
  const { theme } = useChartTheme();
  const colors = useMemo(
    () => ({
      neutral: resolveColor("var(--color-foreground)"),
      good: resolveColor("var(--color-good)"),
      bad: resolveColor("var(--color-bad)"),
    }),
    [theme],
  );
  const labels = bars.map((bar) => bar.label);
  if (!bars.length) return <p role="status">{emptyLabel}</p>;
  return (
    <section
      aria-label={label}
      className={`${height === "fill" ? "k-chart-fill " : ""}flex flex-col gap-2 px-4 py-3`}
    >
      <div className="text-body flex flex-wrap items-center gap-4 text-xs">
        {legend.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0"
              style={{ backgroundColor: colors[item.tone] }}
            />
            {item.label}
          </span>
        ))}
      </div>
      <div className="k-chart-plot">
        <BarChart
          height={height === "fill" ? "100%" : height}
          data={{
            labels,
            datasets: [
              {
                label,
                data: bars.map((bar) => bar.range),
                backgroundColor: bars.map((bar) => colors[bar.tone]),
                borderWidth: 0,
                barPercentage: 0.7,
                categoryPercentage: 0.9,
                datalabels: {
                  display: (ctx: { dataIndex: number }) =>
                    bars[ctx.dataIndex]?.showLabel !== false,
                  formatter: (_range: unknown, ctx: { dataIndex: number }) =>
                    bars[ctx.dataIndex]?.valueLabel ?? "",
                  anchor: (ctx: { dataIndex: number }) =>
                    bars[ctx.dataIndex]?.direction === "down" ? "start" : "end",
                  align: (ctx: { dataIndex: number }) =>
                    bars[ctx.dataIndex]?.direction === "down"
                      ? "bottom"
                      : "top",
                  color: colors.neutral,
                  font: { size: 10, weight: 600 },
                },
              },
            ],
          }}
          options={{
            maintainAspectRatio: false,
            layout: { padding: { right: 8 } },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  title: (items: Array<{ dataIndex: number }>) =>
                    bars[items[0]?.dataIndex]?.title ?? "",
                  label: (ctx: { dataIndex: number }) =>
                    bars[ctx.dataIndex]?.tooltipLines ?? [],
                },
              },
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { font: { size: 11 }, autoSkip: false },
              },
              y: {
                beginAtZero: valueRange?.min === undefined,
                ...valueRange,
                afterFit: pinAxisWidth,
                ticks: { font: { size: 11 }, precision: 0 },
              },
            },
          }}
        />
      </div>
      {secondary && (
        <div data-waterfall-secondary="" className="flex flex-col gap-1">
          <span
            className="text-body text-xs"
            style={{ paddingLeft: AXIS_WIDTH }}
          >
            {secondary.label}
          </span>
          <LineChart
            height={80}
            data={{
              labels,
              datasets: [
                {
                  label: secondary.label,
                  data: [...secondary.values],
                  borderColor: colors.neutral,
                  backgroundColor: withAlpha(colors.neutral, 0.08),
                  borderWidth: 1.5,
                  pointRadius: 0,
                  tension: 0,
                  fill: true,
                  spanGaps: false,
                  datalabels: { display: false },
                },
              ],
            }}
            options={{
              maintainAspectRatio: false,
              layout: { padding: { right: 8 } },
              plugins: {
                legend: { display: false },
                datalabels: { display: false },
                tooltip: {
                  bodyFont: {
                    family: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    size: 11,
                  },
                  callbacks: {
                    title: (items: Array<{ dataIndex: number }>) =>
                      bars[items[0]?.dataIndex]?.title ?? "",
                    label: (ctx: { parsed: { y: number | null } }) =>
                      ctx.parsed.y === null
                        ? ""
                        : `${secondary.label}: ${secondary.formatValue(ctx.parsed.y)}`,
                  },
                },
              },
              scales: {
                x: {
                  grid: { display: false },
                  border: { display: false },
                  ticks: { display: false },
                },
                y: {
                  beginAtZero: true,
                  afterFit: pinAxisWidth,
                  grid: { display: false },
                  ticks: {
                    font: { size: 10 },
                    maxTicksLimit: 3,
                    callback: (value: string | number) =>
                      secondary.formatAxisValue(Number(value)),
                  },
                },
              },
            }}
          />
        </div>
      )}
      <ChartDataTable
        caption={label}
        columns={
          secondary ? ["Period", "Value", secondary.label] : ["Period", "Value"]
        }
        rows={bars.map((bar, index) => ({
          id: bar.id,
          values: [
            bar.title,
            bar.valueLabel,
            ...(secondary
              ? [
                  secondary.values[index] == null
                    ? "—"
                    : secondary.formatValue(secondary.values[index]!),
                ]
              : []),
          ],
        }))}
      />
    </section>
  );
}
