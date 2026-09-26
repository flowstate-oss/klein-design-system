"use client";

import { type ReactNode, useMemo, useRef } from "react";
import { cn } from "@klein-ui/react/compat/utils";
import { useTableRuntime } from "./runtime.js";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@klein-ui/react/compat/tooltip";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

/** Props for the TimelineView renderer. */
export interface TimelineViewProps<T> {
  /** All items to display */
  items: T[];
  /** Grouped sections for swimlanes (null = no grouping) */
  sections: Array<{ key: string; label?: string; items: T[] }> | null;
  /** Group title lookup */
  groupTitle?: (key: string) => string;
  /** The active date range config */
  dateRange: {
    start: (item: T) => Date | null;
    end: (item: T) => Date | null;
  };
  /** Extract a unique key from an item */
  rowKey: (item: T) => string;
  /** Render the title slot for a row */
  title: (item: T) => ReactNode;
  /** Render the avatar slot for a row */
  avatar: (item: T) => ReactNode;
  /** Handler when a row is clicked */
  onRowClick?: (item: T) => void;
  /** Empty state content */
  emptyState?: ReactNode;
}

/* -------------------------------------------------------------------------- */
/*                              Constants                                      */
/* -------------------------------------------------------------------------- */

/** Fixed width of the left sidebar (px) */
const SIDEBAR_WIDTH = 200;
/** Width of each month column (px) */
const MONTH_COL_WIDTH = 120;
/** Height of each item row (px) */
const ROW_HEIGHT = 40;
/** Height of each group header row (px) */
const GROUP_HEADER_HEIGHT = 32;
/** Height of the timeline header (px) */
const HEADER_HEIGHT = 36;
/** Height of the bar inside each row (px) */
const BAR_HEIGHT = 24;

/* -------------------------------------------------------------------------- */
/*                           Date Helpers                                      */
/* -------------------------------------------------------------------------- */

/**
 * Returns the first day of a month.
 * @param year - Calendar year
 * @param month - Zero-based month index
 */
function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

/**
 * Count the number of months between two dates (inclusive of both endpoints).
 * @param from - Start date
 * @param to - End date
 */
function monthsBetween(from: Date, to: Date): number {
  return (
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth()) +
    1
  );
}

/**
 * Compute the timeline range (start and end month boundaries) from item data.
 * Pads by 1 month on each side. Falls back to the current calendar year
 * when no dates are available.
 */
function computeRange<T>(
  items: T[],
  getStart: (item: T) => Date | null,
  getEnd: (item: T) => Date | null,
): { rangeStart: Date; rangeEnd: Date } {
  let minDate: Date | null = null;
  let maxDate: Date | null = null;

  for (const item of items) {
    const s = getStart(item);
    const e = getEnd(item);
    if (s && (!minDate || s < minDate)) minDate = s;
    if (e && (!maxDate || e > maxDate)) maxDate = e;
    // For items with a start but no end, extend max to today or further
    if (s && !e) {
      const now = new Date();
      if (!maxDate || now > maxDate) maxDate = now;
    }
  }

  if (!minDate && !maxDate) {
    // No dates at all — show current year
    const year = new Date().getFullYear();
    return {
      rangeStart: new Date(year, 0, 1),
      rangeEnd: new Date(year, 11, 31),
    };
  }

  // If only one bound exists, create a reasonable range
  if (!minDate) minDate = maxDate ?? new Date();
  if (!maxDate) maxDate = minDate;

  // Pad by 1 month on each side
  const padStart = new Date(minDate.getFullYear(), minDate.getMonth() - 1, 1);
  const padEnd = new Date(maxDate.getFullYear(), maxDate.getMonth() + 2, 0); // last day of month+1

  return { rangeStart: padStart, rangeEnd: padEnd };
}

/**
 * Generate month labels for the header.
 * Each entry contains the label text and its pixel offset.
 */
function generateMonthColumns(
  rangeStart: Date,
  rangeEnd: Date,
): Array<{ label: string; date: Date }> {
  const months: Array<{ label: string; date: Date }> = [];
  const count = monthsBetween(rangeStart, rangeEnd);
  for (let i = 0; i < count; i++) {
    const d = startOfMonth(rangeStart.getFullYear(), rangeStart.getMonth() + i);
    months.push({ label: "", date: d });
  }
  return months;
}

