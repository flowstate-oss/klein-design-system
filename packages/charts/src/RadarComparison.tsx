"use client";

import React, { useMemo } from "react";
import { ChartDataTable } from "./ChartDataTable.js";
import { RadarChart } from "./chart-base.js";
import { useMeasure } from "@uidotdev/usehooks";
export interface RadarComparisonSeries {
  id: string;
  label: string;
  axes: readonly { id: string; label: string; value: number }[];
  coverageScore: number;
  balanceScore: number;
}
import { CHART_COLORS, CHART_COLORS_DARK } from "./chart-config.js";
import { useChartTheme as useTheme } from "./theme.js";

export interface RadarComparisonProps {
  series: readonly RadarComparisonSeries[];
  height?: number;
  labels: { coverage: string; balance: string };
}

export function RadarComparison({
  series,
  labels,
  height = 450,
}: RadarComparisonProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const palette = isDark ? CHART_COLORS_DARK : CHART_COLORS;

  const [ref, { width }] = useMeasure<HTMLDivElement>();

  const { chartJsData, seriesKeys } = useMemo(() => {
    if (series.length === 0) {
      return {
        chartJsData: { labels: [], datasets: [] },
        seriesKeys: [] as string[],
      };
    }

    const allSkills = new Set<string>();
    series.forEach((data) => {
      data.axes.forEach((axis) => allSkills.add(axis.label));
    });

    const skills = Array.from(allSkills);
    const seriesKeys = series.map((scenario) => scenario.label);

    const datasets = series.map((scenario, index) => {
      const color = palette[index % palette.length];
      return {
        label: scenario.label,
        data: skills.map((skill) => {
          const axis = scenario.axes.find((a) => a.label === skill);
          return axis ? axis.value : null;
        }),
        backgroundColor: color + "33", // 20% opacity
        borderColor: color,
        borderWidth: 2,
        pointBackgroundColor: color,
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: color,
      };
    });

    return {
      chartJsData: {
        labels: skills,
        datasets,
      },
      seriesKeys,
    };
  }, [series, palette]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: (width || 0) > 350,
        position: "bottom" as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) =>
            `${context.dataset.label}: ${context.raw.toFixed(1)}%`,
        },
      },
    },
    scales: {
      r: {
        angleLines: {
          display: true,
        },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          callback: (value: any) => `${value}%`,
          backdropColor: "transparent",
          stepSize: 20,
        },
        pointLabels: {
          font: {
            size: 11,
          },
        },
      },
    },
  };

  return (
    <div className="bg-background w-full rounded-none border border-stone-200 p-4">
      <div style={{ height }} ref={ref}>
        <RadarChart data={chartJsData} options={options} height="100%" />
      </div>

      <ChartDataTable
        caption="Chart data"
        columns={["Series", "Axis", "Value"]}
        rows={series.flatMap((row) =>
          row.axes.map((axis) => ({
            id: `${row.id}:${axis.id}`,
            values: [row.label, axis.label, `${axis.value}%`],
          })),
        )}
      />
      {/* Skill Coverage Scores */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {series.map((data) => (
          <div
            key={data.id}
            className="bg-surface-1 rounded-none border border-stone-200 p-4"
          >
            <h4 className="text-secondary-foreground mb-2 text-sm font-semibold">
              {data.label}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">
                  {labels.coverage}:
                </span>
                <span className="text-secondary-foreground ml-2 font-semibold">
                  {data.coverageScore.toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">{labels.balance}:</span>
                <span className="text-secondary-foreground ml-2 font-semibold">
                  {data.balanceScore.toFixed(1)}%
                </span>
              </div>
            </div>
            {/* Progress bars */}
            <div className="mt-3 space-y-2">
              <div>
                <div className="text-muted-foreground mb-1 flex items-center justify-between text-xs">
                  <span>{labels.coverage}</span>
                  <span>{data.coverageScore.toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-stone-200">
                  <div
                    className="h-2 rounded-full bg-blue-600 transition-all"
                    style={{ width: `${Math.min(100, data.coverageScore)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1 flex items-center justify-between text-xs">
                  <span>{labels.balance}</span>
                  <span>{data.balanceScore.toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-stone-200">
                  <div
                    className="h-2 rounded-full bg-green-600 transition-all"
                    style={{ width: `${Math.min(100, data.balanceScore)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
