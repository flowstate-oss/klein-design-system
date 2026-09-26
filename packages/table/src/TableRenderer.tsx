"use client";

/**
 * TableTable — the semantic `<table>` renderer for a grid-mode Table
 * list (i.e. a page that sets `propertiesGridTemplate`). Replaces the previous
 * per-row CSS-grid `DataRow` output with one `<table>` + a shared `<colgroup>`,
 * so the column header and every row inherit identical widths structurally
 * (zero drift) while gaining native column resize and horizontal scrolling.
 *
 * Pure presentation: it reads the column model + resolved widths from
 * {@link useTableTable} (constructed in `TableBody`) and renders the DOM.
 * Grouping is one server-driven level (`groupedSections`), rendered as one
 * `<tbody>` per group with a full-width collapsible header row. Drag-and-drop is
 * the existing dnd-kit cross-group move, re-homed onto `<tr>`/`<tbody>`.
 */

import {
  Fragment,
  forwardRef,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronDown, Info } from "lucide-react";
import {
  type Cell,
  type Header,
  type Row,
  type Table as TanstackTable,
} from "@tanstack/react-table";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useComposedRefs } from "@radix-ui/react-compose-refs";
import { cn } from "@klein-ui/react/compat/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@klein-ui/react/compat/tooltip";
import { Checkbox } from "@klein-ui/react/compat/checkbox";

import { getTableRowClasses, TABLE_CELL_CLASSES } from "./row-styles.js";
import {
  computeFluidWidths,
  resolveMeasuredContentWidth,
  resolveResizePins,
  type SizingColumn,
  type TrackSize,
} from "./table-sizing.js";
import { TITLE_COL_ID } from "./table-types.js";
import type { TableRowSelection } from "./row-selection.js";
import type { TableRenderConfig } from "./types.js";
import type { DragItemData, DropGroupData } from "./dnd-types.js";

/* -------------------------------------------------------------------------- */
/*                                 Row shells                                  */
/* -------------------------------------------------------------------------- */

const ROW_HEIGHT_STYLE = { height: "var(--row-min-height)" } as const;

/**
 * Render a TanStack header/cell template. We call the template function
 * DIRECTLY rather than via `flexRender`: `flexRender` wraps a function template
 * as a React component (`createElement(fn, ctx)`), so when a consumer rebuilds
 * its column defs every render (new function identity) React remounts every
 * cell — detaching focus/open popovers in editable cells and breaking row
 * interactions. A direct call yields host elements reconciled in place, exactly
 * like the previous `DataRow` rendering. Our templates always return a ReactNode.
 */
function renderTemplate<TProps extends object>(
  template: string | ((props: TProps) => ReactNode) | undefined,
  context: TProps,
): ReactNode {
  return typeof template === "function"
    ? template(context)
    : (template ?? null);
}

/** Plain table row. Forwards its ref + props so a `rowContextMenu` wrapper
 *  (Radix `ContextMenuTrigger asChild`) can target the `<tr>` directly. */
const DataTableRow = forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(function DataTableRow({ className, children, style, ...rest }, ref) {
  return (
    <tr
      ref={ref}
      data-row
      className={className}
      style={{ ...ROW_HEIGHT_STYLE, ...style }}
      {...rest}
    >
      {children}
    </tr>
  );
});

interface DraggableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  itemKey: string;
  groupKey: string;
}

/** Draggable table row — the whole `<tr>` is the drag handle (no grip icon).
 *  The source row is never CSS-transformed (only dimmed); the visible "moving"
 *  element is the portal `DragOverlay` rendered by `TableBody`. */
const DraggableDataTableRow = forwardRef<
  HTMLTableRowElement,
  DraggableRowProps
>(function DraggableDataTableRow(
  { itemKey, groupKey, className, children, style, ...rest },
  forwardedRef,
) {
  const dragData: DragItemData = { itemKey, groupKey };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `list-row-${itemKey}`,
    data: dragData,
  });
  const ref = useComposedRefs(forwardedRef, setNodeRef);
  return (
    <tr
      ref={ref}
      data-row
      className={cn(
        className,
        "cursor-grab touch-none select-none active:cursor-grabbing",
        isDragging && "opacity-30",
      )}
      style={{ ...ROW_HEIGHT_STYLE, ...style }}
      {...rest}
      {...attributes}
      {...listeners}
    >
      {children}
    </tr>
  );
});