/* -------------------------------------------------------------------------- */
/*                          TimelineView Component                             */
/* -------------------------------------------------------------------------- */

/**
 * Timeline renderer for Table.
 *
 * Renders items as horizontal bars on a scrollable time axis. Items are
 * optionally grouped into swimlanes. A vertical dashed line marks today.
 *
 * @template T - The item type
 */
export function TimelineView<T>({
  items,
  sections,
  groupTitle,
  dateRange,
  rowKey,
  title,
  avatar,
  onRowClick,
  emptyState,
}: TimelineViewProps<T>) {
  const { formatDate } = useTableRuntime();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  /* ── Compute range and layout metrics ── */

  const { rangeStart, rangeEnd } = useMemo(
    () => computeRange(items, dateRange.start, dateRange.end),
    [items, dateRange],
  );

  const monthColumns = useMemo(
    () => generateMonthColumns(rangeStart, rangeEnd),
    [rangeStart, rangeEnd],
  );

  const totalWidth = monthColumns.length * MONTH_COL_WIDTH;
  const rangeStartMs = rangeStart.getTime();
  const rangeEndMs = rangeEnd.getTime();
  const rangeDurationMs = rangeEndMs - rangeStartMs;

  /* ── Today marker position ── */

  const todayMs = useMemo(() => new Date().getTime(), []);
  const todayX = useMemo(() => {
    if (todayMs < rangeStartMs || todayMs > rangeEndMs) return null;
    return ((todayMs - rangeStartMs) / rangeDurationMs) * totalWidth;
  }, [todayMs, rangeStartMs, rangeEndMs, rangeDurationMs, totalWidth]);

  /* ── Position calculator ── */

  const dateToX = (date: Date): number => {
    const ms = date.getTime();
    const clamped = Math.max(rangeStartMs, Math.min(rangeEndMs, ms));
    return ((clamped - rangeStartMs) / rangeDurationMs) * totalWidth;
  };

  /* ── Month header labels using formatDate ── */

  const monthLabels = useMemo(
    () =>
      monthColumns.map((col) => ({
        ...col,
        label: formatDate(col.date, { month: "short", year: "numeric" }),
      })),
    [monthColumns, formatDate],
  );

  /* ── Empty state ── */

  if (items.length === 0 && emptyState) {
    return (
      <div className="flex items-center justify-center px-4 py-16">
        {emptyState}
      </div>
    );
  }

  /* ── Bar renderer ── */

  const renderBar = (item: T) => {
    const startDate = dateRange.start(item);
    const endDate = dateRange.end(item);
    const isOngoing = !endDate && startDate !== null;
    const noStart = !startDate;

    const barLeft = startDate ? dateToX(startDate) : 0;
    const barRight = endDate ? dateToX(endDate) : totalWidth;
    const barWidth = Math.max(barRight - barLeft, 4);

    const tooltipText = [
      startDate ? formatDate(startDate) : "...",
      "\u2013",
      endDate ? formatDate(endDate) : "Ongoing",
    ].join(" ");

    return (
      <Tooltip key={rowKey(item)}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 rounded-md",
              "h-[24px] cursor-pointer transition-opacity hover:opacity-80",
              isOngoing
                ? "bg-gradient-to-r from-primary/20 to-transparent border border-primary/40 border-r-0"
                : noStart
                  ? "bg-gradient-to-l from-primary/20 to-transparent border border-primary/40 border-l-0"
                  : "bg-primary/20 border border-primary/40",
            )}
            style={{
              left: `${barLeft}px`,
              width: `${barWidth}px`,
            }}
            onClick={onRowClick ? () => onRowClick(item) : undefined}
            role={onRowClick ? "button" : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            onKeyDown={
              onRowClick
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onRowClick(item);
                    }
                  }
                : undefined
            }
          />
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    );
  };

  /* ── Row label renderer ── */

  const renderRowLabel = (item: T) => (
    <div
      key={rowKey(item)}
      className={cn(
        "flex items-center gap-2 border-b px-3",
        onRowClick && "cursor-pointer hover:bg-muted/50",
      )}
      style={{ height: `${ROW_HEIGHT}px` }}
      onClick={onRowClick ? () => onRowClick(item) : undefined}
      role={onRowClick ? "button" : undefined}
      tabIndex={onRowClick ? 0 : undefined}
      onKeyDown={
        onRowClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onRowClick(item);
              }
            }
          : undefined
      }
    >
      <div className="flex-shrink-0">{avatar(item)}</div>
      <div className="min-w-0 truncate text-xs">{title(item)}</div>
    </div>
  );

  /* ── Section renderers ── */

  const renderUngroupedRows = (rowItems: T[]) => (
    <>{rowItems.map((item) => renderRowLabel(item))}</>
  );

  const renderUngroupedBars = (rowItems: T[]) => (
    <>
      {rowItems.map((item, idx) => (
        <div
          key={rowKey(item)}
          className="relative border-b"
          style={{ height: `${ROW_HEIGHT}px` }}
        >
          {renderBar(item)}
        </div>
      ))}
    </>
  );

  const renderGroupedLabels = (
    secs: Array<{ key: string; label?: string; items: T[] }>,
  ) => (
    <>
      {secs.map((section) => {
        const sectionTitle =
          section.label ?? (groupTitle ? groupTitle(section.key) : section.key);
        return (
          <div key={section.key}>
            {/* Group header label */}
            <div
              className="flex items-center border-b bg-muted/30 px-3 text-xs font-medium text-muted-foreground"
              style={{ height: `${GROUP_HEADER_HEIGHT}px` }}
            >
              <span className="truncate">{sectionTitle}</span>
              <span className="ml-1.5 font-mono text-[10px] text-muted-foreground/60">
                {section.items.length}
              </span>
            </div>
            {section.items.map((item) => renderRowLabel(item))}
          </div>
        );
      })}
    </>
  );

  const renderGroupedBars = (
    secs: Array<{ key: string; label?: string; items: T[] }>,
  ) => (
    <>
      {secs.map((section) => (
        <div key={section.key}>
          {/* Group header spacer (matches label height) */}
          <div
            className="border-b bg-muted/30"
            style={{ height: `${GROUP_HEADER_HEIGHT}px` }}
          />
          {section.items.map((item) => (
            <div
              key={rowKey(item)}
              className="relative border-b"
              style={{ height: `${ROW_HEIGHT}px` }}
            >
              {renderBar(item)}
            </div>
          ))}
        </div>
      ))}
    </>
  );

  const isGrouped = sections !== null && sections.length > 0;
  const displaySections = isGrouped ? sections : null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex min-h-0 flex-1">
          {/* ── Left sidebar (fixed) ── */}
          <div
            className="flex flex-shrink-0 flex-col border-r"
            style={{ width: `${SIDEBAR_WIDTH}px` }}
          >
            {/* Header spacer */}
            <div
              className="flex items-center border-b bg-muted/50 px-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
              style={{ height: `${HEADER_HEIGHT}px` }}
            />
            {/* Row labels */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {displaySections
                ? renderGroupedLabels(displaySections)
                : renderUngroupedRows(items)}
            </div>
          </div>

          {/* ── Right area (scrollable timeline) ── */}
          <div
            className="flex min-w-0 flex-1 flex-col overflow-x-auto"
            ref={scrollContainerRef}
          >
            {/* Month header */}
            <div
              className="flex border-b bg-muted/50"
              style={{
                minWidth: `${totalWidth}px`,
                height: `${HEADER_HEIGHT}px`,
              }}
            >
              {monthLabels.map((col, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex flex-shrink-0 items-center justify-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground",
                    idx > 0 && "border-l",
                  )}
                  style={{ width: `${MONTH_COL_WIDTH}px` }}
                >
                  {col.label}
                </div>
              ))}
            </div>

            {/* Timeline body */}
            <div
              className="relative flex-1 overflow-y-auto"
              style={{ minWidth: `${totalWidth}px` }}
            >
              {/* Grid lines */}
              {monthLabels.map((_, idx) => {
                if (idx === 0) return null;
                return (
                  <div
                    key={`grid-${idx}`}
                    className="absolute top-0 bottom-0 border-l border-border/40"
                    style={{ left: `${idx * MONTH_COL_WIDTH}px` }}
                  />
                );
              })}

              {/* Today marker */}
              {todayX !== null && (
                <div
                  className="absolute top-0 bottom-0 z-10 border-l border-dashed border-primary"
                  style={{ left: `${todayX}px` }}
                />
              )}

              {/* Bars */}
              {displaySections
                ? renderGroupedBars(displaySections)
                : renderUngroupedBars(items)}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
