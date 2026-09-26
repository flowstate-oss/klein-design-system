"use client";
import { createContext, useContext, type ReactNode } from "react";
export type TableTranslate = (
  key: string,
  values?: Record<string, string | number>,
) => string;
const labels: Record<string, string> = {
  name: "Name",
  "viewControls.dataView.bulk.selectPage": "Select page",
  "viewControls.dataView.bulk.selectRow": "Select row",
  "viewControls.dataView.bulk.toolbar": "Bulk actions",
  "viewControls.dataView.bulk.selected": "selected",
  "viewControls.dataView.bulk.clear": "Clear",
  "shared.changeStatus.added": "Added",
  "shared.changeStatus.modified": "Modified",
  "shared.changeStatus.deleted": "Deleted",
  reset: "Reset",
  add: "Add",
  filter: "Filter",
  back: "Back",
  "search.placeholder": "Search…",
  "empty.no-results": "No results",
  "filter.locked": "Locked filter",
  "clear.all": "Clear all",
  properties: "Properties",
  "reset.defaults": "Reset defaults",
  "sort.descending": "Sort descending",
  "sort.ascending": "Sort ascending",
  "more.actions": "More actions",
  "filter.chip.remove": "Remove {label}",
  "filter.search.loading": "Loading…",
  "filter.search.empty": "No results",
  "view.list": "List",
  "view.timeline": "Timeline",
  "view.board": "Board",
};
const fallback: TableTranslate = (key, values) =>
  Object.entries(values ?? {}).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
    labels[key] ?? key,
  );
const Context = createContext<TableTranslate>(fallback);
export function TableLabelsProvider({
  translate,
  children,
}: {
  translate: TableTranslate;
  children: ReactNode;
}) {
  return <Context.Provider value={translate}>{children}</Context.Provider>;
}
export function useTableLabels() {
  return useContext(Context);
}
