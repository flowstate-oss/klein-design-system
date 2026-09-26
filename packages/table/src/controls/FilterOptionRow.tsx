"use client";

/**
 * The option row every list in the toolbar's Filter popover is built from: the
 * square checkbox, the label, and the two click semantics — the checkbox
 * toggles and keeps the popover open, the label toggles and closes it — plus
 * the read-only variant for an option that cannot be changed.
 *
 * Shared by `FilterCombobox` (the standard option lists and search hits) and
 * `InclusionFilter` (the all-on-by-default lists), so a custom category's rows
 * look and behave exactly like a standard category's.
 */

import { Check, Lock } from "lucide-react";
import { cn } from "@klein-ui/react/compat/utils";
import type { FilterOption } from "../view-types.js";

/**
 * Square checkbox indicator. Uses `rounded-sm` per spec (NOT circular).
 * Shows a Check icon when active.
 *
 * @param props.checked Whether the box is ticked.
 * @returns The indicator.
 */
export function FilterCheckbox({
  checked,
}: {
  checked: boolean;
}): React.JSX.Element {
  return (
    <div
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
        checked
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input",
      )}
    >
      {checked && <Check className="h-3 w-3" />}
    </div>
  );
}

export interface FilterOptionRowProps {
  option: FilterOption;
  checked: boolean;
  /** Toggle without closing the popover */
  onToggle: () => void;
  /** Toggle AND close the popover */
  onSelectAndClose: () => void;
  /** When true the row is read-only: shown checked, non-toggleable, with a lock. */
  locked?: boolean;
  /** Accessible label / tooltip for the lock affordance (translated). */
  lockedLabel?: string;
}

/**
 * A single filter option row. Clicking the checkbox toggles without closing.
 * Clicking the label text or pressing Enter applies and closes.
 *
 * A `locked` row is the read-only variant: it renders checked and inert, with a
 * lock icon, so the user can see the state but not change it — a context-locked
 * category (e.g. a budget proposal pinned to its team), or the last option an
 * inclusion filter has left on.
 *
 * @param props See {@link FilterOptionRowProps}.
 * @returns The row.
 */
export function FilterOptionRow({
  option,
  checked,
  onToggle,
  onSelectAndClose,
  locked,
  lockedLabel,
}: FilterOptionRowProps): React.JSX.Element {
  if (locked) {
    return (
      <div
        role="option"
        aria-selected
        aria-disabled
        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm opacity-80"
      >
        <FilterCheckbox checked />
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {option.color && (
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: option.color }}
            />
          )}
          <span className="truncate">{option.label}</span>
        </span>
        <Lock
          className="h-3 w-3 shrink-0 text-muted-foreground"
          aria-label={lockedLabel}
        />
      </div>
    );
  }

  return (
    <div
      role="option"
      aria-selected={checked}
      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onSelectAndClose();
        }
      }}
    >
      {/* Checkbox area — click toggles without close */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="shrink-0"
        tabIndex={-1}
      >
        <FilterCheckbox checked={checked} />
      </button>

      {/* Label area — click applies and closes */}
      <button
        type="button"
        onClick={onSelectAndClose}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
        tabIndex={-1}
      >
        {option.color && (
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: option.color }}
          />
        )}
        <span className="truncate">{option.label}</span>
      </button>
    </div>
  );
}
