"use client";
import { Button } from "@klein-ui/react";
import { BaseChart } from "./chart-base.js";
import { CHART_PALETTE_LIGHT, CHART_PALETTE_DARK } from "./chart-palette.js";
import { useChartTheme } from "./theme.js";
import { ChartDataTable } from "./ChartDataTable.js";
/** A display-ready series. Application adapters prepare values and labels. */
export interface ChartSeries {
  id: string;
  label: string;
  values: readonly (number | null)[];
}
export interface ChartPointSelection {
  seriesId: string;
  pointId: string;
  label: string;
  value: number;
}
interface ChartBaseProps {
  label: string;
  description?: string;
  type: "bar" | "line" | "area" | "pie" | "doughnut";
  labels: readonly string[];
  series: readonly ChartSeries[];
  height?: number | "fill";
  showCaption?: boolean;
  showLegend?: boolean;
  orientation?: "vertical" | "horizontal";
  valueRange?: { min?: number; max?: number };
  /** Emphasize filter matches without hiding other data. */
  highlight?: { seriesIds?: readonly string[]; pointIds?: readonly string[] };
  loading?: boolean;
  stacked?: boolean;
  /** Application-owned number, currency or ratio formatting. */
  formatValue?: (value: number) => string;
  /** Target on the same axis; applicable to bar, line and area. Never included in stacked totals. */
  referenceLine?: { label: string; value: number };
}
/** Closed chart configuration. Interactive points require stable identities, not vendor indices. */
export type ChartProps = ChartBaseProps &
  (
    | {
        pointIds: readonly string[];
        onPointSelect: (point: ChartPointSelection) => void;
      }
    | { pointIds?: readonly string[]; onPointSelect?: undefined }
  );
export function Chart({
  label,
  description,
  type,
  labels,
  series,
  height = 300,
  showCaption = true,
  showLegend = true,
  orientation = "vertical",
  valueRange,
  highlight,
  loading = false,
  stacked = false,
  formatValue = String,
  referenceLine,
  pointIds,
  onPointSelect,
}: ChartProps) {
  const { theme } = useChartTheme();
  const palette = theme === "dark" ? CHART_PALETTE_DARK : CHART_PALETTE_LIGHT;
  const cartesian = type === "bar" || type === "line" || type === "area";
  const target = cartesian ? referenceLine : undefined;
  const data = {
    labels: [...labels],
    datasets: [
      ...series.map((item, index) => ({
        label: item.label,
        data: [...item.values],
        backgroundColor: cartesian
          ? palette[index % palette.length] +
            (highlight?.seriesIds?.length &&
            !highlight.seriesIds.includes(item.id)
              ? "40"
              : "")
          : labels.map(
              (_, pointIndex) =>
                palette[pointIndex % palette.length] +
                (highlight?.pointIds?.length &&
                !highlight.pointIds.includes(pointIds?.[pointIndex] ?? "")
                  ? "40"
                  : ""),
            ),
        borderColor:
          palette[index % palette.length] +
          (highlight?.seriesIds?.length &&
          !highlight.seriesIds.includes(item.id)
            ? "40"
            : ""),
        borderWidth: type === "line" || type === "area" ? 2 : 0,
        fill: type === "area",
        ...(cartesian && stacked ? { stack: "values" } : {}),
      })),
      ...(target
        ? [
            {
              type: "line",
              label: target.label,
              data: labels.map(() => target.value),
              borderColor: palette[5],
              backgroundColor: palette[5],
              borderDash: [4, 4],
              borderWidth: 1.5,
              pointRadius: 0,
              fill: false,
              stack: "target",
              order: -1,
            },
          ]
        : []),
    ],
  };
  const select = (seriesIndex: number, index: number) => {
    const item = series[seriesIndex];
    const pointId = pointIds?.[index];
    const value = item?.values[index];
    if (item && pointId !== undefined && value != null)
      onPointSelect?.({
        seriesId: item.id,
        pointId,
        label: labels[index],
        value,
      });
  };
  return (
    <figure
      aria-label={label}
      className={height === "fill" ? "k-chart k-chart-fill" : "k-chart"}
    >
      <figcaption hidden={!showCaption}>
        {label}
        {description && <p>{description}</p>}
      </figcaption>
      <div className="k-chart-plot">
        <BaseChart
          type={type === "area" ? "line" : type}
          data={data}
          height={height === "fill" ? "100%" : height}
          isLoading={loading}
          onElementClick={
            onPointSelect
              ? (point) => select(point.datasetIndex, point.index)
              : undefined
          }
          options={{
            ...(cartesian
              ? {
                  indexAxis: orientation === "horizontal" ? "y" : "x",
                  scales: {
                    [orientation === "horizontal" ? "y" : "x"]: { stacked },
                    [orientation === "horizontal" ? "x" : "y"]: {
                      stacked,
                      beginAtZero: valueRange?.min === undefined,
                      ...valueRange,
                      ticks: {
                        callback: (value: string | number) =>
                          formatValue(Number(value)),
                      },
                    },
                  },
                }
              : {}),
            plugins: {
              legend: { display: showLegend, position: "bottom" },
              datalabels: { display: false },
              tooltip: {
                callbacks: {
                  label: (context: {
                    dataset: { label?: string };
                    raw: unknown;
                  }) =>
                    `${context.dataset.label ?? ""}: ${context.raw == null ? "—" : formatValue(Number(context.raw))}`,
                },
              },
            },
          }}
        />
      </div>
      <ChartDataTable
        caption={`${label} data`}
        columns={[
          "Period",
          ...series.map((item) => item.label),
          ...(target ? [target.label] : []),
        ]}
        rows={labels.map((heading, index) => ({
          id: pointIds?.[index] ?? String(index),
          values: [
            heading,
            ...series.map((item, seriesIndex) =>
              item.values[index] == null ? (
                "—"
              ) : onPointSelect ? (
                <Button
                  variant="text"
                  size="sm"
                  type="button"
                  onClick={() => select(seriesIndex, index)}
                  aria-label={`${item.label}, ${heading}: ${formatValue(item.values[index]!)}`}
                >
                  {formatValue(item.values[index]!)}
                </Button>
              ) : (
                formatValue(item.values[index]!)
              ),
            ),
            ...(target ? [formatValue(target.value)] : []),
          ],
        }))}
      />
    </figure>
  );
}
