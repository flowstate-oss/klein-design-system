"use client";

import type { ReactNode } from "react";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { cn } from "@klein-ui/react/compat/utils";
import { Badge } from "@klein-ui/react/compat/badge";
import type { DragItemData, DropGroupData } from "./dnd-types.js";

/* -------------------------------------------------------------------------- */
/*                              Types                                         */
/* -------------------------------------------------------------------------- */

/** A visible column rendered on each kanban card. */
interface KanbanCardColumn<T> {
  /** Column identifier */
  id: string;
  /** Render function for column content */
  render: (item: T) => ReactNode;
}

/** Props for the KanbanView renderer. */
interface KanbanViewProps<T> {
  /** Grouped sections — each becomes a column */
  sections: Array<{ key: string; label?: string; items: T[] }>;
  /** Group title lookup */
  groupTitle?: (key: string) => string;
  /** Render functions from TableConfig */
  rowKey: (item: T) => string;
  /** Render the avatar/icon slot for a card */
  avatar: (item: T) => ReactNode;
  /** Render the title slot for a card */
  title: (item: T) => ReactNode;
  /** Render the optional subtitle slot for a card */
  subtitle?: (item: T) => ReactNode;
  /** Handler when a card is clicked */
  onRowClick?: (item: T) => void;
  /** Visible columns to show on cards */
  visibleColumns: KanbanCardColumn<T>[];
  /** Empty state when there are no sections */
  emptyState?: ReactNode;
  /** Whether drag-and-drop is enabled for this view */
  dndEnabled?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                              KanbanCard                                    */
/* -------------------------------------------------------------------------- */

/**
 * A single kanban card displaying avatar, title, subtitle, and visible
 * property columns in a compact vertical layout. When DnD is enabled,
 * the card is wrapped in a draggable handle.
 */
function KanbanCard<T>({
  item,
  itemKey,
  groupKey,
  avatar,
  title,
  subtitle,
  onClick,
  visibleColumns,
  dndEnabled,
}: {
  item: T;
  itemKey: string;
  groupKey: string;
  avatar: (item: T) => ReactNode;
  title: (item: T) => ReactNode;
  subtitle?: (item: T) => ReactNode;
  onClick?: (item: T) => void;
  visibleColumns: KanbanCardColumn<T>[];
  dndEnabled?: boolean;
}) {
  const dragData: DragItemData = { itemKey, groupKey };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `kanban-card-${itemKey}`,
    data: dragData,
    disabled: !dndEnabled,
  });

  return (
    <div
      ref={setNodeRef}
      {...(dndEnabled ? { ...listeners, ...attributes } : {})}
      className={cn(
        "rounded-lg border bg-card p-3 shadow-sm",
        "transition-colors hover:bg-accent/50",
        onClick && "cursor-pointer",
        dndEnabled && "touch-none",
        isDragging && "opacity-30",
      )}
      onClick={onClick ? () => onClick(item) : undefined}
    >
      {/* Avatar + Title + Subtitle */}
      <div className="flex items-start gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center">
          {avatar(item)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium" data-sentry-mask>
            {title(item)}
          </div>
          {subtitle && (
            <div
              className="truncate text-xs text-muted-foreground"
              data-sentry-mask
            >
              {subtitle(item)}
            </div>
          )}
        </div>
      </div>

      {/* Visible property columns */}
      {visibleColumns.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {visibleColumns.map((col) => (
            <div key={col.id} className="shrink-0">
              {col.render(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              KanbanColumn                                  */
/* -------------------------------------------------------------------------- */

/**
 * A single kanban column with a sticky header displaying the group title
 * and item count, and a vertical stack of cards. Acts as a droppable zone
 * when DnD is enabled.
 */
function KanbanColumn<T>({
  columnKey,
  title,
  items,
  avatar,
  cardTitle,
  subtitle,
  onRowClick,
  rowKey,
  visibleColumns,
  dndEnabled,
}: {
  columnKey: string;
  title: string;
  items: T[];
  avatar: (item: T) => ReactNode;
  cardTitle: (item: T) => ReactNode;
  subtitle?: (item: T) => ReactNode;
  onRowClick?: (item: T) => void;
  rowKey: (item: T) => string;
  visibleColumns: KanbanCardColumn<T>[];
  dndEnabled?: boolean;
}) {
  const dropData: DropGroupData = { groupKey: columnKey, groupLabel: title };
  const { setNodeRef, isOver } = useDroppable({
    id: `kanban-column-${columnKey}`,
    data: dropData,
    disabled: !dndEnabled,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-w-[280px] max-w-[320px] shrink-0 flex-col",
        isOver && "rounded-lg ring-2 ring-primary/40",
      )}
    >
      {/* Column header */}
      <div className="sticky top-0 z-10 flex items-center gap-2 rounded-t-lg bg-muted/50 px-3 py-2">
        <span className="truncate text-xs font-medium text-foreground">
          {title}
        </span>
        <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0">
          {items.length}
        </Badge>
      </div>

      {/* Cards stack */}
      <div className="flex flex-1 flex-col gap-2 rounded-b-lg bg-muted/20 p-2">
        {items.map((item) => (
          <KanbanCard
            key={rowKey(item)}
            item={item}
            itemKey={rowKey(item)}
            groupKey={columnKey}
            avatar={avatar}
            title={cardTitle}
            subtitle={subtitle}
            onClick={onRowClick}
            visibleColumns={visibleColumns}
            dndEnabled={dndEnabled}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              KanbanView                                    */
/* -------------------------------------------------------------------------- */

/**
 * Renders items in a horizontal kanban board layout.
 *
 * Each section becomes a column. Cards display avatar, title, subtitle, and
 * visible property columns in a compact layout. When `dndEnabled` is true,
 * columns act as droppable zones and cards are draggable.
 *
 * @template T - The item type rendered in each card.
 */
export function KanbanView<T>({
  sections,
  groupTitle,
  rowKey,
  avatar,
  title,
  subtitle,
  onRowClick,
  visibleColumns,
  emptyState,
  dndEnabled,
}: KanbanViewProps<T>) {
  if (sections.length === 0 && emptyState) {
    return (
      <div className="flex items-center justify-center px-4 py-16">
        {emptyState}
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto px-4 py-4">
      {sections.map((section) => (
        <KanbanColumn
          key={section.key}
          columnKey={section.key}
          title={
            section.label ??
            (groupTitle ? groupTitle(section.key) : section.key)
          }
          items={section.items}
          avatar={avatar}
          cardTitle={title}
          subtitle={subtitle}
          onRowClick={onRowClick}
          rowKey={rowKey}
          visibleColumns={visibleColumns}
          dndEnabled={dndEnabled}
        />
      ))}
    </div>
  );
}