/** Droppable group body — highlights when a row is dragged over it. The whole
 *  group (header + rows) is one `<tbody>`, so a drop anywhere in the group
 *  registers, matching the previous `DroppableGroup` behaviour. */
function DroppableGroupTbody({
  groupKey,
  groupLabel,
  children,
}: {
  groupKey: string;
  groupLabel: string;
  children: React.ReactNode;
}) {
  const dropData: DropGroupData = { groupKey, groupLabel };
  const { setNodeRef, isOver } = useDroppable({
    id: `list-group-${groupKey}`,
    data: dropData,
  });
  return (
    <tbody
      ref={setNodeRef}
      className={cn("transition-colors", isOver && "ring-primary/40 ring-2")}
    >
      {children}
    </tbody>
  );
}

/* -------------------------------------------------------------------------- */
/*                               TableTable                                 */
/* -------------------------------------------------------------------------- */

export interface TableRendererProps<T> {
  labels: { selectPage: string; selectRow: string };
  config: TableRenderConfig<T>;
  table: TanstackTable<T>;
  colWidths: Record<string, number>;
  minWidthPx: number;
  sizingById: Map<string, TrackSize>;
  /** Scroll container content width (px) — drives the live resize recompute. */
  containerWidth: number;
  isGrouped: boolean;
  groupedSections: { key: string; label: string; items: T[] }[];
  expandedGroups: Record<string, boolean>;
  onToggleGroup: (key: string) => void;
  dndEnabled: boolean;
  columnSizing: Record<string, number> | undefined;
  /** Commit a resized column width (px) to the persisted sizing map. */
  onColumnSizing: (sizing: Record<string, number>) => void;
  columnOrder: string[] | undefined;
  /** Commit a reordered column list (full leaf-column id order) to view-state. */
  onColumnOrder: (order: string[]) => void;
  /** Report each data column's measured natural content width (px) for content-fit sizing. */
  onMeasureWidths: (widths: Record<string, number>) => void;
  /**
   * Bulk-select state, present only when the page opts into `bulkActions`.
   * Drives the leading checkbox column (header = the rows on this page).
   */
  selection?: TableRowSelection<T>;
  /**
   * Navigate to a row's entity page (`config.rowHref`), present only when the
   * page gave `rowHref` and no `onRowClick`. Receives the click so cmd/ctrl
   * can open a new tab.
   */
  onRowNavigate?: (item: T, event: React.MouseEvent) => void;
}

/** Horizontal padding for a cell at position `idx` of `count`: 16px page gutter
 *  on the first cell, a 12px inter-column gap (left padding) on the rest, and a
 *  16px page gutter on the last (actions) cell. */
function cellPadClass(idx: number, count: number): string {
  return cn(idx === 0 ? "pl-4" : "pl-3", idx === count - 1 && "pr-4");
}

/**
 * Vertical column divider (right border) for a cell at position `idx` of
 * `count`. Drawn between data columns — after the title and every property
 * column except the last — so the table reads as a grid of cells. Skipped on
 * the avatar gutter (it merges visually with the title), the final data column,
 * and the trailing actions gutter. `leading` is the number of columns before
 * the avatar gutter (1 when the bulk-select checkbox column is present), which
 * shift where the dividers start.
 */
function columnDividerClass(idx: number, count: number, leading = 0): string {
  return idx >= 1 + leading && idx <= count - 3
    ? "border-border/60 border-r"
    : "";
}

// Stickiness lives on the `<thead>` element (see the table render), NOT per-cell:
// a `position: sticky` `<th>` with z-index loses the paint war to body cells across
// multiple `<tbody>` groups in Chromium, so the header would render UNDER scrolled
// rows. The cells only carry their opaque background + chrome.
const HEADER_CELL_BASE =
  "bg-background border-b py-2 align-middle text-left font-medium";

