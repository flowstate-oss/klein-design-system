"use client";

import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  TimeSeriesScale,
} from "chart.js";
import { Bar, Line, Pie, Doughnut, Radar, Scatter } from "react-chartjs-2";
import { Skeleton } from "@klein-ui/react/compat/skeleton";
import { useChartTheme as useTheme } from "./theme.js";
import {
  COMMON_OPTIONS,
  CHART_COLORS,
  CHART_COLORS_DARK,
} from "./chart-config.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

// Register plugins globally
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  TimeSeriesScale,
  ChartDataLabels,
);

/** Payload emitted when a chart element is clicked. */
export interface ChartElementClickParams {
  /** Index of the dataset (series) that was clicked */
  datasetIndex: number;
  /** Index of the data point within the dataset */
  index: number;
  /** X-axis label (or segment label for pie/doughnut) */
  label: string;
  /** Dataset label (series name) */
  datasetLabel: string;
  /** Numeric value of the clicked element */
  value: number;
}

interface BaseChartProps {
  data: any;
  options?: any;
  isLoading?: boolean;
  height?: number | string;
  className?: string;
  type?: "bar" | "line" | "pie" | "doughnut" | "radar" | "scatter";
  plugins?: any[];
  /** Called when a chart element (bar, point, segment) is clicked. */
  onElementClick?: (params: ChartElementClickParams) => void;
}

export const BaseChart = ({
  data,
  options,
  isLoading,
  height = 300,
  className,
  type = "bar",
  plugins = [],
  onElementClick,
}: BaseChartProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const chartOptions = useMemo(() => {
    const baseOptions = { ...COMMON_OPTIONS, ...options };

    // Radial chart types don't use cartesian scales — strip them
    const radialTypes = ["pie", "doughnut", "radar"];
    if (radialTypes.includes(type)) {
      delete baseOptions.scales;
    }

    // Merge plugin options
    baseOptions.plugins = {
      ...COMMON_OPTIONS.plugins,
      ...(options?.plugins || {}),
      legend: {
        ...COMMON_OPTIONS.plugins.legend,
        ...(options?.plugins?.legend || {}),
        labels: {
          ...COMMON_OPTIONS.plugins.legend.labels,
          color: isDark ? "#e5e7eb" : "#374151", // gray-200 : gray-700
          ...(options?.plugins?.legend?.labels || {}),
        },
      },
      tooltip: {
        ...COMMON_OPTIONS.plugins.tooltip,
        ...(options?.plugins?.tooltip || {}),
        backgroundColor: isDark ? "#1f2937" : "#ffffff", // gray-800 : white
        titleColor: isDark ? "#f9fafb" : "#111827", // gray-50 : gray-900
        bodyColor: isDark ? "#e5e7eb" : "#374151", // gray-200 : gray-700
        borderColor: isDark ? "#374151" : "#e5e7eb", // gray-700 : gray-200
        borderWidth: 1,
      },
    };

    // Apply scale colors
    if (baseOptions.scales) {
      Object.keys(baseOptions.scales).forEach((scale) => {
        if (baseOptions.scales[scale].grid) {
          baseOptions.scales[scale].grid.color = isDark
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.1)";
        }
        if (baseOptions.scales[scale].ticks) {
          baseOptions.scales[scale].ticks.color = isDark
            ? "#9ca3af"
            : "#6b7280"; // gray-400 : gray-500
        }
      });
    }

    // Wire click handler for interactive charts
    if (onElementClick) {
      baseOptions.onClick = (
        _event: unknown,
        elements: Array<{ datasetIndex: number; index: number }>,
      ) => {
        if (elements.length === 0) return;
        const el = elements[0];
        const dsLabel = String(data.datasets?.[el.datasetIndex]?.label ?? "");
        const lbl = String(data.labels?.[el.index] ?? "");
        const rawVal = data.datasets?.[el.datasetIndex]?.data?.[el.index];
        onElementClick({
          datasetIndex: el.datasetIndex,
          index: el.index,
          label: lbl,
          datasetLabel: dsLabel,
          value: Number(rawVal ?? 0),
        });
      };

      // Show pointer cursor on hover over clickable elements
      baseOptions.onHover = (
        event: { native?: { target?: { style?: { cursor: string } } } },
        elements: unknown[],
      ) => {
        const target = event.native?.target;
        if (target?.style) {
          target.style.cursor = elements.length > 0 ? "pointer" : "default";
        }
      };
    }

    return baseOptions;
  }, [options, isDark, type, onElementClick, data]);

  // Loading State
  if (isLoading) {
    return (
      <div className={className} style={{ height }}>
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    );
  }

  // Empty State (if data is missing or empty)
  if (!data || !data.datasets || data.datasets.length === 0) {
    return (
      <div
        className={`bg-muted/20 flex items-center justify-center rounded-lg border border-dashed ${className}`}
        style={{ height }}
      >
        <p className="text-muted-foreground text-sm">No data available</p>
      </div>
    );
  }

  // Render correct chart type
  const ChartComponent = {
    bar: Bar,
    line: Line,
    pie: Pie,
    doughnut: Doughnut,
    radar: Radar,
    scatter: Scatter,
  }[type];

  return (
    <div className={`relative w-full ${className}`} style={{ height }}>
      <ChartComponent data={data} options={chartOptions} plugins={plugins} />
    </div>
  );
};

// Export specific components for ease of use
export const BarChart = (props: Omit<BaseChartProps, "type">) => (
  <BaseChart {...props} type="bar" />
);
export const LineChart = (props: Omit<BaseChartProps, "type">) => (
  <BaseChart {...props} type="line" />
);
export const PieChart = (props: Omit<BaseChartProps, "type">) => (
  <BaseChart {...props} type="pie" />
);
export const DoughnutChart = (props: Omit<BaseChartProps, "type">) => (
  <BaseChart {...props} type="doughnut" />
);
export const RadarChart = (props: Omit<BaseChartProps, "type">) => (
  <BaseChart {...props} type="radar" />
);
export const ScatterChart = (props: Omit<BaseChartProps, "type">) => (
  <BaseChart {...props} type="scatter" />
);
