"use client";
import { TableRenderer, type TableRendererProps } from "./TableRenderer.js";
import { useTableLabels } from "./labels.js";
export type TableTableProps<T, G extends string, S extends string> = Omit<
  TableRendererProps<T>,
  "labels"
>;
export function TableTable<T, G extends string, S extends string>(
  props: TableTableProps<T, G, S>,
) {
  const t = useTableLabels();
  return (
    <TableRenderer
      {...props}
      labels={{
        selectPage: t("viewControls.dataView.bulk.selectPage"),
        selectRow: t("viewControls.dataView.bulk.selectRow"),
      }}
    />
  );
}
