"use client";

/**
 * MetricGrid — 1-4 KPI tiles for the Subject Detail pattern.
 *
 * Mirrors the KPI strip already shipped on `/ai` overview (WS-A8) but
 * extracted as a reusable primitive so subject-scoped pages
 * (`/me/ai-usage`, `/customer-ai/services/[id]`, …) feel cohesive with
 * the org-level surface.
 *
 * Constraints (per `docs/specs/ai-subject-detail-pattern.md`):
 *   - Strictly flat. No card chrome, no shadow.
 *   - 4 columns at `lg`, 2 at `sm`, 1 column on the narrowest viewport.
 *   - Numeric values render `font-mono font-semibold tabular-nums`.
 *   - Optional 30-day sparkline on the first tile only (sparkline on
 *     more than one tile clutters the orientation rail).
 */

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@klein-ui/react/compat/utils";

/**
 * Tile delta-emphasis policy. For most cost tiles a positive delta is
 * bad (more spend = worse). For adoption / coverage tiles a positive
 * delta is good. The viewer picks per-tile.
 */
export interface MetricGridDeltaLabels {
  /** Used as the title attribute when delta > 0. Receives the abs %. */
  up: (pct: number) => string;
  /** Used as the title attribute when delta < 0. Receives the abs %. */
  down: (pct: number) => string;
  /** Used when the delta rounds to 0%. */
  flat: string;
}

export interface MetricGridTile {
  /** Stable id — used for data-testid and React key. */
  id: string;
  /** Eyebrow label above the value (10px upper-case muted). */
  label: string;
  /** Accessible label that fully describes the tile to screen readers. */
  ariaLabel: string;
  /** The formatted value — usually currency, count, or percent. */
  value: string;
  /**
   * Fractional delta vs the previous period (e.g. 0.12 → 12%). Null
   * suppresses the delta indicator entirely.
   */
  delta?: number | null;
  /** Whether a positive delta should render red ("bad when up"). */
  deltaIsBadWhenUp?: boolean;
  /** Per-tile delta copy — wire through your i18n helper. */
  deltaLabels?: MetricGridDeltaLabels;
  /**
   * Optional sparkline points (raw numeric values). Only honoured on
   * the FIRST tile — the spec restricts the strip to a single
   * sparkline so the eye keeps moving across the row.
   */
  sparkPoints?: readonly number[];
  /** Aria-label for the sparkline SVG. */
  sparkLabel?: string;
  /** Optional click handler — turns the tile into a navigational target. */
  onClick?: () => void;
}

export interface MetricGridProps {
  /** Up to four tiles. Extra entries past index 3 are dropped on render. */
  tiles: readonly MetricGridTile[];
  /** When true, renders skeleton dots instead of values. */
  loading?: boolean;
  /** Extra class names — escape hatch for layout. */
  className?: string;
}

/**
 * Renders the KPI strip. Wraps to a 2- or 1-column grid on small
 * viewports so the row never overflows the page width.
 */
export function MetricGrid({
  tiles,
  loading = false,
  className,
}: MetricGridProps): React.JSX.Element {
  if (loading) {
    return (
      <div
        data-testid="subject-kpi-strip"
        aria-busy="true"
        className={cn(
          "flex h-8 items-center gap-6 text-sm text-muted-foreground/50",
          className,
        )}
      >
        <span>···</span>
      </div>
    );
  }

  const visible = tiles.slice(0, 4);
  return (
    <div
      data-testid="subject-kpi-strip"
      className={cn(
        "grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {visible.map((tile, idx) => (
        <MetricGridTile key={tile.id} tile={tile} allowSparkline={idx === 0} />
      ))}
    </div>
  );
}

interface MetricGridTileProps {
  tile: MetricGridTile;
  /** Only honour `sparkPoints` when this is true (first tile). */
  allowSparkline: boolean;
}

/**
 * Single tile. Flat. Mono value. Optional delta + sparkline.
 *
 * Renders as a `<button>` when `onClick` is provided so the tile is
 * keyboard-navigable; otherwise renders as a `<div>` so screen readers
 * don't announce it as interactive.
 */
