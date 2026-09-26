"use client";

/**
 * useTableTable — the headless engine behind the semantic-table Table.
 *
 * Builds the TanStack column model from a `TableConfig` (three synthetic
 * columns — avatar gutter, flexible title/content, actions gutter — wrapped
 * around the page's property columns), derives column visibility from the
 * PropertyPicker selection intersected with responsive priority-hiding, and
 * resolves concrete `<col>` pixel widths via {@link computeFluidWidths} so the
 * real `<table>` reproduces the previous per-row CSS grid pixel-for-pixel while
 * gaining native resize + horizontal scroll.
 *
 * Sorting / filtering / pagination / grouping stay 100% server-driven — the
 * table only ever renders `config.items` in arrival order (`manual*: true`).
 */

import { useMemo, type ReactNode } from "react";
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  type ColumnOrderState,
  type Table,
  type VisibilityState,
} from "@tanstack/react-table";
import { cn } from "@klein-ui/react/compat/utils";
import { ChangeStatusIndicator } from "./ChangeStatusIndicator.js";
import {
  RowActions,
  ROW_ACTION_BUTTON_REM,
  ROW_ACTION_GAP_REM,
} from "./RowActions.js";
import type { TableConfig } from "./view-types.js";
import {
  AVATAR_COL_ID,
  TITLE_COL_ID,
  ACTIONS_COL_ID,
  SELECT_COL_ID,
} from "./table-types.js";
import {
  tokeniseGridTemplate,
  parseTrack,
  computeFluidWidths,
  totalTableWidth,
  slotFromWidth,
  priorityVisibleAtSlot,
  contentFitBase,
  DEFAULT_PROPERTY_TRACK,
  type SizingColumn,
  type TrackSize,
} from "./table-sizing.js";

const REM_PX = 16;
/** Left page gutter (1rem) + the 2rem avatar box. */
const AVATAR_COL_PX = REM_PX + 32;
/** Content-fit DEFAULT width for the flexible title/content column (14rem) —
 *  its `base` (preferred) before grow/shrink. */
const TITLE_FLOOR_PX = 14 * REM_PX;
/** SHRINK floor for the title column — the smallest the responsive solver may
 *  shrink it to on a narrow screen before the table scrolls. Smaller than its
 *  base so the title gives up width to fit, but still wide enough to read a name. */
const TITLE_SHRINK_PX = 10 * REM_PX;
/** Right page gutter (1rem) reserved at the end of every row. */
const RIGHT_GUTTER_PX = REM_PX;
/** Gap (gap-x-3 ≈ 0.75rem) applied as the actions cell's left padding. */
const CELL_GAP_PX = 12;
/** SHRINK floor for a property column — the smallest the responsive solver may
 *  shrink it to (and the smallest a user may drag it to) before content stops
 *  fitting and the table scrolls. A column is sized to its content by default
 *  and only shrinks toward this readable floor when the screen is too narrow. */
const PROPERTY_SHRINK_PX = 96;
/** Leading bulk-select column: the 1rem page gutter + the 1rem checkbox + a
 *  0.5rem breathing gap before the avatar cell's own left padding. */
const SELECT_COL_PX = REM_PX + 16 + 8;

/**
 * Whether a Table config opts into bulk select — `bulkActions` given and
 * non-empty. The single rule the table model, the table renderer and the bulk
 * action bar share.
 *
 * @param config - The Table config.
 * @returns True when the leading checkbox column and bulk bar should render.
 */
export function hasBulkSelect<T, G extends string, S extends string>(
  config: TableConfig<T, G, S>,
): boolean {
  return (config.bulkActions?.length ?? 0) > 0;
}

/**
 * Width of the trailing actions column in pixels. Always reserves the right
 * page gutter; when the page renders actions it additionally reserves the
 * button cluster (primary + optional kebab) plus the inter-cell gap — derived
 * from the same `ROW_ACTION_*` constants `RowActions` is built from, so the
 * header gutter and the row buttons line up exactly.
 */
