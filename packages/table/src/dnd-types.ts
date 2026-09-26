/**
 * Data shapes attached to @dnd-kit draggable and droppable elements
 * within the Table drag-and-drop system.
 */

/** Data attached to draggable items (rows in list view, cards in kanban view). */
export interface DragItemData {
  /** Unique key of the item being dragged */
  itemKey: string;
  /** Group key the item currently belongs to */
  groupKey: string;
}

/** Data attached to droppable groups (group headers in list view, columns in kanban view). */
export interface DropGroupData {
  /** Group key identifying the drop target */
  groupKey: string;
  /** Human-readable label for the target group */
  groupLabel: string;
}
