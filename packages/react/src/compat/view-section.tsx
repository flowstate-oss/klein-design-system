"use client";

/**
 * ViewSection — the ONE canonical wrapper for a chart, metric block, or
 * sub-list placed inside a `ViewLayout`. A flat bordered panel (no shadow, per
 * the Gravity rule) with a title + optional info tooltip + right-aligned
 * actions, and a body that is either a fixed height (charts) or `auto`
 * (tables/lists). Replaces the inconsistent mix of `Card`-as-chart-wrapper,
 * the older `ChartSection`, and raw bordered `<div>`s on dashboard pages.
 *
 * Use this for every panel inside a `ViewLayout` so multi-graph pages read
 * identically. Do NOT hand-roll `<div className="rounded border …">` chart
 * wrappers.
 */

import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { cn } from "./utils.js";
import { Skeleton } from "./skeleton.js";
import { Tooltip, TooltipTrigger, TooltipContent } from "./tooltip.js";

export interface ViewSectionProps {
  /** Section title (left of the header). Omit for a header-less panel. */
  title?: ReactNode;
  /** Optional info copy shown behind an (i) tooltip next to the title. */
  info?: ReactNode;
  /** Right-aligned header actions (toggles, period chips, links). */
  actions?: ReactNode;
  /**
   * Body height. Charts use a fixed pixel height so rows align across a
   * `ViewLayout` grid; tables/lists pass `'auto'` to size to content (and
   * fill height inside a `single` layout).
   */
  height?: number | "auto";
  /** Remove body padding — e.g. for edge-to-edge tables. */
  flush?: boolean;
  /** Show a loading skeleton in place of the body. */
  loading?: boolean;
  className?: string;
  children: ReactNode;
}

const DEFAULT_CHART_HEIGHT = 300;

export function ViewSection({
  title,
  info,
  actions,
  height = DEFAULT_CHART_HEIGHT,
  flush = false,
  loading = false,
  className,
  children,
}: ViewSectionProps) {
  const hasHeader = title != null || info != null || actions != null;
  const isAuto = height === "auto";

  return (
    <div
      className={cn(
        "bg-background flex min-w-0 flex-col rounded-md border",
        isAuto && "min-h-0 flex-1",
        className,
      )}
    >
      {hasHeader && (
        <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-1.5">
            {title != null && (
              <h3 className="text-foreground truncate text-xs font-medium">
                {title}
              </h3>
            )}
            {info != null && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">
                    <Info className="text-muted-foreground/50 h-3.5 w-3.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">{info}</TooltipContent>
              </Tooltip>
            )}
          </div>
          {actions != null && (
            <div className="flex shrink-0 items-center gap-1.5">{actions}</div>
          )}
        </div>
      )}
      <div
        className={cn(
          "min-w-0",
          !flush && "p-4",
          isAuto ? "min-h-0 flex-1 overflow-y-auto" : "",
        )}
        style={isAuto ? undefined : { height }}
      >
        {loading ? <ViewSectionSkeleton /> : children}
      </div>
    </div>
  );
}

/** Bar-chart-shaped loading placeholder for a section body. */
function ViewSectionSkeleton() {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-1 items-end justify-between gap-4">
        <Skeleton className="h-3/4 flex-1" />
        <Skeleton className="h-1/2 flex-1" />
        <Skeleton className="h-full flex-1" />
        <Skeleton className="h-2/3 flex-1" />
        <Skeleton className="h-4/5 flex-1" />
      </div>
      <div className="flex justify-center gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}
