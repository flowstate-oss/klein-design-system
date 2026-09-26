"use client";
import { AgGridReact, type AgGridReactProps } from "ag-grid-react";
import type { Ref } from "react";
/** Migration boundary for existing editable enterprise grids. New read-only tables use Table. */
export type GridEngineProps<Row = unknown> = AgGridReactProps<Row> & {
  ref?: Ref<AgGridReact<Row>>;
};
export type GridEngineRef<Row = unknown> = AgGridReact<Row>;
export function GridEngine<Row = unknown>({
  ref,
  ...props
}: GridEngineProps<Row>) {
  return <AgGridReact<Row> ref={ref} {...props} />;
}
