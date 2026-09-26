"use client";

/**
 * The bulk action bar for a Table list (`TableConfig.bulkActions`): a
 * flat hairline band above the rows while at least one row is selected — the
 * count (mono), the page's actions, and Clear. Same visual pattern as the
 * inbox's `BulkTaskActionBar`.
 */

import { Fragment, useState } from "react";
import { useTableLabels } from "./labels.js";
import { Button } from "@klein-ui/react/compat/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@klein-ui/react/compat/tooltip";
import type { BulkAction } from "./view-types.js";

/** Props for {@link TableBulkActionBar}. */
export interface TableBulkActionBarProps {
  /** Every selected row id, across pages. The bar renders nothing when empty. */
  selectedIds: string[];
  /** The page's bulk actions, in display order. */
  actions: readonly BulkAction[];
  /** Deselect everything. */
  onClear: () => void;
}

/**
 * Renders the selected count, one button per bulk action, and Clear. Runs an
 * action on the selected ids, disables every button while it runs, clears the
 * selection when it completes, and keeps the selection if it throws (the page
 * reports its own error) so the viewer can retry.
 *
 * @returns The bar, or `null` when nothing is selected.
 */
export function TableBulkActionBar({
  selectedIds,
  actions,
  onClear,
}: TableBulkActionBarProps) {
  const t = useTableLabels();
  const [runningId, setRunningId] = useState<string | null>(null);

  if (selectedIds.length === 0) return null;

  const run = async (action: BulkAction) => {
    setRunningId(action.id);
    try {
      await action.onRun(selectedIds);
      onClear();
    } catch {
      // The page owns the failure message; keeping the selection lets the
      // viewer retry without re-ticking every row.
    } finally {
      setRunningId(null);
    }
  };

  const busy = runningId !== null;

  return (
    <div
      className="bg-background flex items-center justify-between border-b px-4 py-2"
      role="toolbar"
      aria-label={t("viewControls.dataView.bulk.toolbar")}
      data-testid="dataview-bulk-bar"
    >
      <span className="text-sm">
        <span
          className="font-mono font-semibold tabular-nums"
          data-testid="dataview-bulk-count"
        >
          {selectedIds.length}
        </span>{" "}
        <span className="text-muted-foreground">
          {t("viewControls.dataView.bulk.selected")}
        </span>
      </span>
      <div className="flex items-center gap-2">
        {actions.map((action) => {
          const button = (
            <Button
              size="sm"
              variant={
                action.variant === "destructive" ? "destructive" : "tertiary"
              }
              className="h-8 gap-1.5"
              disabled={busy || action.disabled === true}
              onClick={() => void run(action)}
              data-testid={`dataview-bulk-action-${action.id}`}
            >
              <action.icon className="h-4 w-4" />
              {action.label}
              {action.disabledReason !== undefined && (
                <span className="sr-only">{`: ${action.disabledReason}`}</span>
              )}
            </Button>
          );
          if (action.disabledReason === undefined)
            return <Fragment key={action.id}>{button}</Fragment>;
          // A disabled button fires no pointer events, so the tooltip hangs off
          // a wrapper that still does (as in RowActions).
          return (
            <Tooltip key={action.id}>
              <TooltipTrigger asChild>
                <span className="inline-flex">{button}</span>
              </TooltipTrigger>
              <TooltipContent data-testid="dataview-bulk-disabled-reason">
                {action.disabledReason}
              </TooltipContent>
            </Tooltip>
          );
        })}
        <Button
          size="sm"
          variant="ghost"
          className="h-8 text-xs"
          disabled={busy}
          onClick={onClear}
          data-testid="dataview-bulk-clear"
        >
          {t("viewControls.dataView.bulk.clear")}
        </Button>
      </div>
    </div>
  );
}
