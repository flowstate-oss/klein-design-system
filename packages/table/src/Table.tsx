"use client";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { TableRenderer } from "./TableRenderer.js";
import type { TrackSize } from "./table-sizing.js";
/** A column renders a display-ready value; querying, sorting and aggregation belong to the caller. */
export interface TableColumn<Row> {
  id: string;
  label: string;
  render: (row: Row) => ReactNode;
  width?: number;
}
/** Controlled rows and stable IDs. Use TableRenderer only for the existing advanced table adapter. */
export interface TableProps<Row> {
  label: string;
  rows: Row[];
  columns: readonly TableColumn<Row>[];
  rowKey: (row: Row) => string;
  onRowClick?: (row: Row) => void;
  emptyLabel?: string;
  loading?: boolean;
}
export function Table<Row>({
  label,
  rows,
  columns,
  rowKey,
  onRowClick,
  emptyLabel = "No results",
  loading = false,
}: TableProps<Row>) {
  const definitions = useMemo(
    () =>
      columns.map((column, index) => ({
        id: column.id,
        header: column.label,
        meta: {
          dataView: {
            kind: index === 0 ? ("title" as const) : ("property" as const),
            resizable: false,
            size: {
              min: column.width ?? 180,
              base: column.width ?? 180,
              grow: 0,
            },
          },
        },
        cell: ({ row }: { row: { original: Row } }) =>
          column.render(row.original),
      })),
    [columns],
  );
  const table = useReactTable({
    data: rows,
    columns: definitions,
    getCoreRowModel: getCoreRowModel(),
    getRowId: rowKey,
  });
  const widths = Object.fromEntries(
    columns.map((column) => [column.id, column.width ?? 180]),
  );
  const sizing = new Map<string, TrackSize>(
    columns.map((column) => [
      column.id,
      { min: column.width ?? 180, base: column.width ?? 180, grow: 0 },
    ]),
  );
  return (
    <section
      aria-label={label}
      aria-busy={loading || undefined}
      style={{ overflowX: "auto" }}
    >
      {rows.length === 0 ? (
        <p role="status">{emptyLabel}</p>
      ) : (
        <TableRenderer
          labels={{ selectPage: "Select page", selectRow: "Select row" }}
          config={{ rowKey, onRowClick }}
          table={table}
          colWidths={widths}
          minWidthPx={Object.values(widths).reduce(
            (sum, width) => sum + width,
            0,
          )}
          sizingById={sizing}
          containerWidth={0}
          isGrouped={false}
          groupedSections={[]}
          expandedGroups={{}}
          onToggleGroup={() => {}}
          dndEnabled={false}
          columnSizing={widths}
          onColumnSizing={() => {}}
          columnOrder={columns.map((column) => column.id)}
          onColumnOrder={() => {}}
          onMeasureWidths={() => {}}
        />
      )}
    </section>
  );
}
