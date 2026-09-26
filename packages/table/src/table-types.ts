/**
 * Type plumbing for the semantic-table Table: the synthetic column ids and
 * the `ColumnMeta` module augmentation that lets each TanStack column carry the
 * Table-specific concerns (kind, responsive priority, header alignment/info,
 * and resolved sizing) without resorting to casts.
 */

import type { ReactNode } from "react";
// `RowData` is referenced by the augmented `ColumnMeta` generic constraint below.
import type { RowData } from "@tanstack/react-table";
import type { TrackSize } from "./table-sizing.js";

/**
 * Reserved column ids for the three synthetic columns the table always renders
 * around the page's property columns: the avatar gutter, the flexible
 * title/content column, and the trailing actions gutter. Namespaced so they
 * never collide with a page-supplied `TableColumn.id`.
 */
export const AVATAR_COL_ID = "__dv_avatar";
export const TITLE_COL_ID = "__dv_title";
export const ACTIONS_COL_ID = "__dv_actions";
/**
 * Reserved id for the leading bulk-select checkbox column, present only when
 * the page opts into bulk actions (`TableConfig.bulkActions`). Always the
 * first column.
 */
export const SELECT_COL_ID = "__dv_select";

/** Which structural role a table column plays. */
export type TableColumnKind =
  "select" | "avatar" | "title" | "property" | "actions";

/** Table-specific metadata attached to each TanStack column via `meta.dataView`. */
export interface TableColumnMeta {
  /** Structural role — drives the `<td>`/`<th>` chrome (padding, alignment, stopPropagation). */
  kind: TableColumnKind;
  /** Responsive hide priority (property columns only); lower hides sooner. */
  priority?: number;
  /** Header-cell horizontal alignment. */
  headerAlign?: "start" | "end" | "center";
  /** Optional `(i)` tooltip copy shown beside the header label. */
  headerInfo?: ReactNode;
  /** Resolved px sizing for fluid-width distribution. */
  size: TrackSize;
  /** Whether the column exposes a drag-to-resize handle. */
  resizable: boolean;
}

declare module "@tanstack/react-table" {
  // The generic signature MUST match the upstream `ColumnMeta` declaration.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    dataView?: TableColumnMeta;
  }
}
