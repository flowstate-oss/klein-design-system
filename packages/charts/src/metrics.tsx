"use client";
import {
  MetricStrip as Strip,
  type MetricStripProps as OriginalStripProps,
} from "./MetricStrip.js";
import {
  MetricGrid as Grid,
  type MetricGridProps as OriginalGridProps,
} from "./MetricGrid.js";
/** Six-metric wrapping strip with optional trend and a sparkline on the first metric. */
export type MetricStripProps = Omit<OriginalStripProps, "className">;
export function MetricStrip(props: MetricStripProps) {
  return <Strip {...props} />;
}
/** Responsive grid of up to four metrics; display-ready values supplied by the application. */
export type MetricGridProps = Omit<OriginalGridProps, "className">;
export function MetricGrid(props: MetricGridProps) {
  return <Grid {...props} />;
}
