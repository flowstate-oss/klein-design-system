"use client";
import { useChartTheme } from "./theme.js";
import { toolColour } from "./tool-colours.js";
import type { ReactNode } from "react";
export interface SegmentedBarSegment {
  id: string;
  label: string;
  /** Prepared percentage; clipping never changes the supplied text. */
  percentage: number;
  valueLabel: string;
  /** Optional application-formatted share (locale and precision stay outside). */
  shareLabel?: string;
  /** Optional explanation displayed with the legend. */
  description?: string;
  /** Ordered intensity for a sequential classification; never changes the label. */
  emphasis?: "strong" | "normal" | "subtle" | "faint";
  /** Semantic assessment, or a stable index in the controlled chart palette. */
  tone?: "neutral" | "good" | "watch" | "bad" | "accent";
  seriesIndex?: number;
  /** Stable tool identity; known aliases share one token color regardless of row rank. */
  identityKey?: string;
}
export interface SegmentedBarProps {
  label: string;
  segments: readonly SegmentedBarSegment[];
  /** Approved heights for table rows and summary bands. */
  size?: "small" | "medium";
  showLegend?: boolean;
  /** Optional prepared summary above the bar. */
  summary?: ReactNode;
  /** Optional prepared supporting information below the legend. */
  footer?: ReactNode;
  testIds?: { bar?: string; legendItem?: string; segment?: string };
}
const opacity = (segment: SegmentedBarSegment) =>
  ({ strong: 1, normal: 0.75, subtle: 0.5, faint: 0.25 })[
    segment.emphasis ?? "strong"
  ];
const color = (segment: SegmentedBarSegment, index: number, isDark: boolean) =>
  segment.tone
    ? `var(--k-${segment.tone === "neutral" ? "muted" : segment.tone === "accent" ? "klein" : segment.tone})`
    : segment.identityKey
      ? toolColour(segment.identityKey, isDark)
      : `var(--color-chart-${Math.max(0, Math.min(11, Math.floor(segment.seriesIndex ?? index))) + 1})`;
/** Prepared shares with a single palette mapping for bars and legends. */
export function SegmentedBar({
  label,
  segments,
  size = "small",
  showLegend = false,
  summary,
  footer,
  testIds,
}: SegmentedBarProps) {
  const { theme } = useChartTheme();
  return (
    <section aria-label={label} className="k-segmented-bar">
      {summary}
      {/* Containment keeps hidden accessible text inside scrolling table cells. */}
      <div
        className="k-segmented-bar-track"
        data-size={size}
        data-testid={testIds?.bar}
      >
        {segments.map((segment, index) => (
          <span
            key={segment.id}
            data-provider={segment.id}
            data-testid={testIds?.segment}
            aria-hidden="true"
            title={`${segment.label} ${segment.valueLabel}`}
            style={{
              width: `${Number.isFinite(segment.percentage) ? Math.max(0, Math.min(100, segment.percentage)) : 0}%`,
              background: color(segment, index, theme === "dark"),
              opacity: opacity(segment),
            }}
          />
        ))}
      </div>
      <ul className={showLegend ? "k-segmented-bar-legend" : "sr-only"}>
        {segments.map((segment, index) => (
          <li
            key={segment.id}
            data-provider={segment.id}
            data-testid={testIds?.legendItem}
          >
            <i
              aria-hidden="true"
              style={{
                background: color(segment, index, theme === "dark"),
                opacity: opacity(segment),
              }}
            />
            <span>{segment.label}</span>
            <strong>{segment.valueLabel}</strong>
            {segment.shareLabel && <span>{segment.shareLabel}</span>}
            {segment.description && <span>{segment.description}</span>}
          </li>
        ))}
      </ul>
      {footer}
    </section>
  );
}