function MetricGridTile({
  tile,
  allowSparkline,
}: MetricGridTileProps): React.JSX.Element {
  const showSparkline =
    allowSparkline &&
    tile.sparkPoints !== undefined &&
    tile.sparkPoints.length > 1;

  const content = (
    <>
      <div className="flex flex-col">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {tile.label}
        </span>
        <div className="flex items-baseline gap-2">
          <span
            data-testid={`subject-kpi-value-${tile.id}`}
            data-ai-numeric="kpi"
            className={cn(
              "font-mono text-base font-semibold tabular-nums text-foreground",
              tile.onClick !== undefined ? "group-hover:underline" : undefined,
            )}
          >
            {tile.value}
          </span>
          {tile.delta !== null && tile.delta !== undefined ? (
            <KpiDelta
              delta={tile.delta}
              badWhenUp={tile.deltaIsBadWhenUp ?? false}
              labels={tile.deltaLabels}
            />
          ) : null}
        </div>
      </div>
      {showSparkline ? (
        <KpiSparkline
          points={tile.sparkPoints ?? []}
          label={tile.sparkLabel ?? tile.ariaLabel}
        />
      ) : null}
    </>
  );

  if (tile.onClick !== undefined) {
    return (
      <button
        type="button"
        onClick={tile.onClick}
        aria-label={tile.ariaLabel}
        data-testid={`subject-kpi-tile-${tile.id}`}
        className="group flex items-center gap-3 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {content}
      </button>
    );
  }

  return (
    <div
      aria-label={tile.ariaLabel}
      data-testid={`subject-kpi-tile-${tile.id}`}
      className="flex items-center gap-3"
    >
      {content}
    </div>
  );
}

/** Inline percentage indicator with arrow. Red/green based on `badWhenUp`. */
function KpiDelta({
  delta,
  badWhenUp,
  labels,
}: {
  delta: number;
  badWhenUp: boolean;
  labels?: MetricGridDeltaLabels;
}): React.JSX.Element | null {
  const pct = Math.round(Math.abs(delta) * 100);
  if (pct === 0) {
    return (
      <span
        data-testid="subject-kpi-delta"
        data-tone="flat"
        className="inline-flex items-center gap-0.5 font-mono text-xs text-muted-foreground"
        title={labels?.flat}
      >
        =
      </span>
    );
  }
  const isUp = delta > 0;
  const Icon = isUp ? ArrowUpRight : ArrowDownRight;
  const isBad = badWhenUp ? isUp : !isUp;
  const colour = isBad
    ? "text-rose-600 dark:text-rose-400"
    : "text-emerald-600 dark:text-emerald-400";
  const title = isUp ? labels?.up(pct) : labels?.down(pct);
  return (
    <span
      data-testid="subject-kpi-delta"
      data-tone={isBad ? "bad" : "good"}
      className={cn(
        "inline-flex items-center gap-0.5 font-mono text-xs font-semibold tabular-nums",
        colour,
      )}
      title={title}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {pct}%
    </span>
  );
}

/** Tiny inline SVG sparkline — no chart.js dependency. */
function KpiSparkline({
  points,
  label,
}: {
  points: readonly number[];
  label: string;
}): React.JSX.Element {
  const width = 64;
  const height = 20;
  const max = Math.max(...points, 0.0001);
  const min = Math.min(...points, 0);
  const range = max - min === 0 ? 1 : max - min;
  const stepX = points.length > 1 ? width / (points.length - 1) : width;
  const path = points
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * (height - 2) - 1;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
  // The `ai-sparkline` class is keyed in `globals.css` inside the
  // `.ai-surfaces` block so the stroke colour and width come from the AI
  // Terminal design language when this primitive renders under the scope;
  // outside the scope it falls back to the muted-foreground colour.
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      data-testid="subject-kpi-sparkline"
      className="ai-sparkline text-muted-foreground"
    >
      <path d={path} stroke="currentColor" strokeWidth={1.25} fill="none" />
    </svg>
  );
}
