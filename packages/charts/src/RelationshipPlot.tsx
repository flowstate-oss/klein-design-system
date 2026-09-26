"use client";
import { Button } from "@klein-ui/react";
import { ScatterChart } from "./chart-base.js";
import { resolveColor } from "./chart-config.js";
import { ChartDataTable } from "./ChartDataTable.js";
/** A positioned point. Its size, assessment and tooltip values come from the application. */
export interface RelationshipPoint {
  /** Stable identity emitted on selection. */
  id: string;
  /** Accessible, application-localized label. */
  label: string;
  /** Prepared horizontal value; no domain transformations are applied. */
  x: number;
  /** Prepared vertical value. */
  y: number;
  /** Prepared bubble radius in pixels; defaults to 5. */
  radius?: number;
  /** Semantic assessment of this point. */
  tone?: "neutral" | "good" | "watch" | "bad";
  /** Formatted tooltip and accessible table details. */
  details?: readonly string[];
}
export interface RelationshipPlotProps {
  /** Accessible, application-localized label. */
  label: string;
  /** Ordered display model, including all permission filtering. */
  points: readonly RelationshipPoint[];
  /** Horizontal axis label and optional display bounds. */
  xAxis: { label: string; min?: number; max?: number };
  /** Vertical axis label and optional display bounds. */
  yAxis: { label: string; min?: number; max?: number };
  /** Plot height, or fill a bounded parent. */
  height?: number | "fill";
  /** Receives a point ID from pointer or keyboard selection. */
  onPointSelect?: (id: string) => void;
}
/** Compare two measured dimensions; bubble size and semantic meaning are explicitly supplied. */
export function RelationshipPlot({
  label,
  points,
  xAxis,
  yAxis,
  height = 300,
  onPointSelect,
}: RelationshipPlotProps) {
  const select = (index: number) => {
    const point = points[index];
    if (point) onPointSelect?.(point.id);
  };
  return (
    <figure
      aria-label={label}
      className={height === "fill" ? "k-chart k-chart-fill" : "k-chart"}
    >
      <div className="k-chart-plot">
        <ScatterChart
          height={height === "fill" ? "100%" : height}
          data={{
            datasets: [
              {
                label,
                data: points.map((point) => ({ x: point.x, y: point.y })),
                backgroundColor: points.map((point) =>
                  resolveColor(
                    `var(--color-${point.tone && point.tone !== "neutral" ? point.tone : "primary"})`,
                  ),
                ),
                pointRadius: (context: { dataIndex: number }) =>
                  points[context.dataIndex]?.radius ?? 5,
              },
            ],
          }}
          onElementClick={
            onPointSelect ? (point) => select(point.index) : undefined
          }
          options={{
            scales: {
              x: {
                min: xAxis.min,
                max: xAxis.max,
                title: { display: true, text: xAxis.label },
              },
              y: {
                min: yAxis.min,
                max: yAxis.max,
                title: { display: true, text: yAxis.label },
              },
            },
            plugins: {
              legend: { display: false },
              datalabels: { display: false },
              tooltip: {
                callbacks: {
                  label: (context: { dataIndex: number }) => {
                    const point = points[context.dataIndex];
                    return point
                      ? [
                          point.label,
                          ...(point.details ?? [
                            `${xAxis.label}: ${point.x}`,
                            `${yAxis.label}: ${point.y}`,
                          ]),
                        ]
                      : [];
                  },
                },
              },
            },
          }}
        />
      </div>
      <ChartDataTable
        caption={`${label} data`}
        columns={["Item", xAxis.label, yAxis.label, "Details"]}
        rows={points.map((point) => ({
          id: point.id,
          values: [
            onPointSelect ? (
              <Button
                variant="text"
                size="sm"
                onClick={() => onPointSelect(point.id)}
              >
                {point.label}
              </Button>
            ) : (
              point.label
            ),
            point.x,
            point.y,
            point.details?.join("; "),
          ],
        }))}
      />
    </figure>
  );
}
