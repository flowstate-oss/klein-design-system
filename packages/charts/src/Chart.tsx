"use client";
import { BaseChart, type ChartElementClickParams } from "./chart-base.js";
import { CHART_PALETTE_LIGHT, CHART_PALETTE_DARK } from "./chart-palette.js";
import { useChartTheme } from "./theme.js";
/** A display-ready series. Values and labels are prepared by the application's data adapter. */
export interface ChartSeries {
  id: string;
  label: string;
  values: readonly (number | null)[];
}
/** Closed chart configuration: do not expose vendor options or calculate business metrics here. */
export interface ChartProps {
  label: string;
  description?: string;
  type: "bar" | "line" | "pie" | "doughnut";
  labels: readonly string[];
  series: readonly ChartSeries[];
  height?: number;
  loading?: boolean;
  stacked?: boolean;
  onPointSelect?: (point: ChartElementClickParams) => void;
}
export function Chart({
  label,
  description,
  type,
  labels,
  series,
  height = 300,
  loading = false,
  stacked = false,
  onPointSelect,
}: ChartProps) {
  const { theme } = useChartTheme();
  const CHART_PALETTE =
    theme === "dark" ? CHART_PALETTE_DARK : CHART_PALETTE_LIGHT;
  const data = {
    labels: [...labels],
    datasets: series.map((series, index) => ({
      label: series.label,
      data: [...series.values],
      backgroundColor:
        type === "pie" || type === "doughnut"
          ? CHART_PALETTE
          : CHART_PALETTE[index % CHART_PALETTE.length],
      borderColor: CHART_PALETTE[index % CHART_PALETTE.length],
      borderWidth: type === "line" ? 2 : 0,
    })),
  };
  return (
    <figure aria-label={label}>
      <figcaption>
        {label}
        {description && <p>{description}</p>}
      </figcaption>
      <BaseChart
        type={type}
        data={data}
        height={height}
        isLoading={loading}
        onElementClick={onPointSelect}
        options={
          type === "bar" || type === "line"
            ? {
                scales: { x: { stacked }, y: { stacked } },
                plugins: { datalabels: { display: false } },
              }
            : { plugins: { datalabels: { display: false } } }
        }
      />
    </figure>
  );
}
