"use client";

import React, { useMemo } from "react";
import { ChartDataTable } from "./ChartDataTable.js";
import { DoughnutChart } from "./chart-base.js";
import { CHART_COLORS as SKILL_COLORS } from "./chart-config.js";

export interface DistributionItem {
  id: string;
  label: string;
  count: number;
  percentage: number;
}

export interface DistributionChartProps {
  label: string;
  total: number;
  items: DistributionItem[];
  height?: number;
  emptyLabel: string;
  formatCount: (count: number) => string;
}

export function DistributionChart({
  label,
  total,
  items,
  height = 300,
  emptyLabel,
  formatCount,
}: DistributionChartProps) {
  const chartData = useMemo(() => {
    return {
      labels: items.map((s) => s.label),
      datasets: [
        {
          data: items.map((s) => s.count),
          backgroundColor: items.map(
            (_, index) => SKILL_COLORS[index % SKILL_COLORS.length],
          ),
          borderWidth: 0,
        },
      ],
    };
  }, [items, formatCount]);

  const options = useMemo(
    () => ({
      cutout: "60%",
      plugins: {
        legend: {
          position: "bottom" as const,
          labels: { usePointStyle: true, boxWidth: 8 },
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const index = context.dataIndex;
              const item = items[index];
              return `${item.label}: ${formatCount(item.count)} (${item.percentage.toFixed(1)}%)`;
            },
          },
        },
        datalabels: {
          display: (context: any) => {
            const index = context.dataIndex;
            const item = items[index];
            return item.percentage >= 5;
          },
          color: "white",
          formatter: (value: number, context: any) => {
            const index = context.dataIndex;
            return Math.round(items[index].percentage) + "%";
          },
          font: {
            weight: "bold" as const,
          },
        },
      },
    }),
    [items, formatCount],
  );

  if (items.length === 0) {
    return (
      <div className="bg-background rounded-none border border-stone-200 p-6">
        <h3 className="text-secondary-foreground text-sm font-semibold">
          {label}
        </h3>
        <p className="mt-2 text-xs text-stone-500">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-none border border-stone-200 p-4">
      <div className="mb-1">
        <h3 className="text-secondary-foreground text-sm font-semibold">
          {label}
        </h3>
        <p className="text-xs text-stone-500">{formatCount(total)}</p>
      </div>

      <ChartDataTable
        caption={label}
        columns={["Category", "Count", "Percent"]}
        rows={items.map((item) => ({
          id: item.id,
          values: [item.label, formatCount(item.count), `${item.percentage}%`],
        }))}
      />
      <div className="relative" style={{ height }}>
        <DoughnutChart data={chartData} options={options} height="100%" />

        {/* Center Text Overlay */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-8">
          <div className="text-base font-semibold text-stone-900 dark:text-stone-100">
            {total}
          </div>
          <div className="text-xs text-stone-500">Total</div>
        </div>
      </div>
    </div>
  );
}
