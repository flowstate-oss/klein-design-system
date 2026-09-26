"use client";

/**
 * Bulk-select state for a Table list (`TableConfig.bulkActions`).
 *
 * The selection is a set of row ids (`getRowId`, else `rowKey`) that survives
 * paging: ticking rows on page 1, moving to page 2 and ticking more keeps all
 * of them until the viewer clears the selection or a bulk action completes.
 * The header checkbox acts on the rows of the CURRENT page only.
 */

import { useCallback, useMemo, useState } from "react";

/** How much of the current page is selected — drives the header checkbox. */
export type PageSelectionState = "none" | "some" | "all";

/**
 * Whether none, some or all of a page's rows are selected.
 *
 * @param pageIds - The ids of the rows on the current page.
 * @param selected - Every selected id (across pages).
 * @returns `'all'` only when the page has rows and every one is selected.
 */
export function pageSelectionState(
  pageIds: readonly string[],
  selected: ReadonlySet<string>,
): PageSelectionState {
  const hits = pageIds.filter((id) => selected.has(id)).length;
  if (hits === 0) return "none";
  return hits === pageIds.length ? "all" : "some";
}

/** The selection API the table renderer reads (checkbox column). */
export interface TableRowSelection<T> {
  /** The id a row contributes to the selection. */
  rowId: (item: T) => string;
  /** Ids of the rows on the current page, in page order. */
  pageIds: readonly string[];
  /** How much of the current page is selected. */
  pageState: PageSelectionState;
  /** Whether one id is selected. */
  isSelected: (id: string) => boolean;
  /** Tick or untick one row. */
  toggle: (id: string) => void;
  /** Select (true) or deselect (false) every row on the current page. */
  setPageSelected: (selected: boolean) => void;
}

/** The full selection API — the table's slice plus what the bulk bar needs. */
export interface TableRowSelectionState<T> extends TableRowSelection<T> {
  /** Every selected id across pages, in the order they were ticked. */
  selectedIds: string[];
  /** Deselect everything. */
  clear: () => void;
}

/**
 * Hold a Table's bulk selection.
 *
 * @param args.items - The rows on the current page.
 * @param args.rowId - The id a row contributes to the selection.
 * @returns The selection state and its setters.
 */
export function useRowSelection<T>(args: {
  items: readonly T[];
  rowId: (item: T) => string;
}): TableRowSelectionState<T> {
  const { items, rowId } = args;
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const pageIds = useMemo(() => items.map(rowId), [items, rowId]);
  const pageState = useMemo(
    () => pageSelectionState(pageIds, selected),
    [pageIds, selected],
  );

  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setPageSelected = useCallback(
    (select: boolean) => {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const id of pageIds) {
          if (select) next.add(id);
          else next.delete(id);
        }
        return next;
      });
    },
    [pageIds],
  );

  const clear = useCallback(() => setSelected(new Set()), []);

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  return {
    rowId,
    pageIds,
    pageState,
    isSelected,
    toggle,
    setPageSelected,
    selectedIds,
    clear,
  };
}
