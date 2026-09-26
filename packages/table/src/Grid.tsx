"use client";

import React, { forwardRef, useMemo } from "react";
import { AgGridReact, AgGridReactProps } from "ag-grid-react";
import {
  ColDef,
  GridOptions,
  GetRowIdParams,
  ModuleRegistry,
  AllCommunityModule,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

export interface DataTableProps<
  TData = unknown,
> extends AgGridReactProps<TData> {
  /**
   * Column definitions for the table
   */
  columnDefs: ColDef<TData>[];

  /**
   * Data to display in the table
   */
  rowData: TData[];

  /**
   * Default column configuration applied to all columns
   */
  defaultColDef?: ColDef<TData>;

  /**
   * Enable pagination (default: false)
   */
  pagination?: boolean;

  /**
   * Number of rows per page (default: 20)
   */
  paginationPageSize?: number;

  /**
   * Enable row animation (default: true)
   */
  animateRows?: boolean;

  /**
   * Row selection mode - supports both legacy string format and new object format
   */
  rowSelection?: "single" | "multiple" | { mode: "singleRow" | "multiRow" };

  /**
   * Additional grid options
   */
  gridOptions?: GridOptions<TData>;

  /**
   * CSS class name for the container
   */
  className?: string;

  /**
   * Height of the table (default: 100%)
   */
  height?: string;

  /**
   * Function to get unique row ID for maintaining grid state across updates
   */
  getRowId?: (params: GetRowIdParams<TData>) => string;

  /**
   * Suppress scrolling when new data is loaded (default: false)
   */
  suppressScrollOnNewData?: boolean;
}

/**
 * DataTable - A reusable AG Grid table component with consistent styling
 *
 * This component provides a standardized table implementation using AG Grid Community
 * with the Alpine theme. It supports sorting, filtering, pagination, context menus,
 * and other common table features.
 *
 * @example
 * ```tsx
 * <DataTable
 *   rowData={employees}
 *   columnDefs={[
 *     { field: 'name', headerName: 'Name', sortable: true },
 *     { field: 'email', headerName: 'Email', filter: true }
 *   ]}
 *   pagination
 *   paginationPageSize={20}
 * />
 * ```
 */
function DataTableInner<TData = unknown>(
  {
    columnDefs,
    rowData,
    defaultColDef,
    pagination = false,
    paginationPageSize = 20,
    animateRows = true,
    rowSelection,
    gridOptions,
    className = "",
    height: _height = "100%",
    getRowId,
    suppressScrollOnNewData,
    ...restProps
  }: DataTableProps<TData>,
  ref: React.Ref<AgGridReact<TData>>,
) {
  // Default column configuration
  const mergedDefaultColDef = useMemo(
    (): ColDef => ({
      sortable: true,
      filter: true,
      resizable: true,
      ...defaultColDef,
    }),
    [defaultColDef],
  );

  // Merged grid options
  const mergedGridOptions = useMemo(
    (): GridOptions => ({
      suppressCellFocus: false,
      ensureDomOrder: true,
      theme: "legacy", // Use legacy CSS theme to match ag-grid.css
      ...gridOptions,
    }),
    [gridOptions],
  );

  return (
    <div
      className={`ag-theme-alpine w-full ${className}`}
      style={{
        height: "100%",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AgGridReact
        ref={ref}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={mergedDefaultColDef}
        pagination={pagination}
        paginationPageSize={paginationPageSize}
        animateRows={animateRows}
        rowSelection={rowSelection}
        gridOptions={mergedGridOptions}
        getRowId={getRowId}
        suppressScrollOnNewData={suppressScrollOnNewData}
        {...restProps}
      />
    </div>
  );
}

export const DataTable = forwardRef(DataTableInner) as <TData = unknown>(
  props: DataTableProps<TData> & { ref?: React.Ref<AgGridReact<TData>> },
) => React.ReactElement;

// Set display name
(
  DataTable as React.ForwardRefExoticComponent<DataTableProps<unknown>>
).displayName = "DataTable";

/**
 * Common cell renderer for displaying changes with arrows
 * Shows "current → upcoming" format with the upcoming value highlighted
 */
export const changeArrowRenderer = (params: {
  currentValue: unknown;
  upcomingValue: unknown;
  formatter?: (value: unknown) => string;
  highlightColor?: string;
}) => {
  const {
    currentValue,
    upcomingValue,
    formatter = String,
    highlightColor = "text-blue-600",
  } = params;

  if (upcomingValue !== undefined && currentValue !== upcomingValue) {
    return (
      <span className="text-secondary-foreground">
        {formatter(currentValue)} →{" "}
        <span className={`${highlightColor} font-medium`}>
          {formatter(upcomingValue)}
        </span>
      </span>
    );
  }

  return formatter(currentValue);
};

/**
 * Common cell renderer for currency values
 */
export const currencyRenderer = (
  value: number,
  currencyCode: string,
): string => {
  if (!value && value !== 0) return "-";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Common cell renderer for date values
 */
export const dateRenderer = (
  dateString: string,
  format: "short" | "long" = "short",
): string => {
  if (!dateString) return "-";

  const date = new Date(dateString);

  if (format === "short") {
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/**
 * Common cell renderer for percentage values
 */
export const percentageRenderer = (
  value: number,
  decimals: number = 0,
): string => {
  if (!value && value !== 0) return "-";
  return `${(value * 100).toFixed(decimals)}%`;
};