export function TableRenderer<T>(props: TableRendererProps<T>) {
  const {
    config,
    table,
    colWidths,
    minWidthPx,
    sizingById,
    containerWidth,
    isGrouped,
    groupedSections,
    expandedGroups,
    onToggleGroup,
    dndEnabled,
    columnSizing,
    onColumnSizing,
    columnOrder,
    onColumnOrder,
    onMeasureWidths,
    selection,
    onRowNavigate,
  } = props;

  // The bulk-select checkbox column sits before the avatar gutter, shifting
  // where the column dividers start by one.
  const leading = selection ? 1 : 0;

  const colRefs = useRef<Map<string, HTMLTableColElement | null>>(new Map());
  const tableRef = useRef<HTMLTableElement>(null);
  // True while a column-resize drag is in flight, so the header's native
  // reorder drag stands down (grabbing the grip resizes, never reorders).
  const resizingRef = useRef(false);

  // ── Header drag-to-reorder (native HTML5 DnD) ──────────────────────────────
  // Reordering is isolated to the header row, so it never conflicts with the
  // row-level dnd-kit DndContext (used for cross-group moves). The dragged
  // column id is held in a ref; `dragOverColId` drives the drop-target hint.
  const dragColRef = useRef<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  const reorderColumns = useCallback(
    (fromId: string, toId: string) => {
      if (fromId === toId) return;
      const base =
        columnOrder && columnOrder.length > 0
          ? columnOrder
          : table.getAllLeafColumns().map((c) => c.id);
      const next = base.filter((id) => id !== fromId);
      const at = next.indexOf(toId);
      if (at === -1) return;
      next.splice(at, 0, fromId);
      onColumnOrder(next);
    },
    [columnOrder, onColumnOrder, table],
  );

  // Imperative LTR column resize. The dragged column tracks the cursor (drag
  // right to grow, left to shrink, down to its small structural floor — it
  // truncates below its content, Excel-style). The equal-and-opposite delta is
  // absorbed by the furthest-right data column so the table stays glued to the
  // container; once the absorber bottoms out (or the dragged column is the
  // rightmost / the fill), the elastic fill yields and then the table scrolls.
  //
  // Every move recomputes the WHOLE layout through the same pure
  // `resolveResizePins` → `computeFluidWidths` the committed state uses, then
  // writes each `<col>` + the `<table>` width directly (no React churn). Because
  // the live preview and the committed pins resolve through identical maths,
  // nothing jumps on pointer-up.
  const startResize = useCallback(
    (columnId: string, e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      resizingRef.current = true;
      const startX = e.clientX;
      const startWidths = { ...colWidths };
      const startW =
        startWidths[columnId] ?? sizingById.get(columnId)?.base ?? 100;
      const tableEl = tableRef.current;

      // Static inputs for the pure resolver, captured once at drag start.
      const leaves = table.getVisibleLeafColumns();
      const sizingColumns: SizingColumn[] = leaves.map((col) => ({
        id: col.id,
        size: col.columnDef.meta?.dataView?.size ?? {
          min: 56,
          base: 100,
          grow: 0,
        },
      }));
      const propertyOrder = leaves
        .filter((col) => col.columnDef.meta?.dataView?.kind === "property")
        .map((col) => col.id);
      const minById: Record<string, number> = {};
      for (const c of sizingColumns) minById[c.id] = c.size.min;

      let committed: Record<string, number> | null = null;

      const apply = (pins: Record<string, number>) => {
        const widths = computeFluidWidths({
          containerWidth,
          columns: sizingColumns,
          columnSizing: pins,
          fillId: TITLE_COL_ID,
        });
        for (const [id, w] of Object.entries(widths)) {
          const el = colRefs.current.get(id);
          if (el) el.style.width = `${w}px`;
        }
        const total = Object.values(widths).reduce((acc, w) => acc + w, 0);
        if (tableEl) {
          tableEl.style.width = `${total}px`;
          tableEl.style.minWidth = `${total}px`;
        }
      };

      const onMove = (ev: PointerEvent) => {
        const pins = resolveResizePins({
          draggedId: columnId,
          desiredWidth: startW + (ev.clientX - startX),
          startWidths,
          pins: columnSizing,
          propertyOrder,
          minById,
          fillId: TITLE_COL_ID,
        });
        committed = pins;
        apply(pins);
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        resizingRef.current = false;
        // Commit only on a real drag (ignore a zero-delta click on the grip).
        if (committed) onColumnSizing(committed);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [
      colWidths,
      sizingById,
      table,
      containerWidth,
      columnSizing,
      onColumnSizing,
    ],
  );

  const stopPropagation = useCallback(
    (e: React.MouseEvent) => e.stopPropagation(),
    [],
  );

  // ── Sticky column-header height ────────────────────────────────────────────
  // Sticky GROUP headers pin at `top: var(--dv-thead-h)` so they land directly
  // beneath the (sticky) column header. That height is NOT stable at first
  // paint: columns start at their default track width, which wraps two-word
  // labels ("Year to date", "Over / under") onto a second line, and content-fit
  // sizing widens them a beat later — the header then unwraps and shrinks. A
  // one-shot measurement therefore publishes the wrapped height for the life of
  // the view, pinning every group header that many pixels too low, where it
  // paints over the first row of its own group. Observe the header instead so
  // the variable tracks its real height (initial paint, column resize, font
  // load, zoom).
  useLayoutEffect(() => {
    const root = tableRef.current;
    const head = root?.querySelector("thead");
    if (!root || !head) return;
    const publish = () => {
      const height = Math.round(head.getBoundingClientRect().height);
      // A zero reading (detached/hidden table) would pin group headers at the
      // very top of the scrollport, under the column header — keep the last
      // good value instead.
      if (height > 0) root.style.setProperty("--dv-thead-h", `${height}px`);
    };
    publish();
    // jsdom has no ResizeObserver; the initial `publish()` above is what the
    // component tests see.
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(publish);
    observer.observe(head);
    return () => observer.disconnect();
  }, []);

  // ── Content-fit measurement ────────────────────────────────────────────────
  // After each render that changes the columns or the visible rows, measure the
  // natural content width of every property column (the widest of its header
  // label and its cells' content) and report it up so the hook can size each
  // column to fit.
  //
  // The invariant that keeps this stable: a measurement must be INDEPENDENT of
  // the column's current rendered width, so a second pass over an already
  // laid-out table reports the same widths (a fixed point). Headers satisfy it
  // via `scrollWidth` (the header label is an inline-flex span that
  // shrink-wraps). Cells do NOT — their wrapper is a block div that fills the
  // `<td>`, so its `scrollWidth` echoes the column width back for any cell
  // narrower than its column. Cells are therefore measured with a Range union
  // rect of the wrapper's contents (shrink-wrapped flex children make that
  // intrinsic), filtered through `resolveMeasuredContentWidth`, which discards
  // readings that only restate the column width. A tolerance guard then drops
  // sub-pixel deltas so rounding can never re-trigger a state update.
  const rows = table.getRowModel().rows;
  const measureSignature = [
    table
      .getVisibleLeafColumns()
      .map((c) => c.id)
      .join(","),
    rows.length,
    rows[0]?.id ?? "",
    rows[rows.length - 1]?.id ?? "",
  ].join("|");
  const lastMeasuredRef = useRef<Record<string, number>>({});
  useLayoutEffect(() => {
    const root = tableRef.current;
    if (!root) return;
    const widths: Record<string, number> = {};
    root.querySelectorAll<HTMLElement>("thead [data-dv-head]").forEach((el) => {
      const id = el.getAttribute("data-dv-head");
      if (id) widths[id] = Math.max(widths[id] ?? 0, el.scrollWidth);
    });
    const range = document.createRange();
    // jsdom's Range has no getBoundingClientRect — fall through to the
    // zero-geometry (unmeasurable) branch there, exactly like its 0 scrollWidth.
    const rectWidth =
      typeof range.getBoundingClientRect === "function"
        ? (el: HTMLElement) => {
            range.selectNodeContents(el);
            return range.getBoundingClientRect().width;
          }
        : () => 0;
    root
      .querySelectorAll<HTMLElement>("tbody td[data-dv-col]")
      .forEach((td) => {
        const id = td.getAttribute("data-dv-col");
        const content = td.firstElementChild;
        if (id && content instanceof HTMLElement) {
          const measured = resolveMeasuredContentWidth({
            scrollWidth: content.scrollWidth,
            clientWidth: content.clientWidth,
            contentRectWidth: rectWidth(content),
          });
          if (measured !== null)
            widths[id] = Math.max(widths[id] ?? 0, measured);
        }
      });
    const prev = lastMeasuredRef.current;
    const prevIds = Object.keys(prev);
    const nextIds = Object.keys(widths);
    const unchanged =
      prevIds.length === nextIds.length &&
      nextIds.every((id) => id in prev && Math.abs(prev[id] - widths[id]) <= 1);
    if (!unchanged) {
      lastMeasuredRef.current = widths;
      onMeasureWidths(widths);
    }
    // measureSignature captures the relevant inputs; the DOM read happens here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measureSignature, onMeasureWidths]);

  const renderHeaderCell = (
    header: Header<T, unknown>,
    idx: number,
    count: number,
  ) => {
    const meta = header.column.columnDef.meta?.dataView;
    const kind = meta?.kind ?? "property";
    const pad = cellPadClass(idx, count);
    const divider = columnDividerClass(idx, count, leading);

    if (kind === "select") {
      const pageState = selection?.pageState ?? "none";
      return (
        <th
          key={header.id}
          className={cn(HEADER_CELL_BASE, pad)}
          data-dv-select-head
        >
          <Checkbox
            aria-label={props.labels.selectPage}
            checked={
              pageState === "all"
                ? true
                : pageState === "some"
                  ? "indeterminate"
                  : false
            }
            // Decide from the page's own state, not the value handed back: a
            // partly selected page selects the rest (Radix's indeterminate →
            // checked), a fully selected page clears.
            onCheckedChange={() =>
              selection?.setPageSelected(pageState !== "all")
            }
            disabled={!selection || selection.pageIds.length === 0}
          />
        </th>
      );
    }

    if (kind === "avatar" || kind === "actions") {
      return (
        <th
          key={header.id}
          aria-hidden
          className={cn(HEADER_CELL_BASE, pad, divider)}
        />
      );
    }

    const align = meta?.headerAlign ?? "start";
    const columnId = header.column.id;
    const isProperty = kind === "property";
    return (
      <th
        key={header.id}
        // Property headers are draggable to reorder; the title column is fixed.
        draggable={isProperty}
        onDragStart={
          isProperty
            ? (e) => {
                // Grabbing the resize grip must not start a reorder.
                if (resizingRef.current) {
                  e.preventDefault();
                  return;
                }
                dragColRef.current = columnId;
                e.dataTransfer.effectAllowed = "move";
              }
            : undefined
        }
        onDragOver={
          isProperty
            ? (e) => {
                if (!dragColRef.current || dragColRef.current === columnId)
                  return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (dragOverColId !== columnId) setDragOverColId(columnId);
              }
            : undefined
        }
        onDragLeave={
          isProperty
            ? () =>
                setDragOverColId((prev) => (prev === columnId ? null : prev))
            : undefined
        }
        onDrop={
          isProperty
            ? (e) => {
                e.preventDefault();
                const from = dragColRef.current;
                dragColRef.current = null;
                setDragOverColId(null);
                if (from) reorderColumns(from, columnId);
              }
            : undefined
        }
        onDragEnd={
          isProperty
            ? () => {
                dragColRef.current = null;
                setDragOverColId(null);
              }
            : undefined
        }
        className={cn(
          HEADER_CELL_BASE,
          pad,
          divider,
          "group/th relative",
          isProperty && "cursor-grab active:cursor-grabbing",
          dragOverColId === columnId && "bg-primary/10",
          align === "end" && "text-right",
          align === "center" && "text-center",
        )}
      >
        <span
          data-dv-head={isProperty ? columnId : undefined}
          className={cn(
            "inline-flex items-center gap-1",
            align === "end" && "justify-end",
            align === "center" && "justify-center",
          )}
        >
          {renderTemplate(header.column.columnDef.header, header.getContext())}
          {meta?.headerInfo != null && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help">
                  <Info className="text-muted-foreground/50 h-3.5 w-3.5" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs normal-case">
                {meta.headerInfo}
              </TooltipContent>
            </Tooltip>
          )}
        </span>
        {meta?.resizable && (
          // Resize grip sits on the column divider, straddling the right edge.
          // Invisible until the header is hovered, then a primary line appears
          // so the resize point is discoverable; `cursor-col-resize` confirms it.
          <span
            role="separator"
            aria-orientation="vertical"
            // Don't let grabbing the grip start a column-reorder drag.
            draggable={false}
            onDragStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onPointerDown={(e) => startResize(columnId, e)}
            onClick={stopPropagation}
            className="group/grip absolute top-0 -right-1 z-20 flex h-full w-2 cursor-col-resize touch-none select-none justify-center"
          >
            <span className="bg-primary h-full w-px opacity-0 transition-opacity group-hover/th:opacity-40 group-hover/grip:opacity-100" />
          </span>
        )}
      </th>
    );
  };

  const renderCell = (cell: Cell<T, unknown>, idx: number, count: number) => {
    const meta = cell.column.columnDef.meta?.dataView;
    const kind = meta?.kind ?? "property";
    if (kind === "select") {
      const id = selection?.rowId(cell.row.original) ?? cell.row.id;
      return (
        <td
          key={cell.id}
          data-dv-select-cell
          className={cn(TABLE_CELL_CLASSES, cellPadClass(idx, count))}
          // Ticking a row must never open it.
          onClick={stopPropagation}
          onDoubleClick={stopPropagation}
        >
          <Checkbox
            aria-label={props.labels.selectRow}
            checked={selection?.isSelected(id) ?? false}
            onCheckedChange={() => selection?.toggle(id)}
          />
        </td>
      );
    }
    const measurable = kind === "title" || kind === "property";
    const clip = measurable ? "overflow-hidden" : undefined;
    // With `rowHref` a click anywhere in the row opens the entity page, so
    // property cells let single clicks through (see `TableConfig.rowHref`).
    const stopHandlers =
      kind === "property"
        ? onRowNavigate
          ? { onDoubleClick: stopPropagation }
          : { onClick: stopPropagation, onDoubleClick: stopPropagation }
        : kind === "actions"
          ? { onClick: stopPropagation }
          : undefined;
    return (
      <td
        key={cell.id}
        // The content wrapper's scrollWidth is measured for content-fit sizing.
        data-dv-col={kind === "property" ? cell.column.id : undefined}
        className={cn(
          TABLE_CELL_CLASSES,
          cellPadClass(idx, count),
          columnDividerClass(idx, count, leading),
          clip,
        )}
        {...stopHandlers}
      >
        {renderTemplate(cell.column.columnDef.cell, cell.getContext())}
      </td>
    );
  };

  const renderRow = (row: Row<T>, groupKey: string | undefined) => {
    const item = row.original;
    const changeStatus = config.changeStatus?.(item) ?? null;
    const interactive = Boolean(
      config.onRowClick || config.onRowDoubleClick || onRowNavigate,
    );
    const className = cn(
      getTableRowClasses(changeStatus, interactive),
      // Named group so the hover-revealed actions key off THIS row only.
      config.rowActionsOnHover && "group/row",
    );
    const cells = row.getVisibleCells();
    const children = cells.map((cell, idx) =>
      renderCell(cell, idx, cells.length),
    );
    // `onRowClick` wins over `rowHref` (TableBody only passes
    // `onRowNavigate` when there is no `onRowClick`).
    const onClick = config.onRowClick
      ? () => config.onRowClick?.(item)
      : onRowNavigate
        ? (event: React.MouseEvent) => onRowNavigate(item, event)
        : undefined;
    const onDoubleClick = config.onRowDoubleClick
      ? () => config.onRowDoubleClick?.(item)
      : undefined;

    const rowEl =
      dndEnabled && groupKey !== undefined ? (
        <DraggableDataTableRow
          itemKey={row.id}
          groupKey={groupKey}
          className={className}
          onClick={onClick}
          onDoubleClick={onDoubleClick}
        >
          {children}
        </DraggableDataTableRow>
      ) : (
        <DataTableRow
          className={className}
          onClick={onClick}
          onDoubleClick={onDoubleClick}
        >
          {children}
        </DataTableRow>
      );

    const content = config.rowContextMenu
      ? config.rowContextMenu(item, rowEl)
      : rowEl;
    return <Fragment key={row.id}>{content}</Fragment>;
  };

  const visibleLeafColumns = table.getVisibleLeafColumns();
  const colSpan = visibleLeafColumns.length;
  const headers = table.getHeaderGroups()[0]?.headers ?? [];
  const rowsById = table.getRowModel().rowsById;

  // Group header WITH per-column totals (`config.groupSummary`): the collapse
  // toggle (label, count, subtitle) spans every column up to and including the
  // title; each later column gets its own cell, aligned exactly like the
  // summary row's (same `<col>` tracks, padding, dividers and alignment).
  const renderGroupSummaryHeaderRow = (
    section: { key: string; label: string; items: T[] },
    isExpanded: boolean,
    count: number,
    subtitle: ReactNode,
    cells: Partial<Record<string, ReactNode>>,
  ) => {
    const span =
      visibleLeafColumns.findIndex((col) => col.id === TITLE_COL_ID) + 1;
    const stickyStyle = { top: "var(--dv-thead-h, 36px)" };
    const stickyCell = "bg-muted sticky z-10 border-b";
    return (
      <tr data-testid="dataview-group-header-row">
        <td
          colSpan={span}
          data-testid="dataview-group-header"
          style={stickyStyle}
          className={cn(stickyCell, "p-0")}
        >
          <button
            type="button"
            onClick={() => onToggleGroup(section.key)}
            className="hover:bg-muted/80 flex w-full items-center justify-between px-4 py-2 text-left transition-colors"
          >
            <span className="flex min-w-0 items-center gap-2">
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform",
                  isExpanded ? "" : "-rotate-90",
                )}
              />
              <span className="truncate text-sm font-semibold">
                {section.label}
              </span>
              <span className="text-muted-foreground text-sm">({count})</span>
            </span>
            {subtitle != null && (
              <span className="text-muted-foreground ml-auto pl-2 font-mono text-xs font-semibold">
                {subtitle}
              </span>
            )}
          </button>
        </td>
        {visibleLeafColumns.slice(span).map((col, offset) => {
          const idx = span + offset;
          const meta = col.columnDef.meta?.dataView;
          const kind = meta?.kind ?? "property";
          const align = meta?.headerAlign ?? "start";
          return (
            <td
              key={col.id}
              data-dv-group-col={kind === "property" ? col.id : undefined}
              style={stickyStyle}
              className={cn(
                stickyCell,
                "py-2 align-middle text-sm font-semibold",
                cellPadClass(idx, colSpan),
                columnDividerClass(idx, colSpan, leading),
                kind === "property" && "overflow-hidden",
                align === "end" && "text-right",
                align === "center" && "text-center",
              )}
            >
              {kind === "property" ? (cells[col.id] ?? null) : null}
            </td>
          );
        })}
      </tr>
    );
  };

  const renderGroupHeaderRow = (
    section: { key: string; label: string; items: T[] },
    isExpanded: boolean,
  ) => {
    const count =
      config.groups?.find((g) => g.key === section.key)?.count ??
      section.items.length;
    const subtitle = config.groupSubtitle?.(section.key, section.items);
    if (config.groupSummary) {
      const cells = config.groupSummary({
        key: section.key,
        items: section.items,
      });
      return renderGroupSummaryHeaderRow(
        section,
        isExpanded,
        count,
        subtitle,
        cells,
      );
    }
    return (
      <tr>
        <td
          colSpan={colSpan}
          data-testid="dataview-group-header"
          // Sticky just below the (sticky) column header — `--dv-thead-h` is the
          // measured header height (see the content-measure effect). Opaque
          // background (not /50) so scrolled rows don't bleed through while pinned.
          style={{ top: "var(--dv-thead-h, 36px)" }}
          className="bg-muted hover:bg-muted/80 sticky z-10 border-b p-0 transition-colors"
        >
          <button
            type="button"
            onClick={() => onToggleGroup(section.key)}
            className="flex w-full items-center justify-between px-4 py-2 text-left"
          >
            <span className="flex items-center gap-2">
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  isExpanded ? "" : "-rotate-90",
                )}
              />
              <span className="text-sm font-semibold">{section.label}</span>
              <span className="text-muted-foreground text-sm">({count})</span>
            </span>
            {subtitle != null && (
              <span className="text-muted-foreground ml-auto font-mono text-xs font-semibold">
                {subtitle}
              </span>
            )}
          </button>
        </td>
      </tr>
    );
  };

  // The page's totals row (`config.summaryRow`): one cell per visible leaf
  // column, in the same order and widths as the header, pinned to the bottom of
  // the scroll container so it stays in view while the rows scroll.
  const summaryRow = config.summaryRow;
  const renderSummaryRow = () => {
    if (!summaryRow) return null;
    return (
      <tfoot className="bg-muted sticky bottom-0 z-20">
        <tr
          data-testid={summaryRow.testId ?? "dataview-summary-row"}
          className="font-semibold"
          style={ROW_HEIGHT_STYLE}
        >
          {visibleLeafColumns.map((col, idx) => {
            const meta = col.columnDef.meta?.dataView;
            const kind = meta?.kind ?? "property";
            const align = meta?.headerAlign ?? "start";
            const content =
              kind === "title"
                ? summaryRow.title
                : kind === "property"
                  ? summaryRow.cells[col.id]
                  : null;
            return (
              <td
                key={col.id}
                data-dv-summary-col={kind === "property" ? col.id : undefined}
                className={cn(
                  TABLE_CELL_CLASSES,
                  "bg-muted border-t",
                  cellPadClass(idx, colSpan),
                  columnDividerClass(idx, colSpan, leading),
                  (kind === "title" || kind === "property") &&
                    "overflow-hidden",
                  align === "end" && "text-right",
                  align === "center" && "text-center",
                )}
              >
                {content ?? null}
              </td>
            );
          })}
        </tr>
      </tfoot>
    );
  };

  return (
    <table
      ref={tableRef}
      className="border-separate border-spacing-0 text-sm"
      style={{
        tableLayout: "fixed",
        width: `${minWidthPx}px`,
        minWidth: `${minWidthPx}px`,
      }}
    >
      <colgroup>
        {visibleLeafColumns.map((col) => (
          <col
            key={col.id}
            ref={(el) => {
              colRefs.current.set(col.id, el);
            }}
            style={{ width: `${colWidths[col.id] ?? 0}px` }}
          />
        ))}
      </colgroup>
      <thead className="bg-background sticky top-0 z-20">
        <tr
          data-testid="dataview-column-header"
          className="text-muted-foreground text-xs font-medium tracking-wider uppercase"
        >
          {headers.map((header, idx) =>
            renderHeaderCell(header, idx, headers.length),
          )}
        </tr>
      </thead>
      {isGrouped ? (
        groupedSections.map((section) => {
          const isExpanded = expandedGroups[section.key] !== false;
          const inner = (
            <>
              {renderGroupHeaderRow(section, isExpanded)}
              {isExpanded
                ? section.items.map((item) => {
                    const row = rowsById[config.rowKey(item)];
                    return row ? renderRow(row, section.key) : null;
                  })
                : null}
            </>
          );
          return dndEnabled ? (
            <DroppableGroupTbody
              key={section.key}
              groupKey={section.key}
              groupLabel={section.label}
            >
              {inner}
            </DroppableGroupTbody>
          ) : (
            <tbody key={section.key}>{inner}</tbody>
          );
        })
      ) : (
        <tbody>
          {table.getRowModel().rows.map((row) => renderRow(row, undefined))}
        </tbody>
      )}
      {renderSummaryRow()}
    </table>
  );
}
