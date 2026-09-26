import type { ReactNode } from "react";
/** Presentation-only configuration. Queries, persistence and business totals belong to the adapter. */
export interface TableRenderConfig<T> {
  rowKey: (row: T) => string;
  changeStatus?: (row: T) => "ADDED" | "MODIFIED" | "DELETED" | null;
  onRowClick?: (row: T) => void;
  onRowDoubleClick?: (row: T) => void;
  rowActionsOnHover?: boolean;
  rowContextMenu?: (row: T, element: ReactNode) => ReactNode;
  groups?: { key: string; count: number }[];
  groupSubtitle?: (key: string, rows: T[]) => ReactNode;
  groupSummary?: (group: {
    key: string;
    items: T[];
  }) => Partial<Record<string, ReactNode>>;
  summaryRow?: {
    title: ReactNode;
    testId?: string;
    cells: Partial<Record<string, ReactNode>>;
  };
}
