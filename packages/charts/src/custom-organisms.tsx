"use client";
import type { ComponentProps } from "react";
import { BubbleChart } from "./BubbleChart.js";
import { BurndownChart, type BurndownChartProps } from "./BurndownChart.js";
import { GanttChart, type GanttChartProps } from "./GanttChart.js";
/** Positioned capacity bubbles. Radius, positions and change values come from the application. */
export type CapacityBubbleChartProps = ComponentProps<typeof BubbleChart>;
export function CapacityBubbleChart(props: CapacityBubbleChartProps) {
  return <BubbleChart {...props} />;
}
/** Cumulative forecast versus actual, with a supplied current-period marker. */
export type ForecastActualChartProps = Omit<BurndownChartProps, "className">;
export function ForecastActualChart(props: ForecastActualChartProps) {
  return <BurndownChart {...props} />;
}
/** Scheduled allocations as display-ready tasks; this organism does not calculate capacity. */
export type AllocationTimelineProps = GanttChartProps;
export function AllocationTimeline(props: AllocationTimelineProps) {
  return <GanttChart {...props} />;
}
