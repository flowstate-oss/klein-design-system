"use client";

/**
 * SectionDivider — 1px hairline with a tiny uppercase mono eyebrow above.
 *
 * Visual recipe (Bloomberg / Datadog style):
 *
 *   COST · 30D                                           ──── optional meta
 *   ─────────────────────────────────────────────────────────────────
 *
 * The label is rendered as a `<span>` so the divider can sit inside flex
 * stacks without the eyebrow consuming a row of its own.
 *
 * Per `docs/specs/ai-terminal-design-language.md`, dividers are the primary
 * way to break up the dense AI surfaces — no Card chrome, no shadows, no
 * extra padding. Each occurrence costs ~16px of vertical rhythm.
 */

import { cn } from "../compat/utils.js";

export interface SectionDividerProps {
  /**
   * Eyebrow label. Rendered uppercase + 10px mono. Optional — when omitted
   * we still render the 1px hairline (useful for divider-only separators).
   */
  label?: string | null;
  /**
   * Optional trailing meta — e.g. "30D" or "USD". Rendered next to the label
   * with a centre dot separator: `COST · 30D`.
   */
  meta?: string | null;
  /** Optional right-aligned slot — e.g. a 7d/30d/90d toggle. */
  trailing?: React.ReactNode;
  /** Extra class names — escape hatch for layout. */
  className?: string;
}

/**
 * Renders the divider. Outputs a `<div role="separator">` so screen readers
 * still announce the boundary even when no visible label is set.
 */
export function SectionDivider({
  label = null,
  meta = null,
  trailing,
  className,
}: SectionDividerProps): React.JSX.Element {
  const hasHeader =
    (label !== null && label !== "") ||
    (meta !== null && meta !== "") ||
    trailing !== undefined;

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      data-testid="ai-section-divider"
      className={cn("flex flex-col gap-1", className)}
    >
      {hasHeader ? (
        <div className="flex items-end justify-between gap-3">
          {label !== null && label !== "" ? (
            <span
              data-testid="ai-section-divider-label"
              className="ai-section-divider-label inline-flex items-baseline gap-1.5"
            >
              {label}
              {meta !== null && meta !== "" ? (
                <span
                  aria-hidden
                  className="text-[10px] text-muted-foreground/70"
                >
                  · {meta}
                </span>
              ) : null}
            </span>
          ) : null}
          {trailing !== undefined ? (
            <div
              data-testid="ai-section-divider-trailing"
              className="-mb-0.5 flex items-center gap-1 text-[10px] text-muted-foreground"
            >
              {trailing}
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="h-px w-full bg-border" aria-hidden />
    </div>
  );
}
