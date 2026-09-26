"use client";

/**
 * MetricStrip — dense KPI tile strip for AI Terminal pages.
 *
 * Differs from `SubjectKpiStrip` in two ways:
 *   1. Up to 6 tiles (org pages routinely need 4–6 measures), not 4.
 *   2. Renders in a single horizontal row that wraps on narrow viewports.
 *      `SubjectKpiStrip` always goes to a grid.
 *
 * Visual recipe (per `docs/specs/ai-terminal-design-language.md`):
 *   - 10px uppercase mono eyebrow label.
 *   - 16px Geist Mono semibold numeric value (`tabular-nums`).
 *   - Optional inline accent-green delta (positive when good, rose when bad).
 *   - Optional 20px sparkline next to the value on the FIRST tile only.
 *
 * The strip is strictly flat — no card chrome, no shadows. Use
 * `AiSectionDivider` above for an eyebrow label.
 */

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@klein-ui/react/compat/utils";
import { Sparkline as AiSparkline } from "./Sparkline.js";

export interface MetricDeltaLabels {
  /** Title attribute when delta > 0 (receives the absolute % integer). */
  up: (pct: number) => string;
  /** Title attribute when delta < 0. */
  down: (pct: number) => string;
  /** Title attribute when the delta rounds to 0. */
  flat: string;
}

export interface MetricTile {
  /** Stable id — used for data-testid and React key. */
  id: string;
  /** 10px uppercase mono eyebrow label. */
  label: string;
  /** Accessible label fully describing the tile to screen readers. */
  ariaLabel: string;
  /** Formatted value (currency, count, percent, etc). */
  value: string;
  /**
   * Fractional delta vs previous period (e.g. 0.12 → 12%). Null suppresses
   * the delta indicator.
   */
  delta?: number | null;
  /** Whether a positive delta should render rose ("bad when up"). */
  deltaIsBadWhenUp?: boolean;
  /** Per-tile delta copy — wire through your i18n helper. */
  deltaLabels?: MetricDeltaLabels;
  /**
   * Optional sparkline series. Only the FIRST tile renders a sparkline
   * even when others supply points; the spec restricts the row to one
   * sparkline so the eye keeps scanning across.
   */
  sparkPoints?: readonly number[];
  /** Accessible label for the sparkline. */
  sparkLabel?: string;
  /** Optional click handler — turns the tile into a navigational target. */
  onClick?: () => void;
}

export interface MetricStripProps {
  /** Up to six tiles. Anything past index 5 is dropped. */
  tiles: readonly MetricTile[];
  /** When true, renders skeleton dots in place of values. */
  loading?: boolean;
  /** Extra class names. */
  className?: string;
}

/**
 * Renders the KPI row. Tiles wrap to a multi-row grid on narrow viewports
 * via `flex flex-wrap` so the row never overflows.
 */
export function MetricStrip({
  tiles,
  loading = false,
  className,
}: MetricStripProps): React.JSX.Element {
  if (loading) {
    return (
      <div
        data-testid="ai-kpi-row"
        aria-busy="true"
        className={cn(
          "flex h-8 items-center gap-6 text-xs text-muted-foreground/50",
          className,
        )}
      >
        <span>···</span>
      </div>
    );
  }

  const visible = tiles.slice(0, 6);
  return (
    <div
      data-testid="ai-kpi-row"
      className={cn("flex flex-wrap items-start gap-x-8 gap-y-3", className)}
    >
      {visible.map((tile, idx) => (
        <MetricCell key={tile.id} tile={tile} allowSparkline={idx === 0} />
      ))}
    </div>
  );
}

interface MetricCellProps {
  tile: MetricTile;
  allowSparkline: boolean;
}

/**
 * Single tile. Strictly flat. Renders as `<button>` when `onClick` is set so
 * the tile is keyboard-navigable; otherwise renders as `<div>` so screen
 * readers don't announce it as interactive.
 */
function MetricCell({
  tile,
  allowSparkline,
}: MetricCellProps): React.JSX.Element {
  const showSparkline =
    allowSparkline &&
    tile.sparkPoints !== undefined &&
    tile.sparkPoints.length > 1;

  const body = (
    <>
      <div className="flex flex-col">
        <span
          className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
          style={{ fontFamily: "var(--font-ai-mono)" }}
        >
          {tile.label}
        </span>
        <div className="flex items-baseline gap-2">
          <span
            data-testid={`ai-kpi-value-${tile.id}`}
            data-ai-numeric="kpi"
            className={cn(
              "text-base font-semibold tabular-nums text-foreground",
              tile.onClick !== undefined ? "group-hover:underline" : undefined,
            )}
            style={{ fontFamily: "var(--font-ai-mono)" }}
          >
            {tile.value}
          </span>
          {tile.delta !== null && tile.delta !== undefined ? (
            <MetricDelta
              delta={tile.delta}
              badWhenUp={tile.deltaIsBadWhenUp ?? false}
              labels={tile.deltaLabels}
            />
          ) : null}
        </div>
      </div>
      {showSparkline ? (
        <AiSparkline
          points={tile.sparkPoints ?? []}
          label={tile.sparkLabel ?? tile.ariaLabel}
          accent
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
        data-testid={`ai-kpi-tile-${tile.id}`}
        className="group flex items-center gap-3 rounded-sm text-left outline-none"
      >
        {body}
      </button>
    );
  }
  return (
    <div
      aria-label={tile.ariaLabel}
      data-testid={`ai-kpi-tile-${tile.id}`}
      className="flex items-center gap-3"
    >
      {body}
    </div>
  );
}

/**
 * Inline percentage delta indicator with arrow. Accent-green when good,
 * rose when bad, neutral grey when flat.
 */
function MetricDelta({
  delta,
  badWhenUp,
  labels,
}: {
  delta: number;
  badWhenUp: boolean;
  labels?: MetricDeltaLabels;
}): React.JSX.Element {
  const pct = Math.round(Math.abs(delta) * 100);
  if (pct === 0) {
    return (
      <span
        data-testid="ai-kpi-delta"
        data-tone="flat"
        className="inline-flex items-center gap-0.5 text-xs text-muted-foreground"
        style={{ fontFamily: "var(--font-ai-mono)" }}
        title={labels?.flat}
      >
        =
      </span>
    );
  }
  const isUp = delta > 0;
  const Icon = isUp ? ArrowUpRight : ArrowDownRight;
  const isBad = badWhenUp ? isUp : !isUp;
  const title = isUp ? labels?.up(pct) : labels?.down(pct);
  // "good" uses the AI Terminal phosphor accent; "bad" uses rose so the
  // semantic of red-for-pain still reads even inside the green-accented
  // surface.
  return (
    <span
      data-testid="ai-kpi-delta"
      data-tone={isBad ? "bad" : "good"}
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums",
        isBad ? "text-rose-600 dark:text-rose-400" : undefined,
      )}
      style={{
        fontFamily: "var(--font-ai-mono)",
        color: isBad ? undefined : "var(--accent-ai)",
      }}
      title={title}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {pct}%
    </span>
  );
}