export function actionsColumnWidthPx(
  hasPrimary: boolean,
  hasOverflow: boolean,
): number {
  if (!hasPrimary) return RIGHT_GUTTER_PX;
  const count = 1 + (hasOverflow ? 1 : 0);
  const buttonsRem =
    ROW_ACTION_BUTTON_REM * count + ROW_ACTION_GAP_REM * (count - 1);
  return Math.round(buttonsRem * REM_PX) + CELL_GAP_PX + RIGHT_GUTTER_PX;
}

/** Per-property resolved track sizing, keyed by column id. */
function buildPropertyTracks<T, G extends string, S extends string>(
  config: TableConfig<T, G, S>,
): Map<string, TrackSize> {
  const map = new Map<string, TrackSize>();
  const tokens = config.propertiesGridTemplate
    ? tokeniseGridTemplate(config.propertiesGridTemplate)
    : [];
  config.columns.forEach((col, index) => {
    const token = tokens[index];
    map.set(col.id, token ? parseTrack(token) : DEFAULT_PROPERTY_TRACK);
  });
  return map;
}

export interface UseTableTableArgs<T, G extends string, S extends string> {
  config: TableConfig<T, G, S>;
  /** PropertyPicker selection — the user-visible property ids. */
  visibleProperties: string[];
  /** The scroll container's measured content width (px); 0 before first measure. */
  containerWidth: number;
  /** Persisted user column widths (px) keyed by column id. */
  columnSizing: Record<string, number> | undefined;
  /** Persisted user column order (full leaf-column id list), or undefined for declaration order. */
  columnOrder: string[] | undefined;
  /** Measured natural content width (px) per data column id, from the DOM —
   *  drives content-fit auto-sizing. Empty before the first measurement. */
  measuredWidths: Record<string, number>;
  /** Resolved title-column header label (`config.titleColumnLabel ?? tc('name')`). */
  titleColumnLabel: ReactNode;
}

export interface UseTableTableResult<T> {
  /** The TanStack table instance (core row model only; manual everything else). */
  table: Table<T>;
  /** Resolved pixel width for every VISIBLE leaf column, keyed by column id. */
  colWidths: Record<string, number>;
  /** The table's `min-width` in px — below it the container scrolls horizontally. */
  minWidthPx: number;
  /** Parsed track sizing keyed by column id (for resize min-clamps). */
  sizingById: Map<string, TrackSize>;
}

/**
 * Build the table model + resolved column widths for a Table list.
 */
