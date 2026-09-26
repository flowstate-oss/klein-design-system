"use client";

/**
 * Shared band primitives for insight dashboards (Agent spend, Code Delivery, …)
 * — the approved layout is an EDGE-TO-EDGE narrative stack: full-width bands
 * separated by hairlines, NO boxed/rounded/card-like section wrappers, no grid
 * gutters between panels.
 *
 * - `DashboardBand` — one full-width band. The parent stacks bands inside a
 *   `divide-y` column; the band only owns its internal padding.
 * - `SplitBand` — one band carrying two side-by-side halves divided by a
 *   vertical hairline (stacks on small screens).
 * - `BandTitle` — the small uppercase micro-label from the approved wireframe.
 */

import type { ReactNode } from "react";
import { cn } from "./utils.js";

/** Small sentence-case band label — no caps, no letter-spacing. */
export function BandTitle({
  children,
  info,
  actions,
  className,
}: {
  children: ReactNode;
  info?: ReactNode;
  actions?: ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <div className={cn("mb-2 flex items-center gap-1.5", className)}>
      <h3 className="text-foreground text-sm font-medium">{children}</h3>
      {info !== undefined && info !== null ? info : null}
      {actions !== undefined && actions !== null ? (
        <div className="ml-auto flex items-center gap-1.5">{actions}</div>
      ) : null}
    </div>
  );
}

/**
 * One full-width band. `flush` drops the horizontal padding so tables can run
 * edge-to-edge (cells then own the page gutter on their first/last columns).
 *
 * `grow` makes the band a flex column that fills the available vertical space of
 * a flex-column parent (`min-h-0 flex-1`), with its content area also growing —
 * so a panel stretches to the viewport instead of collapsing to content height.
 * The parent must be `flex flex-col` for `grow` to take effect.
 */
export function DashboardBand({
  flush = false,
  grow = false,
  className,
  children,
}: {
  flush?: boolean;
  grow?: boolean;
  className?: string;
  children: ReactNode;
}): React.JSX.Element {
  return (
    <section
      className={cn(
        "py-4",
        flush ? "px-0" : "px-6",
        grow && "flex min-h-0 flex-1 flex-col",
        className,
      )}
    >
      {grow ? (
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      ) : (
        children
      )}
    </section>
  );
}

/**
 * A band split into two halves by a vertical hairline. Halves stack with a
 * horizontal hairline on small screens. Each half supplies its own
 * `BandTitle` + content; the split owns the padding.
 *
 * Each half is itself a flex column, so a half whose content opts into
 * `min-h-0 flex-1` (a chart, a scrollable table) fills the half's height. With
 * `grow`, the split band fills the available vertical space of a flex-column
 * parent so both halves stretch to the viewport.
 */
export function SplitBand({
  left,
  right,
  grow = false,
  className,
}: {
  left: ReactNode;
  right: ReactNode;
  grow?: boolean;
  className?: string;
}): React.JSX.Element {
  return (
    <section
      className={cn(
        "flex flex-col divide-y lg:flex-row lg:divide-x lg:divide-y-0",
        grow && "min-h-0 flex-1",
        className,
      )}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col px-6 py-4">
        {left}
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col px-6 py-4">
        {right}
      </div>
    </section>
  );
}
