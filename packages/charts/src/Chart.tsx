"use client";
import { useEffect, useRef, useState } from "react";
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
  axis?: "primary" | "secondary";
  lineStyle?: "solid" | "dashed";
  /** Bridge nulls without replacing their values. Defaults to showing gaps. */
  connectMissing?: boolean;
  /** Non-numeric placeholder while this series is loading; supply null values. */
  pending?: boolean;
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
  showLegend?: boolean | "responsive";
  orientation?: "vertical" | "horizontal";
  valueRange?: { min?: number; max?: number };
  /** A separately labelled scale for a different unit. Values are never converted by the chart. */
  secondaryAxis?: {
    label: string;
    formatValue: (value: number) => string;
    range?: { min?: number; max?: number };
  };
  /** Emphasize filter matches without hiding other data. */
  highlight?: { seriesIds?: readonly string[]; pointIds?: readonly string[] };
  loading?: boolean;
  stacked?: boolean;
  /** Application-owned number, currency or ratio formatting. */
  formatValue?: (value: number) => string;
  /** Target on the same axis; applicable to bar, line and area. Never included in stacked totals. */
  referenceLine?: { label: string; value: number };
  /** Prepared interval for unstacked line/area charts. Both bounds use the primary unit. */
  rangeBand?: {
    label: string;
    lower: readonly (number | null)[];
    upper: readonly (number | null)[];
  };
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
  secondaryAxis,
  highlight,
  loading = false,
  stacked = false,
  formatValue = String,
  referenceLine,
  rangeBand,
  pointIds,
  onPointSelect,
}: ChartProps) {
  const { theme } = useChartTheme();
  const plotRef = useRef<HTMLDivElement>(null);
  const [plotWidth, setPlotWidth] = useState(0);
  useEffect(() => {
    if (showLegend !== "responsive" || !plotRef.current) return;
    const element = plotRef.current;
    const measure = () => setPlotWidth(element.getBoundingClientRect().width);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [showLegend]);
  const palette = theme === "dark" ? CHART_PALETTE_DARK : CHART_PALETTE_LIGHT;
  const cartesian = type === "bar" || type === "line" || type === "area";
  const target = cartesian ? referenceLine : undefined;
  const band =
    (type === "line" || type === "area") && !stacked ? rangeBand : undefined;
  const seriesCount = series.length + (target ? 1 : 0);
  const formatSeriesValue = (item: ChartSeries | undefined, value: number) =>
    item?.axis === "secondary" && secondaryAxis
      ? secondaryAxis.formatValue(value)
      : formatValue(value);
  const data = {
    labels: [...labels],
    datasets: [
      ...series.map((item, index) => ({
        label: item.label,
        data: [...item.values],
        spanGaps: item.connectMissing ?? false,
        ...(cartesian && item.axis === "secondary" && secondaryAxis
          ? {
              [orientation === "horizontal" ? "xAxisID" : "yAxisID"]:
                "secondary",
            }
          : {}),
        borderDash: item.lineStyle === "dashed" ? [5, 5] : undefined,
        backgroundColor: cartesian
          ? palette[index % palette.length] +
            (highlight?.seriesIds?.length &&
            !highlight.seriesIds.includes(item.id)
              ? "40"
              : type === "area"
                ? "66"
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
      ...(band
        ? [
            {
              type: "line",
              label: `${band.label} lower`,
              data: [...band.lower],
              borderWidth: 0,
              pointRadius: 0,
              fill: false,
              stack: "band-lower",
              order: 10,
            },
            {
              type: "line",
              label: `${band.label} upper`,
              data: [...band.upper],
              borderWidth: 0,
              backgroundColor: palette[1] + "26",
              pointRadius: 0,
              fill: { target: seriesCount },
              stack: "band-upper",
              order: 10,
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
      <div className="k-chart-plot" ref={plotRef}>
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
                    ...(secondaryAxis
                      ? {
                          secondary: {
                            axis: orientation === "horizontal" ? "x" : "y",
                            position:
                              orientation === "horizontal" ? "top" : "right",
                            grid: { drawOnChartArea: false },
                            title: { display: true, text: secondaryAxis.label },
                            ...secondaryAxis.range,
                            ticks: {
                              callback: (value: string | number) =>
                                secondaryAxis.formatValue(Number(value)),
                            },
                          },
                        }
                      : {}),
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
              legend: {
                display:
                  showLegend === "responsive" ? plotWidth > 350 : showLegend,
                position: "bottom",
                labels: {
                  filter: (item: { datasetIndex?: number }) =>
                    (item.datasetIndex ?? 0) < seriesCount,
                },
              },
              datalabels: { display: false },
              tooltip: {
                filter: (item: { datasetIndex: number }) =>
                  item.datasetIndex < seriesCount,
                callbacks: {
                  label: (context: {
                    dataset: { label?: string };
                    datasetIndex: number;
                    raw: unknown;
                  }) =>
                    `${context.dataset.label ?? ""}: ${context.raw == null ? "—" : formatSeriesValue(series[context.datasetIndex], Number(context.raw))}`,
                },
              },
            },
          }}
        />
        {series.some((item) => item.pending) && (
          <span
            aria-hidden="true"
            data-testid="chart-pending-band"
            className="k-chart-pending"
          />
        )}
      </div>
      <ChartDataTable
        caption={`${label} data`}
        columns={[
          "Period",
          ...series.map((item) => item.label),
          ...(target ? [target.label] : []),
          ...(band ? [`${band.label} lower`, `${band.label} upper`] : []),
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
                  aria-label={`${item.label}, ${heading}: ${formatSeriesValue(item, item.values[index]!)}`}
                >
                  {formatSeriesValue(item, item.values[index]!)}
                </Button>
              ) : (
                formatSeriesValue(item, item.values[index]!)
              ),
            ),
            ...(target ? [formatValue(target.value)] : []),
            ...(band
              ? [
                  band.lower[index] == null
                    ? "—"
                    : formatValue(band.lower[index]!),
                  band.upper[index] == null
                    ? "—"
                    : formatValue(band.upper[index]!),
                ]
              : []),
          ],
        }))}
      />
    </figure>
  );
}