export function useTableTable<T, G extends string, S extends string>(
  args: UseTableTableArgs<T, G, S>,
): UseTableTableResult<T> {
  const {
    config,
    visibleProperties,
    containerWidth,
    columnSizing,
    columnOrder,
    measuredWidths,
    titleColumnLabel,
  } = args;

  const propertyTracks = useMemo(() => buildPropertyTracks(config), [config]);

  // Per-column sizing (synthetic + property), keyed by id — fed to the grow/
  // shrink solver and the resize maths. Each column carries three numbers:
  //
  // - `base` (PREFERRED): the content-fit width — DOM-measured natural content,
  //   padded, capped at PROPERTY_MAX_PX, and floored at a roomy default
  //   (the page's declared template `min` if set, else 144px, never below the
  //   gentle PROPERTY_BASE_MIN_PX) so short values don't render cramped.
  // - `min` (SHRINK FLOOR): how far the responsive solver may shrink the column
  //   on a narrow screen — and the smallest a user may drag it — before content
  //   stops fitting and the table scrolls. A readable floor (PROPERTY_SHRINK_PX),
  //   never above the column's own content width.
  // - `grow` (fr weight): the title always grows to fill slack; a data column
  //   grows only if the page marked it flexible via an `fr` track
  //   (`minmax(120px, 1fr)`), so it spreads instead of the title hogging
  //   everything. Columns with no `fr` stay content-fit.
  const sizingById = useMemo(() => {
    const map = new Map<string, TrackSize>();
    if (hasBulkSelect(config)) {
      map.set(SELECT_COL_ID, {
        min: SELECT_COL_PX,
        base: SELECT_COL_PX,
        grow: 0,
      });
    }
    map.set(AVATAR_COL_ID, {
      min: AVATAR_COL_PX,
      base: AVATAR_COL_PX,
      grow: 0,
    });
    map.set(TITLE_COL_ID, {
      min: TITLE_SHRINK_PX,
      base: TITLE_FLOOR_PX,
      grow: 1,
    });
    for (const col of config.columns) {
      const track = propertyTracks.get(col.id) ?? DEFAULT_PROPERTY_TRACK;
      const base = contentFitBase(measuredWidths[col.id], track.min);
      // The shrink floor is a readable minimum, never larger than the content
      // itself (a column narrower than the floor never needs to shrink).
      const min = Math.min(base, PROPERTY_SHRINK_PX);
      map.set(col.id, { min, base, grow: track.grow });
    }
    const actionsPx = actionsColumnWidthPx(
      Boolean(config.primaryAction),
      Boolean(config.overflowActions),
    );
    map.set(ACTIONS_COL_ID, { min: actionsPx, base: actionsPx, grow: 0 });
    return map;
  }, [config, propertyTracks, measuredWidths]);

  // The TanStack column model. Display columns (no accessor) — each `cell`
  // returns fully-rendered inner content; the table component supplies only the
  // `<td>` chrome (padding, overflow, stop-propagation).
  const columns = useMemo<ColumnDef<T>[]>(() => {
    const avatar: ColumnDef<T> = {
      id: AVATAR_COL_ID,
      header: () => null,
      cell: ({ row }) => (
        <div className="flex h-8 w-8 items-center justify-center">
          {config.avatar(row.original)}
        </div>
      ),
      enableHiding: false,
      meta: {
        dataView: {
          kind: "avatar",
          size: sizingById.get(AVATAR_COL_ID) ?? DEFAULT_PROPERTY_TRACK,
          resizable: false,
        },
      },
    };

    const title: ColumnDef<T> = {
      id: TITLE_COL_ID,
      header: () => titleColumnLabel,
      cell: ({ row }) => {
        const item = row.original;
        const changeStatus = config.changeStatus?.(item) ?? null;
        return (
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              {changeStatus && <ChangeStatusIndicator status={changeStatus} />}
              <span className="truncate text-sm font-medium" data-sentry-mask>
                {config.title(item)}
              </span>
            </div>
            {config.subtitle && (
              <div className="text-muted-foreground truncate text-sm">
                {config.subtitle(item)}
              </div>
            )}
          </div>
        );
      },
      enableHiding: false,
      meta: {
        dataView: {
          kind: "title",
          size: sizingById.get(TITLE_COL_ID) ?? DEFAULT_PROPERTY_TRACK,
          resizable: true,
        },
      },
    };

    const properties: ColumnDef<T>[] = config.columns.map((col) => {
      const align = col.headerAlign ?? "start";
      return {
        id: col.id,
        header: () => col.label,
        cell: ({ row }) => (
          // `overflow-hidden` clips overflow INSIDE the cell (so a column sized
          // narrower than its content never pushes the table wider — no overflow
          // bug), while `whitespace-nowrap` keeps content single-line so the
          // content-fit measurement reads its true width and rows stay one line.
          <div
            className={cn(
              "flex min-w-0 items-center overflow-hidden whitespace-nowrap",
              align === "end"
                ? "justify-end"
                : align === "center"
                  ? "justify-center"
                  : "justify-start",
            )}
          >
            {col.render(row.original)}
          </div>
        ),
        enableHiding: true,
        meta: {
          dataView: {
            kind: "property",
            priority: col.priority,
            headerAlign: align,
            headerInfo: col.headerInfo,
            size: sizingById.get(col.id) ?? DEFAULT_PROPERTY_TRACK,
            resizable: true,
          },
        },
      };
    });

    const actions: ColumnDef<T> = {
      id: ACTIONS_COL_ID,
      header: () => null,
      cell: ({ row }) => {
        const primary = config.primaryAction?.(row.original);
        if (!primary) return null;
        return (
          <div
            data-dv-row-actions
            className={cn(
              "flex items-center justify-end",
              // Hover-reveal keeps the cluster's box (opacity, not display), so
              // the column never changes width. It stays shown while keyboard
              // focus is inside it or its overflow menu is open.
              config.rowActionsOnHover &&
                "opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100 has-[[data-state=open]]:opacity-100",
            )}
          >
            <RowActions
              primary={primary}
              overflow={config.overflowActions?.(row.original)}
            />
          </div>
        );
      },
      enableHiding: false,
      meta: {
        dataView: {
          kind: "actions",
          size: sizingById.get(ACTIONS_COL_ID) ?? DEFAULT_PROPERTY_TRACK,
          resizable: false,
        },
      },
    };

    if (!hasBulkSelect(config)) return [avatar, title, ...properties, actions];

    // The checkbox itself is rendered by TableTable (it owns the selection);
    // this column only reserves the leading track.
    const select: ColumnDef<T> = {
      id: SELECT_COL_ID,
      header: () => null,
      cell: () => null,
      enableHiding: false,
      meta: {
        dataView: {
          kind: "select",
          size: sizingById.get(SELECT_COL_ID) ?? DEFAULT_PROPERTY_TRACK,
          resizable: false,
        },
      },
    };
    return [select, avatar, title, ...properties, actions];
  }, [config, sizingById, titleColumnLabel]);

  // Visibility = PropertyPicker selection ∩ responsive priority-hiding. The
  // synthetic columns are `enableHiding: false`, so they never appear here and
  // always render. Reproduces `data-row.css` but drops the whole column (incl.
  // its `<col>`) so the table stays column-aligned at every width.
  const columnVisibility = useMemo<VisibilityState>(() => {
    const visibleSet = new Set(visibleProperties);
    const slot = slotFromWidth(containerWidth || Number.MAX_SAFE_INTEGER);
    const vis: VisibilityState = {};
    for (const col of config.columns) {
      const userVisible = visibleSet.has(col.id);
      const prioritySurvives = priorityVisibleAtSlot(col.priority, slot);
      vis[col.id] = userVisible && prioritySurvives;
    }
    return vis;
  }, [config.columns, visibleProperties, containerWidth]);

  // A persisted order predates the select column (it is never in the saved
  // list), and TanStack appends unlisted columns at the END — so pin the
  // checkbox column first whenever bulk select is on.
  const bulkSelect = hasBulkSelect(config);
  const columnOrderState = useMemo<ColumnOrderState>(() => {
    const order = columnOrder ?? [];
    if (!bulkSelect || order.length === 0) return order;
    return [SELECT_COL_ID, ...order.filter((id) => id !== SELECT_COL_ID)];
  }, [columnOrder, bulkSelect]);

  const table = useReactTable<T>({
    data: config.items,
    columns,
    state: { columnVisibility, columnOrder: columnOrderState },
    // Fully controlled — visibility changes via the derivation above and order
    // via the header drag-to-reorder (both persisted in view-state).
    onColumnVisibilityChange: () => undefined,
    onColumnOrderChange: () => undefined,
    getRowId: (item) => config.rowKey(item),
    getCoreRowModel: getCoreRowModel(),
    // The table is a pure presenter of the server-ordered page.
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true,
    enableColumnResizing: false,
  });

  const visibleLeafColumns = table.getVisibleLeafColumns();

  const sizingColumns = useMemo<SizingColumn[]>(
    () =>
      visibleLeafColumns.map((col) => ({
        id: col.id,
        size: col.columnDef.meta?.dataView?.size ?? DEFAULT_PROPERTY_TRACK,
      })),
    [visibleLeafColumns],
  );

  const colWidths = useMemo(
    () =>
      computeFluidWidths({
        containerWidth,
        columns: sizingColumns,
        columnSizing,
        fillId: TITLE_COL_ID,
      }),
    [containerWidth, sizingColumns, columnSizing],
  );

  // The table is laid out at exactly the sum of its column widths — fills the
  // container when the title's stretch absorbs the slack, exceeds it (→ scroll)
  // once columns are resized wider or the viewport is narrow.
  const minWidthPx = useMemo(() => totalTableWidth(colWidths), [colWidths]);

  return { table, colWidths, minWidthPx, sizingById };
}
