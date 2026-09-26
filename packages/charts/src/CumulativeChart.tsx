"use client";

import React, { useMemo } from "react";
import { ChartDataTable } from "./ChartDataTable.js";
import { LineChart } from "./chart-base.js";
import { CHART_COLORS } from "./chart-config.js";

export interface CumulativePoint {
  month: string;
  monthDate: Date;
  monthlySpend: number;
  cumulativeSpend: number;
}

export interface CumulativeChartProps {
  data: CumulativePoint[];
  height?: number;
  currentMonth?: Date;
  labels: {
    title: string;
    description: string;
    empty: string;
    cumulative: string;
    period: string;
  };
  formatValue: (value: number) => string;
}

export function CumulativeChart({
  data,
  height = 350,
  currentMonth,
  labels,
  formatValue,
}: CumulativeChartProps) {
  const currentMonthLabel = useMemo(() => {
    if (!currentMonth) return null;
    const match = data.find(
      (d) =>
        d.monthDate &&
        d.monthDate.getMonth() === currentMonth.getMonth() &&
        d.monthDate.getFullYear() === currentMonth.getFullYear(),
    );
    return match?.month ?? null;
  }, [data, currentMonth]);

  const chartData = useMemo(() => {
    return {
      labels: data.map((d) => d.month),
      datasets: [
        {
          label: labels.cumulative,
          data: data.map((d) => d.cumulativeSpend),
          fill: true,
          backgroundColor: CHART_COLORS[0] + "33", // 20% opacity
          borderColor: CHART_COLORS[0],
          borderWidth: 2,
          pointBackgroundColor: CHART_COLORS[0],
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: CHART_COLORS[0],
          tension: 0, // monotone
        },
      ],
    };
  }, [data, labels, formatValue]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const index = context.dataIndex;
              const point = data[index];
              return [
                `${labels.cumulative}: ${formatValue(point.cumulativeSpend)}`,
                `${labels.period}: ${formatValue(point.monthlySpend)}`,
              ];
            },
          },
        },
      },
      scales: {
        y: {
          ticks: {
            callback: (value: any) => formatValue(Number(value)),
            font: { size: 11 },
          },
        },
        x: {
          ticks: { font: { size: 11 } },
          grid: { display: false },
        },
      },
    }),
    [data, labels, formatValue],
  );

  const plugins = useMemo(() => {
    if (!currentMonthLabel) return [];

    return [
      {
        id: "currentMonthLine",
        afterDraw: (chart: any) => {
          const ctx = chart.ctx;
          const xAxis = chart.scales.x;
          const yAxis = chart.scales.y;

          const index = data.findIndex((d) => d.month === currentMonthLabel);
          if (index === -1) return;

          const x = xAxis.getPixelForValue(index);

          if (x) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x, yAxis.top);
            ctx.lineTo(x, yAxis.bottom);
            ctx.lineWidth = 1;
            ctx.strokeStyle = "#059669";
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.restore();
          }
        },
      },
    ];
  }, [currentMonthLabel, data]);

  if (data.length === 0) {
    return (
      <div className="bg-background w-full rounded-none border border-stone-200 p-6">
        <p className="text-sm text-stone-500">{labels.empty}</p>
      </div>
    );
  }

  return (
    <div className="bg-background w-full rounded-none border border-stone-200 p-6">
      <div className="mb-2">
        <h3 className="text-secondary-foreground text-sm font-semibold">
          {labels.title}
        </h3>
        <p className="text-xs text-stone-500">{labels.description}</p>
      </div>
      <ChartDataTable
        caption={labels.title}
        columns={["Period", labels.period, labels.cumulative]}
        rows={data.map((point, index) => ({
          id: String(index),
          values: [
            point.month,
            formatValue(point.monthlySpend),
            formatValue(point.cumulativeSpend),
          ],
        }))}
      />
      <div style={{ height }}>
        <LineChart
          data={chartData}
          options={options}
          plugins={plugins}
          height="100%"
        />
      </div>
    </div>
  );
}
