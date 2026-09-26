import { cn } from "@klein-ui/react/compat/utils";
type PlanChangeStatus = "ADDED" | "MODIFIED" | "DELETED";

/**
 * Base classes for all entity rows.
 * Uses CSS variable for consistent padding across all row types.
 */
export const ROW_BASE_CLASSES = cn(
  "flex cursor-pointer items-center gap-3 border-b px-4",
  "transition-colors hover:bg-muted/50",
  "py-[var(--row-height-padding)]",
  "min-h-[var(--row-min-height)]",
);

/**
 * Grid variant of `ROW_BASE_CLASSES`. Used when the row root owns a
 * `grid-template-columns` (set via `<DataRow gridTemplateColumns="…">`),
 * which is how data-dense views like AI Sessions get property cells to
 * line up vertically across every row. Track sizing is inline on the
 * element; this constant only carries the layout/padding chrome.
 */
export const ROW_GRID_BASE_CLASSES = cn(
  "grid cursor-pointer items-center gap-x-3 border-b px-4",
  "transition-colors hover:bg-muted/50",
  "py-[var(--row-height-padding)]",
  "min-h-[var(--row-min-height)]",
);

/**
 * Row (`<tr>`) chrome for the semantic-table Table: hover, transition,
 * clickability, and the plan-change tint. Hairlines and vertical padding live on
 * the cells ({@link TABLE_CELL_CLASSES}) because, under `border-collapse:
 * separate`, borders belong to cells rather than rows.
 *
 * @param changeStatus - Direct plan change status (ADDED, MODIFIED, DELETED).
 * @param interactive - Whether the row is clickable (has onRowClick/DoubleClick).
 */
export function getTableRowClasses(
  changeStatus: PlanChangeStatus | null | undefined,
  interactive: boolean,
): string {
  return cn(
    "transition-colors hover:bg-muted/50",
    interactive && "cursor-pointer",
    getChangeStatusRowClass(changeStatus),
  );
}

/**
 * Base `<td>` chrome for the semantic-table Table: the per-cell bottom
 * hairline (the row divider), the `--row-height-padding` vertical rhythm, and
 * vertical centring. Horizontal padding (page gutters + inter-column gap) is
 * applied per-cell by the table renderer.
 */
export const TABLE_CELL_CLASSES = cn(
  "border-b align-middle py-[var(--row-height-padding)]",
);

/**
 * Returns background class based on plan change status.
 * - ADDED: emerald/green background
 * - MODIFIED: blue background
 * - DELETED: red background with reduced opacity
 */
export function getChangeStatusRowClass(
  status: PlanChangeStatus | null | undefined,
): string {
  if (!status) return "";
  const classes: Record<PlanChangeStatus, string> = {
    ADDED: "bg-emerald-50/50 dark:bg-emerald-950/20",
    MODIFIED: "bg-blue-50/50 dark:bg-blue-950/20",
    DELETED: "bg-red-50/50 dark:bg-red-950/20 opacity-60",
  };
  return classes[status] ?? "";
}

/**
 * Returns classes for a row with related plan changes but no direct change.
 * Shows a purple left border to indicate the entity has related modifications.
 */
export function getRelatedChangesRowClass(
  hasRelatedChanges: boolean | undefined,
): string {
  if (!hasRelatedChanges) return "";
  return "border-l-2 border-l-scenario";
}

/**
 * Combines all row classes into a single className string.
 *
 * @param changeStatus - Direct plan change status (ADDED, MODIFIED, DELETED)
 * @param hasRelatedChanges - Whether the entity has related plan changes
 * @param className - Additional custom classes
 * @param options.layout - 'flex' (default) for the standard flex row, or
 *   'grid' when the row root carries its own `grid-template-columns`.
 * @returns Combined className string
 */
export function getRowClasses(
  changeStatus: PlanChangeStatus | null | undefined,
  hasRelatedChanges: boolean | undefined,
  className?: string,
  options?: { layout?: "flex" | "grid" },
): string {
  const base =
    options?.layout === "grid" ? ROW_GRID_BASE_CLASSES : ROW_BASE_CLASSES;
  return cn(
    base,
    getChangeStatusRowClass(changeStatus),
    // Only show related changes indicator if there's no direct change status
    !changeStatus && getRelatedChangesRowClass(hasRelatedChanges),
    className,
  );
}
