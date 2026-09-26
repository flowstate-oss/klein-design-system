"use client";

/**
 * AiPageShell — outer frame for AI Terminal pages.
 *
 * Owns spacing + the dense desktop-app rhythm so pages stay declarative.
 * Pages compose:
 *
 *   <AiPageShell
 *     header={<AiPageHeader … />}
 *     kpis={<AiKpiRow tiles={…} />}
 *   >
 *     {…body…}
 *   </AiPageShell>
 *
 * Slots are independent so a page can opt out of either band (a settings
 * page typically has no KPI row; a sub-tab page typically has no header
 * because its parent owns the breadcrumb).
 *
 * Per the design language, container padding is 16px (px) / 12px (py) and
 * vertical gaps between bands are 16px max — see
 * `docs/specs/ai-terminal-design-language.md`.
 */

import { cn } from "./utils.js";

export interface AiPageShellProps {
  /**
   * Page header (typically an `AiPageHeader`). Optional — sub-tab pages
   * usually rely on the parent layout's header instead.
   */
  header?: React.ReactNode;
  /**
   * KPI row (typically an `AiKpiRow`). Optional — pages without numeric
   * headlines (settings, audit logs) omit this band entirely.
   */
  kpis?: React.ReactNode;
  /**
   * Optional tab bar (typically an `AiTabBar`). Rendered immediately under
   * the KPI band and pinned above the body so scroll keeps the tabs in view
   * naturally.
   */
  tabs?: React.ReactNode;
  /** Main body — pages stack content with `AiSectionDivider` as needed. */
  children: React.ReactNode;
  /** Extra class names. */
  className?: string;
}

/**
 * Renders the shell. Single scrollable surface inside a fixed-height
 * authenticated layout — never sets its own height, only `min-h-0` to allow
 * the body to scroll inside the parent flex container.
 */
export function AiPageShell({
  header,
  kpis,
  tabs,
  children,
  className,
}: AiPageShellProps): React.JSX.Element {
  return (
    <div
      data-testid="ai-page-shell"
      className={cn(
        "flex h-full min-h-0 flex-col gap-4 overflow-auto px-4 py-3",
        className,
      )}
    >
      {header !== undefined ? <div>{header}</div> : null}
      {kpis !== undefined ? <div>{kpis}</div> : null}
      {tabs !== undefined ? <div>{tabs}</div> : null}
      <div
        data-testid="ai-page-shell-body"
        className="flex min-h-0 flex-1 flex-col gap-4"
      >
        {children}
      </div>
    </div>
  );
}
