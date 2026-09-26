"use client";

import { ChevronDown, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@klein-ui/react/compat/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@klein-ui/react/compat/dropdown-menu";
import { useTableLabels } from "../labels.js";
import type { AddMenuAction } from "../view-types.js";

/**
 * Props for {@link SplitAddButton}.
 */
interface SplitAddButtonProps {
  /** Label for the primary add button (e.g. "Add"). */
  label: string;
  /**
   * Primary action — fired by clicking the main button. When omitted (e.g. the
   * viewer lacks create permission) the control degrades to a standalone
   * actions menu so the secondary `actions` stay reachable.
   */
  onAdd?: () => void;
  /** Secondary actions shown in the chevron dropdown. */
  actions: AddMenuAction[];
}

/**
 * A two-part "Add" control for toolbar use. The left part is the primary add
 * button (fires `onAdd`); the right chevron opens a dropdown of secondary
 * actions. The two parts share a border and read as a single joined unit,
 * mirroring `SplitSortButton`. With no `onAdd`, it collapses to a single
 * "more actions" menu button.
 *
 * Disabled actions show their `disabledReason` as a muted subtitle (a hover
 * tooltip can't fire on a disabled menu item, which has `pointer-events-none`).
 */
export function SplitAddButton({ label, onAdd, actions }: SplitAddButtonProps) {
  const tc = useTableLabels();

  return (
    <div className="flex items-center">
      {onAdd && (
        <Button
          variant="default"
          size="sm"
          className="h-8 gap-1.5 rounded-r-none border-r border-primary-foreground/20 px-2.5 text-xs"
          onClick={onAdd}
        >
          <Plus className="h-3.5 w-3.5" />
          {label}
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {onAdd ? (
            <Button
              variant="default"
              size="sm"
              className="h-8 rounded-l-none px-1.5"
              aria-label={tc("more.actions")}
            >
              <ChevronDown className="h-3.5 w-3.5 opacity-80" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2"
              aria-label={tc("more.actions")}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[13rem]">
          {actions.map((action) => {
            const Icon = action.icon;
            const showReason = action.disabled && !!action.disabledReason;
            return (
              <DropdownMenuItem
                key={action.id}
                disabled={action.disabled}
                onSelect={action.onClick}
                data-testid={action.testId}
                className="items-start text-xs"
              >
                {Icon && <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                <span className="flex min-w-0 flex-col">
                  <span>{action.label}</span>
                  {showReason && (
                    <span className="text-[11px] text-muted-foreground">
                      {action.disabledReason}
                    </span>
                  )}
                </span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
