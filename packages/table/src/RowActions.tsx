"use client";

import React from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@klein-ui/react/compat/utils";
import { Button } from "@klein-ui/react/compat/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from "@klein-ui/react/compat/dropdown-menu";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@klein-ui/react/compat/tooltip";
import type { RowAction } from "./view-types.js";

/* -------------------------------------------------------------------------- */
/*                                Types                                       */
/* -------------------------------------------------------------------------- */

interface RowActionsProps {
  /** The primary action rendered as a visible icon button */
  primary: RowAction;
  /** Additional actions shown in an overflow dropdown menu */
  overflow?: RowAction[];
}

/* -------------------------------------------------------------------------- */
/*                                Sizing                                       */
/* -------------------------------------------------------------------------- */

/**
 * Width of one row-action icon button in rem (the `h-7 w-7` classes below).
 * `TableBody`'s column header derives its trailing spacer width from this
 * so header `fr` tracks resolve identically to the rows'.
 */
export const ROW_ACTION_BUTTON_REM = 1.75;

/**
 * Gap between the primary button and the overflow kebab in rem (the `gap-1`
 * class on the cluster wrapper below).
 */
export const ROW_ACTION_GAP_REM = 0.25;

/* -------------------------------------------------------------------------- */
/*                                RowActions                                   */
/* -------------------------------------------------------------------------- */

/**
 * An overflow item's label, with the reason under it when the action is
 * disabled for one (e.g. the connection that would enable it).
 *
 * @param props.action - The row action.
 */
function RowActionLabel({ action }: { action: RowAction }) {
  if (action.disabledReason === undefined) return <>{action.label}</>;
  return (
    <span className="flex flex-col">
      <span>{action.label}</span>
      <span
        className="text-muted-foreground text-[11px]"
        data-testid="row-action-disabled-reason"
      >
        {action.disabledReason}
      </span>
    </span>
  );
}

/**
 * Renders row-level action buttons for a Table row.
 *
 * Shows one primary icon button (always visible) and an optional overflow
 * dropdown for additional actions. Destructive actions are grouped at the
 * bottom of the overflow menu with a separator.
 */
export function RowActions({ primary, overflow }: RowActionsProps) {
  const defaultActions =
    overflow?.filter((a) => a.variant !== "destructive") ?? [];
  const destructiveActions =
    overflow?.filter((a) => a.variant === "destructive") ?? [];
  const hasOverflow = (overflow?.length ?? 0) > 0;

  return (
    <div className="flex items-center gap-1">
      {/* Primary action — always visible. A disabled button fires no pointer
          events, so the tooltip hangs off a wrapper that still does. */}
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={primary.disabled}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                primary.onClick();
              }}
            >
              <primary.icon className="h-4 w-4" />
              <span className="sr-only">
                {primary.disabledReason === undefined
                  ? primary.label
                  : `${primary.label}: ${primary.disabledReason}`}
              </span>
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {primary.label}
          {primary.disabledReason === undefined ? null : (
            <span
              className="block opacity-80"
              data-testid="row-action-disabled-reason"
            >
              {primary.disabledReason}
            </span>
          )}
        </TooltipContent>
      </Tooltip>

      {/* Overflow menu */}
      {hasOverflow && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">More actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
            }}
          >
            {defaultActions.map((action) => (
              <DropdownMenuItem
                key={action.id}
                disabled={action.disabled}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  action.onClick();
                }}
              >
                <action.icon className="mr-2 h-4 w-4" />
                <RowActionLabel action={action} />
                {action.shortcut && (
                  <DropdownMenuShortcut>{action.shortcut}</DropdownMenuShortcut>
                )}
              </DropdownMenuItem>
            ))}

            {destructiveActions.length > 0 && defaultActions.length > 0 && (
              <DropdownMenuSeparator />
            )}

            {destructiveActions.map((action) => (
              <DropdownMenuItem
                key={action.id}
                disabled={action.disabled}
                className={cn("text-destructive focus:text-destructive")}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  action.onClick();
                }}
              >
                <action.icon className="mr-2 h-4 w-4" />
                <RowActionLabel action={action} />
                {action.shortcut && (
                  <DropdownMenuShortcut>{action.shortcut}</DropdownMenuShortcut>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
