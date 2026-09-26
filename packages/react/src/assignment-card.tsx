"use client";
import type {
  ReactNode,
  Ref,
  ButtonHTMLAttributes,
  HTMLAttributes,
} from "react";
import { GripVertical } from "lucide-react";
export interface AssignmentCardEntry {
  /** Stable identity for selection and context menus. */
  id: string;
  /** Localized name and optional kind, already permission-filtered. */
  label: string;
  kind?: string;
  /** Prepared date range or explanatory metadata. */
  description?: string;
  /** Formatted allocation or quantity. */
  value?: string;
}
export interface AssignmentCardProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  | "className"
  | "style"
  | "children"
  | "onSelect"
  | "title"
  | "dangerouslySetInnerHTML"
> {
  /** Position or responsibility name. */
  title: string;
  /** Formatted capacity, without domain calculations. */
  value: string;
  /** Optional expiry or metadata. */
  description?: string;
  /** Visible assignments in application order. */
  entries: readonly AssignmentCardEntry[];
  /** Explanation when no assignments are present. */
  emptyLabel: string;
  /** Accessible action label for the card heading. */
  selectLabel: string;
  onSelect: () => void;
  /** Omit to make the entire summary one action; supply for independently selectable assignments. */
  onEntrySelect?: (id: string) => void;
  /** Compact cards sit beneath wider parent nodes. */
  size?: "regular" | "compact";
  /** Optional domain context-menu adapter around an entry's trigger. */
  renderEntryMenu?: (id: string, trigger: ReactNode) => ReactNode;
  /** Drag bindings supplied by an application drag controller. */
  dragHandle?: Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "className" | "style" | "children" | "aria-label"
  > & { label: string };
  /** Controlled drag/drop presentation states. */
  dragging?: boolean;
  dropTarget?: boolean;
  ref?: Ref<HTMLDivElement>;
  testIds?: { root?: string; open?: string; dragHandle?: string };
}
/** A responsibility with capacity and the people or resources assigned to it. */
export function AssignmentCard({
  title,
  value,
  description,
  entries,
  emptyLabel,
  selectLabel,
  onSelect,
  onEntrySelect,
  renderEntryMenu,
  dragHandle,
  dragging = false,
  dropTarget = false,
  ref,
  testIds,
  size = "regular",
  ...native
}: AssignmentCardProps) {
  const { label: dragLabel, ...dragBindings } = dragHandle ?? { label: "" };
  if (!onEntrySelect)
    return (
      <div
        {...native}
        ref={ref}
        className="k-assignment-card"
        data-size={size}
        data-testid={testIds?.root}
      >
        <button
          type="button"
          className="k-assignment-select"
          onClick={onSelect}
          aria-label={selectLabel}
          data-testid={testIds?.open}
        >
          <span className="k-assignment-heading">
            <span className="k-assignment-name">{title}</span>
            <span className="k-assignment-value">{value}</span>
          </span>
          {description && (
            <span className="k-assignment-description">{description}</span>
          )}
          {entries.length ? (
            <span className="k-assignment-entries">
              {entries.map((entry) => (
                <span key={entry.id}>
                  <span className="k-assignment-name">{entry.label}</span>
                  {entry.description && (
                    <span className="k-assignment-description">
                      {entry.description}
                    </span>
                  )}
                  {entry.value && (
                    <span className="k-assignment-value">{entry.value}</span>
                  )}
                </span>
              ))}
            </span>
          ) : (
            <span className="k-assignment-empty">{emptyLabel}</span>
          )}
        </button>
      </div>
    );
  return (
    <div
      {...native}
      ref={ref}
      className="k-assignment-card"
      data-size={size}
      data-dragging={dragging || undefined}
      data-drop-target={dropTarget || undefined}
      data-testid={testIds?.root}
    >
      <div className="k-assignment-heading">
        {dragHandle && (
          <button
            {...dragBindings}
            type="button"
            aria-label={dragLabel}
            className="k-assignment-grip"
            data-testid={testIds?.dragHandle}
          >
            <GripVertical aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          onClick={onSelect}
          aria-label={selectLabel}
          className="k-assignment-select"
          data-testid={testIds?.open}
        >
          <span className="k-assignment-heading">
            <span className="k-assignment-name">{title}</span>
            <span className="k-assignment-value">{value}</span>
          </span>
          {description && (
            <span className="k-assignment-description">{description}</span>
          )}
        </button>
      </div>
      {!entries.length ? (
        <p className="k-assignment-empty">{emptyLabel}</p>
      ) : (
        <div className="k-assignment-entries">
          {entries.map((entry) => {
            const trigger = (
              <button
                type="button"
                onClick={() => onEntrySelect(entry.id)}
                aria-label={[entry.label, entry.kind, entry.description]
                  .filter(Boolean)
                  .join(" ")}
                className="k-assignment-select"
              >
                <span className="k-assignment-name">
                  {entry.label}
                  {entry.kind && (
                    <span className="k-assignment-kind"> · {entry.kind}</span>
                  )}
                </span>
                {entry.description && (
                  <span className="k-assignment-description">
                    {entry.description}
                  </span>
                )}
              </button>
            );
            return (
              <div className="k-assignment-entry" key={entry.id}>
                {renderEntryMenu ? renderEntryMenu(entry.id, trigger) : trigger}
                <span className="k-assignment-value">{entry.value}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
