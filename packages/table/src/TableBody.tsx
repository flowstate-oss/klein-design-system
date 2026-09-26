"use client";

/**
 * TableBody — the rendering half of the (now decomposed) Table. Owns
 * everything *below* the control panel: list grouping, the grid-template
 * tokeniser, drag-and-drop, the list / timeline / kanban switch, pagination,
 * and the drag side-effect UI. It reads all view state from `useView()` (the
 * shared state machine) rather than owning it, so the toolbar (ViewControlPanel)
 * and the body stay in lock-step.
 *
 * Internal to the data-view module — pages never render this directly; they
 * render `Table`, which composes ViewProvider → ViewControlPanel →
 * ViewLayout('single') → TableBody.
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { useTableLabels } from "./labels.js";
import { DataRowContainer } from "./DataRowContainer.js";
import { KanbanView } from "./KanbanView.js";
import { TimelineView } from "./TimelineView.js";
import { TableTable } from "./TableTable.js";
import { useTableTable, hasBulkSelect } from "./useTableTable.js";
import { useRowSelection } from "./row-selection.js";
import { RowHrefNavigation } from "./row-navigation.js";
import { TableBulkActionBar } from "./TableBulkActionBar.js";
import { PaginationControls } from "./controls/PaginationControls.js";
import type { TableConfig } from "./view-types.js";
import type { DragItemData, DropGroupData } from "./dnd-types.js";
import { useView } from "./ViewContext.js";

/* -------------------------------------------------------------------------- */
/*                          Pending Drop State                                 */
/* -------------------------------------------------------------------------- */

/** State tracked when a drag-and-drop is awaiting confirmation via side-effect UI. */
interface PendingDrop<T> {
  /** The item being moved */
  item: T;
  /** The target group value (e.g., team ID) */
  targetValue: string;
  /** Display label for the target (e.g., "Product Team") */
  targetLabel: string;
}

/* -------------------------------------------------------------------------- */
/*                          Grouping Helper                                    */
/* -------------------------------------------------------------------------- */

interface GroupedSection<T> {
  key: string;
  /** Display label for the group header (server `listGroupLabel`, else groupTitle/key). */
  label: string;
  items: T[];
}

/**
 * Read the server-emitted group key/label off a list node. When a list query is
 * group-ordered (`input.groupRows`), every node carries `listGroupKey` +
 * `listGroupLabel` — the single, generic source of grouping for every page.
 * Returns null for ungrouped/legacy nodes so the caller can fall back to the
 * page's `groupKeyExtractor` (only genuinely client-derived dimensions, e.g.
 * `changedInPlan`, still need one).
 */
