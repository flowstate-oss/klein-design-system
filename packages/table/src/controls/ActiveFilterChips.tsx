"use client";

/**
 * Active filter chips: one flat chip per filtered category under the control
 * bar ("Team: Platform, Data ×"), so what a screen is filtered to is visible
 * without opening the Filter popover (dashboards spec §"Data view": "Filter
 * chips on any column"). Driven by the same `filters` state and categories
 * as `FilterCombobox`; removing a chip clears that category. A locked
 * category's chip has no remove button.
 *
 * @module ActiveFilterChips
 */

import { X } from "lucide-react";
import { useTableLabels } from "../labels.js";
import type { FilterCategory } from "../view-types.js";
import { summariseLabels } from "./ServerSearchFilter.js";

/** One chip's content. */
export interface FilterChip {
  /** The category id. */
  readonly id: string;
  /** The category label. */
  readonly label: string;
  /** What it's filtered to. */
  readonly value: string;
  /** A locked category can't be removed. */
  readonly locked: boolean;
}

/**
 * Work out the chips for the active filters, in the categories' order.
 * Categories with no selection, and selections for categories the view
 * doesn't list, make no chip.
 *
 * @param categories - The view's filter categories.
 * @param selected - The active filters.
 * @param lockedFilters - Locked categories, if any.
 * @returns One chip per active category.
 */
export function filterChips(
  categories: readonly FilterCategory[],
  selected: Readonly<Record<string, string[]>>,
  lockedFilters?: Readonly<Record<string, string[]>>,
): FilterChip[] {
  const chips: FilterChip[] = [];
  for (const category of categories) {
    const value = selected[category.id] ?? [];
    if (value.length === 0) continue;
    const text =
      category.kind === "custom"
        ? (category.summary?.(value) ?? String(value.length))
        : summariseLabels(
            value,
            new Map(category.options.map((o) => [o.id, o.label])),
          );
    if (text === null) continue;
    chips.push({
      id: category.id,
      label: category.label,
      value: text,
      locked: lockedFilters !== undefined && category.id in lockedFilters,
    });
  }
  return chips;
}

/** Props for {@link ActiveFilterChips}. */
export interface ActiveFilterChipsProps {
  readonly categories: readonly FilterCategory[];
  readonly selected: Readonly<Record<string, string[]>>;
  readonly lockedFilters?: Readonly<Record<string, string[]>>;
  /** Clear one category. */
  readonly onRemove: (categoryId: string) => void;
}

/**
 * The chips row, or nothing when no filter is active.
 *
 * @param props - See {@link ActiveFilterChipsProps}.
 */
export function ActiveFilterChips({
  categories,
  selected,
  lockedFilters,
  onRemove,
}: ActiveFilterChipsProps): React.JSX.Element | null {
  const tc = useTableLabels();
  const chips = filterChips(categories, selected, lockedFilters);
  if (chips.length === 0) return null;
  return (
    <div
      className="flex flex-wrap items-center gap-1.5 px-4 pb-2"
      data-testid="active-filter-chips"
    >
      {chips.map((chip) => (
        <span
          key={chip.id}
          className="border-border bg-muted/40 inline-flex h-6 items-center gap-1 border px-2 text-[11px]"
          data-testid="active-filter-chip"
          data-category={chip.id}
        >
          <span className="text-muted-foreground">{chip.label}:</span>
          <span className="text-foreground max-w-[16rem] truncate">
            {chip.value}
          </span>
          {chip.locked ? null : (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground -mr-1 ml-0.5 inline-flex h-4 w-4 items-center justify-center"
              aria-label={tc("filter.chip.remove", { label: chip.label })}
              onClick={() => onRemove(chip.id)}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
    </div>
  );
}
