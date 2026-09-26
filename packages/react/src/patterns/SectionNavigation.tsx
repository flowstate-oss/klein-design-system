"use client";

/**
 * SectionNavigation — flat 12px tab strip with mono uppercase labels.
 *
 * Visual recipe (per `docs/specs/ai-terminal-design-language.md`):
 *   - Each tab is `h-7`, padding `px-2`, mono uppercase 11px label.
 *   - Active tab gets a 1px `var(--accent-ai)` underline + foreground text;
 *     inactive tabs are muted-foreground with `hover:text-foreground`.
 *   - Optional badge/count after the label, rendered as `.tabular-nums`.
 *
 * Built as a thin wrapper around plain anchor or button elements so the
 * caller controls navigation semantics (Next router push, controlled tab
 * panel switch, etc).
 */

import { type ComponentType, type AnchorHTMLAttributes } from "react";
import { usePatternLink } from "./routing.js";
import { cn } from "../compat/utils.js";

export interface AiTabItem {
  /** Stable id — used for the React key and `data-testid`. */
  id: string;
  /** Display label. */
  label: string;
  /** Optional numeric badge (e.g. count of pending items). */
  badge?: number | string | null;
  /** When provided, renders as an `<a>` via next/link. */
  href?: string;
  /** When provided AND no `href`, renders as `<button>` with onClick. */
  onClick?: () => void;
  /** Whether this tab is currently selected. */
  active?: boolean;
}

export interface SectionNavigationProps {
  /** Tabs in display order. */
  items: readonly AiTabItem[];
  /** Optional right-aligned slot — e.g. a 7d/30d/90d toggle or filter chip. */
  trailing?: React.ReactNode;
  /** ARIA label for the tablist. */
  ariaLabel: string;
  /** Extra class names. */
  className?: string;
}

/**
 * Renders the tab bar. Sits on a 1px bottom border so the active underline
 * reads as a "popped up" tab rather than a floating accent line.
 */
export function SectionNavigation({
  items,
  trailing,
  ariaLabel,
  className,
}: SectionNavigationProps): React.JSX.Element {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      data-testid="ai-tab-bar"
      className={cn(
        "flex items-center justify-between border-b border-border",
        className,
      )}
    >
      <div className="flex items-stretch">
        {items.map((item) => (
          <AiTab key={item.id} item={item} />
        ))}
      </div>
      {trailing !== undefined ? (
        <div className="flex items-center gap-1 pr-1">{trailing}</div>
      ) : null}
    </div>
  );
}

/**
 * Single tab. Renders as `<a>` (with `Link`) when `href` is set; otherwise
 * as a `<button>` when `onClick` is set; otherwise as a plain `<span>` so
 * the tab can act as a decorative current-location indicator.
 */
function AiTab({ item }: { item: AiTabItem }): React.JSX.Element {
  const Link = usePatternLink();
  const isActive = item.active === true;
  const className = cn(
    "ai-tab inline-flex h-7 items-center gap-1.5 px-2 text-[11px]",
    isActive
      ? "text-foreground"
      : "text-muted-foreground hover:text-foreground",
  );
  const content = (
    <>
      <span>{item.label}</span>
      {item.badge !== null && item.badge !== undefined && item.badge !== "" ? (
        <span
          data-testid={`ai-tab-badge-${item.id}`}
          className="tabular-nums text-[10px] text-muted-foreground/80"
          style={{ fontFamily: "var(--font-ai-mono)" }}
        >
          {item.badge}
        </span>
      ) : null}
    </>
  );

  if (item.href !== undefined) {
    return (
      <Link
        href={item.href}
        role="tab"
        aria-selected={isActive}
        data-testid={`ai-tab-${item.id}`}
        data-active={isActive ? "true" : "false"}
        className={className}
      >
        {content}
      </Link>
    );
  }
  if (item.onClick !== undefined) {
    return (
      <button
        type="button"
        role="tab"
        aria-selected={isActive}
        data-testid={`ai-tab-${item.id}`}
        data-active={isActive ? "true" : "false"}
        onClick={item.onClick}
        className={className}
      >
        {content}
      </button>
    );
  }
  return (
    <span
      role="tab"
      aria-selected={isActive}
      data-testid={`ai-tab-${item.id}`}
      data-active={isActive ? "true" : "false"}
      className={className}
    >
      {content}
    </span>
  );
}