function readNodeGroup(item: unknown): { key: string; label: string } | null {
  if (item && typeof item === "object") {
    const rec = item as Record<string, unknown>;
    if (typeof rec.listGroupKey === "string") {
      return {
        key: rec.listGroupKey,
        label:
          typeof rec.listGroupLabel === "string"
            ? rec.listGroupLabel
            : rec.listGroupKey,
      };
    }
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/*                          TableBody Component                             */
/* -------------------------------------------------------------------------- */

/**
 * Rendering body for `Table`. Reads view state from `useView()` and the
 * page's data/render config from props.
 *
 * @template T - The item type rendered in each row.
 * @template G - String union of available groupBy values.
 * @template S - String union of available sortBy values.
 */
export function TableBody<T, G extends string, S extends string>({
  config,
}: {
  config: TableConfig<T, G, S>;
}) {
  const tc = useTableLabels();
  const view = useView<G, S>();
  const { state, search } = view;

  /* ── Visible columns set ── */

  const visibleColumnSet = useMemo(
    () => new Set(state.visibleProperties),
    [state.visibleProperties],
  );

  /* ── Grouping ── */

  const isGrouped = state.groupBy !== config.groupNoneValue;

  const groupedSections = useMemo<GroupedSection<T>[]>(() => {
    if (!isGrouped || config.items.length === 0) return [];

    // Canonical, generic path: the server emits `listGroupKey`/`listGroupLabel`
    // on each node when the query is group-ordered (`groupRows`). Group by that.
    // Client-derived dimensions the server can't order (e.g. `changedInPlan`)
    // fall back to the page's `groupKeyExtractor`. A Map keeps same-key rows in a
    // single section; insertion order preserves the server's group ordering.
    const byKey = new Map<string, GroupedSection<T>>();
    for (const item of config.items) {
      const ng = readNodeGroup(item);
      const key =
        ng?.key ?? config.groupKeyExtractor?.(item, state.groupBy as G) ?? "";
      const label =
        ng?.label ?? (config.groupTitle ? config.groupTitle(key) : key);
      const existing = byKey.get(key);
      if (existing) existing.items.push(item);
      else byKey.set(key, { key, label, items: [item] });
    }
    return Array.from(byKey.values());
  }, [
    isGrouped,
    config.items,
    config.groupKeyExtractor,
    config.groupTitle,
    state.groupBy,
  ]);

  /* ── Determine empty states ── */

  const hasActiveFilters = useMemo(() => {
    if (search.trim().length > 0) return true;
    return Object.values(state.filters).some((ids) => ids.length > 0);
  }, [search, state.filters]);

  const isEmpty = config.items.length === 0 && !config.loading;

  /* ── Table model (every list view) ── */

  // Measure the scroll container so the table can resolve fluid widths and apply
  // responsive priority-hiding against the available width.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    setContainerWidth(el.clientWidth);
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setContainerWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Content-fit auto-sizing: TableTable measures each data column's natural
  // content width from the DOM and reports it here; the hook sizes the columns
  // to fit. TableTable guarantees the reported widths are intrinsic content
  // widths (independent of the current column widths), so a measurement never
  // feeds back into itself and re-measuring a laid-out table is a no-op.
  const [measuredWidths, setMeasuredWidths] = useState<Record<string, number>>(
    {},
  );

  const titleColumnLabel = config.titleColumnLabel ?? tc("name");
  const { table, colWidths, minWidthPx, sizingById } = useTableTable<T, G, S>({
    config,
    visibleProperties: state.visibleProperties,
    containerWidth,
    columnSizing: state.columnSizing,
    columnOrder: state.columnOrder,
    measuredWidths,
    titleColumnLabel,
  });

  /* ── Bulk select (opt-in via `bulkActions`) ── */

  const bulkSelect = hasBulkSelect(config);
  const rowId = config.getRowId ?? config.rowKey;
  const selection = useRowSelection<T>({ items: config.items, rowId });

  /* ── DnD setup ── */

  const activeMutationConfig = useMemo(() => {
    if (!config.propertyMutations || config.propertyMutations.length === 0)
      return null;
    return (
      config.propertyMutations.find((pm) => pm.propertyKey === state.groupBy) ??
      null
    );
  }, [config.propertyMutations, state.groupBy]);

  // DnD reorders the grouped sections in list mode.
  const dndEnabled = activeMutationConfig !== null && isGrouped;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const [pendingDrop, setPendingDrop] = useState<PendingDrop<T> | null>(null);
  const [activeItemKey, setActiveItemKey] = useState<string | null>(null);

  /** Build a lookup from item key to item for fast drag overlay rendering. */
  const itemsByKey = useMemo(() => {
    const map = new Map<string, T>();
    for (const item of config.items) {
      map.set(config.rowKey(item), item);
    }
    return map;
  }, [config.items, config.rowKey]);

  const activeItem = activeItemKey
    ? (itemsByKey.get(activeItemKey) ?? null)
    : null;

  const handleDragStart = useCallback(
    (event: { active: { data: { current?: Record<string, unknown> } } }) => {
      const data = event.active.data.current as DragItemData | undefined;
      if (data) {
        setActiveItemKey(data.itemKey);
      }
    },
    [],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveItemKey(null);

      if (!activeMutationConfig) return;

      const dragData = event.active.data.current as DragItemData | undefined;
      const dropData = event.over?.data.current as DropGroupData | undefined;

      if (!dragData || !dropData) return;

      // Don't mutate if dropped on the same group
      if (dragData.groupKey === dropData.groupKey) return;

      const item = itemsByKey.get(dragData.itemKey);
      if (!item) return;

      if (activeMutationConfig.sideEffect) {
        // Store pending drop and render side-effect UI
        setPendingDrop({
          item,
          targetValue: dropData.groupKey,
          targetLabel: dropData.groupLabel,
        });
      } else {
        // Execute mutation directly
        void activeMutationConfig.mutate(item, dropData.groupKey);
      }
    },
    [activeMutationConfig, itemsByKey],
  );

  const handleDragCancel = useCallback(() => {
    setActiveItemKey(null);
  }, []);

  const handleSideEffectConfirm = useCallback(() => {
    if (!pendingDrop || !activeMutationConfig) return;
    void activeMutationConfig.mutate(pendingDrop.item, pendingDrop.targetValue);
    setPendingDrop(null);
  }, [pendingDrop, activeMutationConfig]);

  const handleSideEffectCancel = useCallback(() => {
    setPendingDrop(null);
  }, []);

  /* ── List view content ── */

  const renderListView = () => {
    if (isEmpty && hasActiveFilters && config.emptyFilteredState) {
      return (
        <div className="flex items-center justify-center px-4 py-16">
          {config.emptyFilteredState}
        </div>
      );
    }

    if (isEmpty && config.emptyState) {
      return (
        <div className="flex items-center justify-center px-4 py-16">
          {config.emptyState}
        </div>
      );
    }

    // EVERY list view renders the semantic table: one `<table>` + shared
    // `<colgroup>` so the column header and every row inherit identical widths,
    // with native resize/reorder + horizontal scroll. Grouping (one server
    // level) and dnd are handled inside. Pages without a `propertiesGridTemplate`
    // get sensible default column widths (the title still fills; data columns
    // stay compact and pack right).
    const renderTable = (
      onRowNavigate?: (item: T, event: React.MouseEvent) => void,
    ) => (
      <TableTable<T, G, S>
        config={config}
        table={table}
        colWidths={colWidths}
        minWidthPx={minWidthPx}
        sizingById={sizingById}
        containerWidth={containerWidth}
        isGrouped={isGrouped && groupedSections.length > 0}
        groupedSections={groupedSections}
        expandedGroups={state.expandedGroups}
        onToggleGroup={view.toggleGroup}
        dndEnabled={dndEnabled}
        columnSizing={state.columnSizing}
        onColumnSizing={view.setColumnSizing}
        columnOrder={state.columnOrder}
        onColumnOrder={view.setColumnOrder}
        onMeasureWidths={setMeasuredWidths}
        selection={bulkSelect ? selection : undefined}
        onRowNavigate={onRowNavigate}
      />
    );

    // `rowHref` navigates only when the page gave no `onRowClick` (which wins).
    // The router lives in its own component so lists without `rowHref` never
    // touch it.
    const rowHref = config.rowHref;
    if (rowHref && !config.onRowClick) {
      return (
        <RowHrefNavigation<T> rowHref={rowHref}>
          {renderTable}
        </RowHrefNavigation>
      );
    }
    return renderTable();
  };

  /* ── View content switcher ── */

  const renderViewContent = () => {
    switch (state.displayMode) {
      case "list":
        return renderListView();
      case "timeline": {
        const activeDateRange =
          config.dateRanges?.find((dr) => dr.id === state.timelineDateField) ??
          config.dateRanges?.[0];

        if (!activeDateRange) {
          return renderListView();
        }

        return (
          <TimelineView
            items={config.items}
            sections={
              isGrouped && groupedSections.length > 0 ? groupedSections : null
            }
            groupTitle={config.groupTitle}
            dateRange={{
              start: activeDateRange.start,
              end: activeDateRange.end,
            }}
            rowKey={config.rowKey}
            title={config.title}
            avatar={config.avatar}
            onRowClick={config.onRowClick}
            emptyState={
              isEmpty && hasActiveFilters
                ? config.emptyFilteredState
                : isEmpty
                  ? config.emptyState
                  : undefined
            }
          />
        );
      }
      case "kanban":
        return (
          <KanbanView
            sections={groupedSections}
            groupTitle={config.groupTitle}
            rowKey={config.rowKey}
            avatar={config.avatar}
            title={config.title}
            subtitle={config.subtitle}
            onRowClick={config.onRowClick}
            visibleColumns={config.columns
              .filter((col) => visibleColumnSet.has(col.id))
              .map((col) => ({ id: col.id, render: col.render }))}
            emptyState={
              isEmpty && hasActiveFilters
                ? config.emptyFilteredState
                : isEmpty
                  ? config.emptyState
                  : undefined
            }
            dndEnabled={dndEnabled}
          />
        );
      default:
        return renderListView();
    }
  };

  /* ── Drag overlay content ── */

  const renderDragOverlay = () => {
    if (!activeItem) return null;

    return (
      <div className="w-72 rounded-lg border bg-card p-3 shadow-lg opacity-90">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center">
            {config.avatar(activeItem)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">
              {config.title(activeItem)}
            </div>
            {config.subtitle && (
              <div className="truncate text-xs text-muted-foreground">
                {config.subtitle(activeItem)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ── Pagination info ── */

  // A page-supplied page-size set (`config.pagination`): a size outside it —
  // e.g. the view system's untouched default — moves to the page's default
  // once, on mount. A size the viewer picked from the options is kept.
  const paginationOptions = config.pagination;
  useEffect(() => {
    if (
      paginationOptions &&
      !paginationOptions.pageSizeOptions.includes(state.pageSize)
    ) {
      view.setPageSize(paginationOptions.defaultPageSize);
    }
    // Mount-only: re-running would fight a size the page never offered but the
    // viewer cannot choose anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.max(1, Math.ceil(config.totalCount / state.pageSize));
  const hasNextPage = config.pageInfo?.hasNextPage ?? state.page < totalPages;
  const hasPreviousPage = config.pageInfo?.hasPreviousPage ?? state.page > 1;

  /* ── View content (with or without DnD wrapper) ── */

  const viewContent = renderViewContent();

  const wrappedViewContent = dndEnabled ? (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {viewContent}
      <DragOverlay dropAnimation={null}>{renderDragOverlay()}</DragOverlay>
    </DndContext>
  ) : (
    viewContent
  );

  // List mode always renders the semantic table (which owns its own responsive
  // hiding); timeline/kanban keep the `DataRowContainer` responsive wrapper.
  const usesTable = state.displayMode === "list";

  return (
    <>
      {/* ── Bulk action bar ── (only while rows are selected) */}
      {bulkSelect && config.bulkActions && (
        <TableBulkActionBar
          selectedIds={selection.selectedIds}
          actions={config.bulkActions}
          onClear={selection.clear}
        />
      )}

      {/* ── View content ── */}
      {/* `overflow-x-auto` shares one scroll context with `overflow-y-auto`, so
          the table's sticky column header (`sticky top-0`) and its rows scroll
          horizontally together and stay column-aligned. The table carries the
          `min-width` (see TableTable) that triggers this scroll instead of
          squishing tracks when the body narrows. */}
      {/* `scrollbar-gutter: stable` reserves the classic-scrollbar gutter up
          front so a vertical scrollbar appearing/disappearing cannot change the
          container's content width — that ±10px flip fed the ResizeObserver →
          column-width solver loop and made column widths visibly vibrate on
          systems with layout-consuming scrollbars. */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-auto [scrollbar-gutter:stable]"
      >
        {usesTable ? (
          wrappedViewContent
        ) : (
          <DataRowContainer>{wrappedViewContent}</DataRowContainer>
        )}
      </div>

      {/* ── Pagination ── (hidden under server grouping: each group paginates itself) */}
      {!config.hidePagination && config.totalCount > 0 && (
        <PaginationControls
          page={state.page}
          pageSize={state.pageSize}
          totalCount={config.totalCount}
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
          onPageChange={view.setPage}
          onPageSizeChange={view.setPageSize}
          pageSizeOptions={paginationOptions?.pageSizeOptions}
        />
      )}

      {/* ── Side-effect UI for pending drag-and-drop ── */}
      {pendingDrop &&
        activeMutationConfig?.sideEffect &&
        activeMutationConfig.sideEffect.render({
          item: pendingDrop.item,
          targetValue: pendingDrop.targetValue,
          targetLabel: pendingDrop.targetLabel,
          onConfirm: handleSideEffectConfirm,
          onCancel: handleSideEffectCancel,
        })}
    </>
  );
}
