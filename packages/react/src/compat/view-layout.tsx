"use client";

/**
 * ViewLayout — the canonical body layout for a view. It MUST always render
 * AFTER the `ViewControlPanel` (the control pane sits above the data). There
 * is a FIXED set of variants so every page lays out identically — pages must
 * NOT hand-roll `grid grid-cols-*` for dashboards.
 *
 *   variant     top slot              main / bottom slot
 *   ---------   -------------------   ----------------------------------
 *   single      —                     one full-height body (list/kanban/gantt)
 *   2:1         2 graphs (2-col)      one list/kanban/gantt below (`main`)
 *   3:3         3 graphs (3-col)      3 graphs below (`bottom`, 3-col)
 *   2:2         2 graphs (2-col)      2 graphs below (`bottom`, 2-col)
 *   tree:detail left tree rail        right detail pane (`tree` + `detail`)
 *
 * Each graph/panel passed to a slot should be a `<ViewSection>`. Spacing is a
 * single canonical `gap-4`; dashboard variants scroll as one; `single` hands
 * its full height to the body (which owns its own scroll). `tree:detail` is the
 * portfolio drill-down shell — a full-height navigator rail beside a detail
 * pane, edge-to-edge, flat, divided by a single `border-r` (no cards).
 */

import type { ReactNode } from "react";
import { cn } from "./utils.js";

export type ViewLayoutVariant =
  "single" | "2:1" | "3:3" | "2:2" | "tree:detail";

export interface ViewLayoutProps {
  variant: ViewLayoutVariant;
  /** Top graph row — 2:1 & 2:2 expect 2 panels, 3:3 expects 3 (each a ViewSection). */
  top?: ReactNode;
  /** Bottom graph row — 3:3 expects 3 panels, 2:2 expects 2. Unused by single/2:1. */
  bottom?: ReactNode;
  /** Primary body (list/kanban/gantt) — single & 2:1. Unused by 3:3/2:2. */
  main?: ReactNode;
  /** Left navigator rail — `tree:detail` only (e.g. the portfolio Objective→Initiative→Project tree). */
  tree?: ReactNode;
  /** Right detail pane — `tree:detail` only (e.g. the selected Initiative's variance + children). */
  detail?: ReactNode;
  /** Width of the `tree:detail` rail (Tailwind width class). Defaults to a dense 340px. */
  treeWidthClassName?: string;
  className?: string;
}

/** Uniform responsive grid for a graph row. */
const ROW_GRID: Record<2 | 3, string> = {
  2: "grid grid-cols-1 gap-4 lg:grid-cols-2",
  3: "grid grid-cols-1 gap-4 lg:grid-cols-3",
};

export function ViewLayout({
  variant,
  top,
  bottom,
  main,
  tree,
  detail,
  treeWidthClassName = "w-[340px]",
  className,
}: ViewLayoutProps) {
  if (variant === "single") {
    // The body owns its own layout + scroll (e.g. a DataView list). Edge-to-edge.
    return (
      <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
        {main}
      </div>
    );
  }

  if (variant === "tree:detail") {
    // Edge-to-edge portfolio shell: a full-height navigator rail beside a detail
    // pane, divided by a single border (flat, no cards). Each owns its own scroll.
    return (
      <div className={cn("flex min-h-0 flex-1", className)}>
        <div
          className={cn(
            "border-border flex min-h-0 shrink-0 flex-col overflow-y-auto border-r",
            treeWidthClassName,
          )}
        >
          {tree}
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {detail}
        </div>
      </div>
    );
  }

  // Dashboard variants scroll as one padded column with uniform gap.
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4",
        className,
      )}
    >
      {variant === "2:1" && (
        <>
          <div className={ROW_GRID[2]}>{top}</div>
          <div className="flex min-h-0 flex-1 flex-col">{main}</div>
        </>
      )}
      {variant === "3:3" && (
        <>
          <div className={ROW_GRID[3]}>{top}</div>
          <div className={ROW_GRID[3]}>{bottom}</div>
        </>
      )}
      {variant === "2:2" && (
        <>
          <div className={ROW_GRID[2]}>{top}</div>
          <div className={ROW_GRID[2]}>{bottom}</div>
        </>
      )}
    </div>
  );
}
