"use client";

/**
 * Shared shell for a full entity detail page (Initiative / Project). Two reusable
 * pieces so the page can keep a PERSISTENT header above switchable FloatingTabs:
 *
 *   <EntityDetailHeader>       — back · [icon] TYPE kicker · Title · [status ·
 *                                latest update] on the left; header stat cells on
 *                                the right (owner moved down, circular Progress).
 *   <EntityDetailOverviewGrid> — the Overview body: Properties → Capitalise →
 *                                Description on the left; a related-delivery panel
 *                                on the right.
 *
 * Presentational only — each page owns its data + mutations and passes nodes in.
 * This is what makes the initiative + project pages read identically; only the
 * `[icon] Type` kicker (and the panels) change. Flat, no cards (CLAUDE.md §2).
 */

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "./utils.js";

export interface EntityDetailHeaderProps {
  backLink: ReactNode;
  /** The `[icon] Type` kicker eyebrow above the title. */
  kicker: { icon: LucideIcon; label: string };
  /** Large inline-editable title node. */
  title: ReactNode;
  /** Status control (e.g. a status pill picker). */
  status?: ReactNode;
  /** Latest status update — a short pill/text beside the status. */
  latestUpdate?: ReactNode;
  /** Right-of-header stat cells (compose with `HeaderStatCell`). */
  headerStats?: ReactNode;
  "data-testid"?: string;
}

export function EntityDetailHeader({
  backLink,
  kicker,
  title,
  status,
  latestUpdate,
  headerStats,
  "data-testid": dataTestId,
}: EntityDetailHeaderProps): React.JSX.Element {
  const KickerIcon = kicker.icon;

  return (
    <header className="border-b px-6 py-4" data-testid={dataTestId}>
      {backLink}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        {/* LEFT — kicker · title · status row */}
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.05em] uppercase">
            <KickerIcon className="h-3.5 w-3.5" aria-hidden />
            {kicker.label}
          </span>
          {title}
          {(status != null || latestUpdate != null) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              {status}
              {latestUpdate}
            </div>
          )}
        </div>

        {/* RIGHT — header stat cells */}
        {headerStats != null && (
          <div className="flex flex-wrap gap-x-6 gap-y-4 lg:justify-end">
            {headerStats}
          </div>
        )}
      </div>
    </header>
  );
}

export interface EntityDetailOverviewGridProps {
  /** Body LEFT, first — the editable properties block. */
  properties: ReactNode;
  /** Body LEFT, second — the capitalise / R&D surface (omit when N/A). */
  capitalise?: ReactNode;
  /** Body LEFT, last — the description. */
  description: ReactNode;
  /** Body RIGHT — the related delivery table (child projects / PMS projects). */
  rightPanel: ReactNode;
  /** Optional title + action above the right panel. */
  rightPanelTitle?: ReactNode;
  rightPanelAction?: ReactNode;
}

export function EntityDetailOverviewGrid({
  properties,
  capitalise,
  description,
  rightPanel,
  rightPanelTitle,
  rightPanelAction,
}: EntityDetailOverviewGridProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-x-10 gap-y-8 px-6 py-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-8">
        <section>{properties}</section>
        {capitalise != null && <section>{capitalise}</section>}
        <section>{description}</section>
      </div>

      <div className="flex min-w-0 flex-col">
        {(rightPanelTitle != null || rightPanelAction != null) && (
          <div className="mb-2 flex items-center justify-between">
            {rightPanelTitle != null ? (
              <h3 className="text-foreground text-sm font-semibold tracking-[-0.01em]">
                {rightPanelTitle}
              </h3>
            ) : (
              <span />
            )}
            {rightPanelAction}
          </div>
        )}
        {rightPanel}
      </div>
    </div>
  );
}

/**
 * One consistently-sized body property cell (uppercase label over value) — the
 * building block of an Overview tab's properties band. Shared by the Initiative
 * finance properties and the Objective dates so the bands read identically.
 */
export function PropCell({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex min-w-[10rem] flex-col gap-1">
      <span className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
        {label}
      </span>
      <div className="flex min-h-[1.75rem] items-center">{children}</div>
    </div>
  );
}

/** One consistently-sized header stat cell (label over value). */
export function HeaderStatCell({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <div className={cn("flex w-36 flex-col gap-1", className)}>
      <span className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
        {label}
      </span>
      <div className="flex min-h-[1.5rem] items-center">{children}</div>
    </div>
  );
}
