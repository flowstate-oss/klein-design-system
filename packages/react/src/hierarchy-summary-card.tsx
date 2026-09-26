"use client";
import type { ReactNode, Ref, HTMLAttributes } from "react";
import { Badge } from "./controls.js";
import { Icon } from "./button.js";
export interface HierarchySummaryCardProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  | "className"
  | "style"
  | "children"
  | "title"
  | "onSelect"
  | "dangerouslySetInnerHTML"
> {
  /** Display name and optional classification. */
  title: string;
  badge?: string;
  /** Prepared summary figures in application order. */
  metrics: readonly string[];
  /** Optional semantic markers, outside the expansion button. */
  indicators?: ReactNode;
  onSelect: () => void;
  /** Controlled expansion of related records. */
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  expandLabel: string;
  /** Optional independent branch visibility control. */
  branch?: {
    label: string;
    actionLabel: string;
    expanded: boolean;
    onExpandedChange: (expanded: boolean) => void;
  };
  ref?: Ref<HTMLDivElement>;
}
/** Hierarchy summary with independent actions for details, related records and descendant visibility. */
export function HierarchySummaryCard({
  title,
  badge,
  metrics,
  indicators,
  onSelect,
  expanded,
  onExpandedChange,
  expandLabel,
  branch,
  ref,
  ...native
}: HierarchySummaryCardProps) {
  return (
    <div
      {...native}
      ref={ref}
      className="k-hierarchy-summary"
      data-expanded={expanded || undefined}
    >
      <div className="k-hierarchy-summary-heading">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelect();
          }}
        >
          {title}
        </button>
        {badge && <Badge>{badge}</Badge>}
      </div>
      <div className="k-hierarchy-summary-metrics">
        <button
          type="button"
          aria-label={expandLabel}
          aria-expanded={expanded}
          onClick={() => onExpandedChange(!expanded)}
        >
          {metrics.map((metric, index) => (
            <span key={index}>{metric}</span>
          ))}
        </button>
        {indicators}
      </div>
      {branch && (
        <div className="k-hierarchy-summary-branch">
          <button
            type="button"
            aria-label={branch.actionLabel}
            aria-expanded={branch.expanded}
            onClick={() => branch.onExpandedChange(!branch.expanded)}
          >
            <Icon name={branch.expanded ? "chevron-down" : "chevron-right"} />
            <span>{branch.label}</span>
          </button>
        </div>
      )}
    </div>
  );
}
