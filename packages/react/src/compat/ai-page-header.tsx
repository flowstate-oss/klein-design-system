"use client";

/**
 * AiPageHeader — slim breadcrumb-style header for AI Terminal pages.
 *
 * Visual recipe:
 *
 *   AI ▸ INSIGHTS ▸ SPEND                              AS OF 18 MAY 14:32 UTC
 *   Page title (Geist Sans)                            [optional actions]
 *
 * The "As of" timestamp is the signature of the desktop-app feel — it tells
 * the viewer "this is live data" without a noisy status pill. We render it
 * in mono, uppercase, 10px to mirror the section divider rhythm.
 *
 * Per the design language, this header is the only place a page-level
 * `<h1>` lives. Sub-sections use `AiSectionDivider`.
 */

import { cn } from "./utils.js";

export interface AiPageHeaderCrumb {
  /** Display label (rendered uppercase). */
  label: string;
  /** Optional href — turns the crumb into a navigational link. */
  href?: string;
}

export interface AiPageHeaderProps {
  /**
   * Breadcrumb chain, rendered from left to right separated by `▸`. The
   * final crumb is rendered as plain text (current location). Pass at least
   * one crumb — even single-section pages benefit from the orientation.
   */
  crumbs: readonly AiPageHeaderCrumb[];
  /** Page title — rendered in Geist Sans, 16px, semibold. */
  title: string;
  /** Optional one-line description below the title. */
  description?: string | null;
  /**
   * Optional "as of" timestamp string. Already formatted by the caller (use
   * `useFormatters()` to honour the viewer's locale). Rendered right-aligned
   * in mono uppercase.
   */
  asOf?: string | null;
  /** Optional right-aligned action slot (buttons, range pickers, etc). */
  actions?: React.ReactNode;
  /** Extra class names — escape hatch for layout. */
  className?: string;
}

/**
 * Renders the header. Two rows max: crumb row + title/actions row.
 */
export function AiPageHeader({
  crumbs,
  title,
  description = null,
  asOf = null,
  actions,
  className,
}: AiPageHeaderProps): React.JSX.Element {
  return (
    <header
      data-testid="ai-page-header"
      className={cn("flex flex-col gap-1", className)}
    >
      <div className="flex items-center justify-between gap-3">
        <nav
          aria-label="Breadcrumb"
          data-testid="ai-page-header-crumbs"
          className="flex min-w-0 items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground"
          style={{ fontFamily: "var(--font-ai-mono)" }}
        >
          {crumbs.map((crumb, idx) => {
            const isLast = idx === crumbs.length - 1;
            const content =
              crumb.href !== undefined && !isLast ? (
                <a href={crumb.href} className="truncate hover:text-foreground">
                  {crumb.label}
                </a>
              ) : (
                <span
                  className={cn(
                    "truncate",
                    isLast ? "text-foreground" : undefined,
                  )}
                >
                  {crumb.label}
                </span>
              );
            return (
              <span
                key={`${crumb.label}-${idx}`}
                className="flex items-center gap-1.5"
              >
                {content}
                {!isLast ? (
                  <span aria-hidden className="text-muted-foreground/50">
                    ▸
                  </span>
                ) : null}
              </span>
            );
          })}
        </nav>
        {asOf !== null && asOf !== "" ? (
          <span
            data-testid="ai-page-header-asof"
            className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground"
            style={{ fontFamily: "var(--font-ai-mono)" }}
          >
            {asOf}
          </span>
        ) : null}
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h1
            data-testid="ai-page-header-title"
            className="text-base font-semibold leading-tight text-foreground"
            style={{ fontFamily: "var(--font-ai-display)" }}
          >
            {title}
          </h1>
          {description !== null && description !== "" ? (
            <p
              data-testid="ai-page-header-description"
              className="text-xs text-muted-foreground"
            >
              {description}
            </p>
          ) : null}
        </div>
        {actions !== undefined ? (
          <div
            data-testid="ai-page-header-actions"
            className="flex shrink-0 items-center gap-1"
          >
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
