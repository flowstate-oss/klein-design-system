"use client";

/**
 * BreakdownTable — the ONE dense breakdown idiom for the Dashboard's split
 * bands. Every breakdown (providers, models, top spenders, teams) renders as
 * the same disciplined table: label column · right-aligned mono metric
 * columns · a trailing proportional share bar. No freestanding bar charts,
 * no bespoke list layouts — consistency is the point.
 *
 * Header styling matches the attribution table (11px uppercase muted,
 * hairline under). Rows are hairline-divided; the half-band's `px-6` provides
 * the outer gutter so the first/last cells carry no horizontal padding.
 */

import type { ReactNode } from "react";
import { cn } from "@klein-ui/react/compat/utils";

export interface BreakdownColumn {
  id: string;
  label: string;
  align?: "left" | "right";
}

export interface BreakdownRow {
  id: string;
  /** One cell per column, in column order. */
  cells: readonly ReactNode[];
  /** Percentage of the comparison maximum, prepared by the adapter. */
  percentage: number;
  /** Application-formatted share for assistive technology. */
  shareLabel?: string;
}

export interface BreakdownTableProps {
  /** Accessible table name. */
  label: string;
  columns: readonly BreakdownColumn[];
  rows: readonly BreakdownRow[];
  shareLabel: string;
  /** Stable row ID from pointer or keyboard activation. */
  onRowClick?: (id: string) => void;
}
/** Dense label/metric breakdown with a shared proportional-bar column. */
export function BreakdownTable({
  label,
  columns,
  rows,
  shareLabel,
  onRowClick,
}: BreakdownTableProps): React.JSX.Element {
  return (
    <table aria-label={label} className="w-full border-collapse text-sm">
      <thead>
        <tr className="text-muted-foreground border-b text-[11px] uppercase tracking-wide">
          {columns.map((col, i) => (
            <th
              key={col.id}
              className={cn(
                "py-2 font-medium",
                col.align === "right" ? "text-right" : "text-left",
                i === 0 ? "pr-2" : "px-2",
              )}
            >
              {col.label}
            </th>
          ))}
          <th className="w-24 py-2 pl-2 text-left font-medium">{shareLabel}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr
            key={row.id}
            className={cn(
              "border-b border-border/50 last:border-0",
              onRowClick && "hover:bg-muted/50 cursor-pointer",
            )}
            onClick={
              onRowClick
                ? (event) => {
                    if (
                      event.target instanceof Element &&
                      event.target.closest(
                        'button,a,input,select,textarea,[role="button"],[role="link"]',
                      )
                    )
                      return;
                    onRowClick(row.id);
                  }
                : undefined
            }
            tabIndex={onRowClick ? 0 : undefined}
            onKeyDown={
              onRowClick
                ? (event) => {
                    if (
                      event.target === event.currentTarget &&
                      (event.key === "Enter" || event.key === " ")
                    ) {
                      event.preventDefault();
                      onRowClick(row.id);
                    }
                  }
                : undefined
            }
          >
            {row.cells.map((cell, i) => (
              <td
                key={columns[i]?.id ?? i}
                className={cn(
                  "py-1.5",
                  columns[i]?.align === "right" ? "text-right" : "text-left",
                  i === 0 ? "pr-2" : "px-2",
                )}
              >
                {cell}
              </td>
            ))}
            <td className="w-24 py-1.5 pl-2">
              <span className="sr-only">
                {row.shareLabel ?? `${row.percentage}%`}
              </span>
              <div
                className="bg-muted h-1.5 w-full overflow-hidden"
                aria-hidden="true"
              >
                <div
                  className="h-full"
                  style={{
                    width: `${Number.isFinite(row.percentage) ? Math.max(0, Math.min(100, row.percentage)) : 0}%`,
                    backgroundColor: `var(--color-chart-${(rowIndex % 12) + 1})`,
                  }}
                />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
