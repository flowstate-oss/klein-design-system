"use client";

import { ArrowDown, ArrowUp, Check, ChevronDown } from "lucide-react";
import { Button } from "@klein-ui/react/compat/button";
import { useTableLabels } from "../labels.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@klein-ui/react/compat/dropdown-menu";
import { cn } from "@klein-ui/react/compat/utils";
import type { SortOption } from "../view-types.js";

/**
 * Props for the SplitSortButton component.
 *
 * @template T - String union type representing the available sort field values.
 */
interface SplitSortButtonProps<T extends string> {
  /** The currently active sort field value */
  sortBy: T;
  /** The current sort direction */
  sortDir: "asc" | "desc";
  /** Callback when the sort field changes */
  onSortByChange: (value: T) => void;
  /** Callback when the sort direction changes */
  onSortDirChange: (dir: "asc" | "desc") => void;
  /** Available sort field options */
  options: SortOption<T>[];
}

/**
 * A two-part sort control for toolbar use.
 *
 * Left part toggles sort direction (asc/desc). Right part opens a dropdown
 * to select the sort field. The two parts share a border and appear as a
 * single joined unit.
 *
 * @template T - String union type for sort field values.
 */
export function SplitSortButton<T extends string>({
  sortBy,
  sortDir,
  onSortByChange,
  onSortDirChange,
  options,
}: SplitSortButtonProps<T>) {
  const tc = useTableLabels();
  // A view with nothing to sort (e.g. a pure-chart dashboard hosted by
  // ViewControlPanel) passes no options — render nothing rather than a dead
  // sort control ("NO SHIT UI"). Every list page passes ≥1 option, so this is
  // a no-op for them.
  if (options.length === 0) return null;
  const activeLabel = options.find((o) => o.value === sortBy)?.label ?? sortBy;
  const DirectionIcon = sortDir === "asc" ? ArrowUp : ArrowDown;

  return (
    <div className="flex items-center">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 rounded-r-none border-transparent px-2 text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground"
        onClick={() => onSortDirChange(sortDir === "asc" ? "desc" : "asc")}
        aria-label={
          sortDir === "asc" ? tc("sort.descending") : tc("sort.ascending")
        }
      >
        <DirectionIcon className="h-3.5 w-3.5" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-l-none border-transparent px-2.5 text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {activeLabel}
            <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[10rem]">
          {options.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onSortByChange(option.value)}
              className={cn(
                "text-xs",
                sortBy === option.value && "font-medium",
              )}
            >
              <Check
                className={cn(
                  "mr-2 h-3.5 w-3.5",
                  sortBy === option.value ? "opacity-100" : "opacity-0",
                )}
              />
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
