"use client";

/**
 * FloatingTabs — three separate glass pills (left FAB · labelled tabs ·
 * right FAB) with ONE shared sliding indicator that flies BETWEEN them.
 *
 * Layout: three rounded-full pills (visually separate, 8px gap). A single
 * absolutely-positioned indicator lives at the outer wrapper level and
 * tracks whichever button matches the active value (or the hovered
 * preview). The indicator is allowed to travel over the gaps between
 * pills — that's the "bulging glass" effect.
 *
 * Z-stack at any button position:
 *   1. Pill glass background (semi-transparent)
 *   2. Sliding indicator (positions over the pill, also visible in the
 *      gaps while it's transiting)
 *   3. Button content (icon / label, foreground colour)
 *
 * Hover preview: hovering ANY button moves the indicator to that button.
 * The indicator returns to the active value when the cursor leaves.
 * Active selection is decided by clicking — the indicator settles there.
 *
 * No framer-motion; hand-rolled measurement of each button's geometry
 * against the OUTER wrapper, animated with a soft-overshoot bezier.
 */
import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "./utils.js";

export interface FloatingTabsTab {
  /** Stable id used as the tab's panel target (wired into `aria-controls`). */
  value: string;
  /** Visible label. Translated by the caller. */
  label: string;
  /** Optional leading icon (Lucide). */
  icon?: LucideIcon;
  /** Optional `data-tour-target` for anchoring a guided-tour spotlight on this tab. */
  tourTarget?: string;
}

export interface FloatingTabsFab {
  /** Stable id matched against `value` to determine active state. */
  value: string;
  /** Accessible label (no visible text on FABs). */
  ariaLabel: string;
  /** Inner content of the FAB button. Typically a Lucide icon (+ badge). */
  children: React.ReactNode;
}

export interface FloatingTabsProps {
  /** Currently active value. May match a tab or a FAB. */
  value: string;
  /** Invoked when the user picks a different tab or FAB. */
  onValueChange: (next: string) => void;
  /** The labelled tabs (rendered in the middle pill). May be empty. */
  tabs: FloatingTabsTab[];
  /** Optional FAB pill to the LEFT (typically Overview). */
  leadingFab?: FloatingTabsFab;
  /** Optional FAB pill to the RIGHT (typically Comments). */
  trailingFab?: FloatingTabsFab;
  /** Vertical anchor. Defaults to 'bottom'. */
  position?: "bottom" | "top";
  /**
   * CSS `position` strategy for the bar.
   *
   * - `'sticky'` (default) — the bar sticks within its scroll container. This
   *   is correct for entity drawers where the drawer itself scrolls.
   * - `'fixed'` — the bar is pinned to the viewport bottom-centre, always
   *   visible regardless of page scroll. Use this for full-page route layouts
   *   (e.g. BudgetRequestFloatingTabs) where the scroll container is the
   *   document root and `sticky` would not keep the bar on screen.
   *
   * Cannot be overridden via `className` because Tailwind's `sticky` and
   * `fixed` are both `position` utilities and would conflict — this prop is
   * the single source of truth.
   */
  pinned?: "sticky" | "fixed";
  /**
   * Vertical offset from the anchored edge. `'default'` is the standard
   * `bottom-4`/`top-4`; `'raised'` lifts the bar further off the edge
   * (`bottom-8`/`top-8`) so it reads as more prominent on tall full-page routes.
   * Like `position`/`pinned`, this owns the offset utility (it would conflict with
   * a `bottom-*` passed via `className`), so it is a prop rather than a class.
   */
  offset?: "default" | "raised";
  /** Optional accessible label for the tablist. */
  "aria-label"?: string;
  /** Extra classes merged onto the outer wrapper. */
  className?: string;
  /**
   * Inline-end (right) inset in pixels for the `pinned="fixed"` variant ONLY.
   *
   * The fixed bar is `inset-x-0` and centres itself across the whole viewport.
   * When a right-hand side panel (the entity-details drawer) opens it NARROWS
   * the main content area but NOT the viewport, so a viewport-centred fixed bar
   * would sit half-under the panel. Passing the open panel's width here pulls the
   * bar's right edge in by that much, so it re-centres over the remaining content
   * and never overlaps the panel. Ignored for `pinned="sticky"`. Defaults to `0`.
   */
  endInset?: number;
}

interface IndicatorGeometry {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function FloatingTabs({
  value,
  onValueChange,
  tabs,
  leadingFab,
  trailingFab,
  position = "bottom",
  pinned = "sticky",
  offset = "default",
  "aria-label": ariaLabel,
  className,
  endInset = 0,
}: FloatingTabsProps) {
  // The OUTER row that contains all three pills AND the floating indicator.
  // Indicator geometry is measured against this so it can travel between
  // pills across the gaps.
  const rowRef = React.useRef<HTMLDivElement | null>(null);
  const buttonRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = React.useState<IndicatorGeometry | null>(
    null,
  );
  const [hoveredValue, setHoveredValue] = React.useState<string | null>(null);
  const measuredOnce = React.useRef(false);
  const [pressTick, setPressTick] = React.useState(0);

  const orderedValues = React.useMemo(() => {
    const out: string[] = [];
    if (leadingFab) out.push(leadingFab.value);
    for (const tab of tabs) out.push(tab.value);
    if (trailingFab) out.push(trailingFab.value);
    return out;
  }, [leadingFab, tabs, trailingFab]);

  if (orderedValues.length <= 1) return null;

  // Where the indicator should sit. Hover wins if set; otherwise the active
  // value. Both can be ANY button (FAB or middle tab).
  const indicatorTargetValue = hoveredValue ?? value;

  React.useLayoutEffect(() => {
    const measure = () => {
      const target = buttonRefs.current[indicatorTargetValue];
      const row = rowRef.current;
      if (!target || !row) {
        setIndicator(null);
        return;
      }
      const rowRect = row.getBoundingClientRect();
      const btnRect = target.getBoundingClientRect();
      setIndicator({
        left: btnRect.left - rowRect.left,
        top: btnRect.top - rowRect.top,
        width: btnRect.width,
        height: btnRect.height,
      });
    };
    measure();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(measure);
      if (rowRef.current) observer.observe(rowRef.current);
      return () => observer.disconnect();
    }
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [indicatorTargetValue, orderedValues]);

  React.useEffect(() => {
    if (indicator && !measuredOnce.current) {
      const id = requestAnimationFrame(() => {
        measuredOnce.current = true;
      });
      return () => cancelAnimationFrame(id);
    }
  }, [indicator]);

  const focusValue = (index: number) => {
    if (orderedValues.length === 0) return;
    const next = (index + orderedValues.length) % orderedValues.length;
    const btn = buttonRefs.current[orderedValues[next]];
    if (btn) btn.focus();
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        focusValue(index + 1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        focusValue(index - 1);
        break;
      case "Home":
        event.preventDefault();
        focusValue(0);
        break;
      case "End":
        event.preventDefault();
        focusValue(orderedValues.length - 1);
        break;
      default:
        break;
    }
  };

  const handleSelect = (next: string) => {
    if (next === value) return;
    onValueChange(next);
    setPressTick((tick) => tick + 1);
  };

  const setButtonRef =
    (btnValue: string) => (node: HTMLButtonElement | null) => {
      buttonRefs.current[btnValue] = node;
    };

  const isHoverPreview = hoveredValue !== null && hoveredValue !== value;

  const renderFabPill = (fab: FloatingTabsFab, index: number) => {
    const isActive = fab.value === value;
    return (
      <div
        className={cn(
          "floating-tabs-pill pointer-events-auto inline-flex h-12 items-center rounded-full border p-1",
          "bg-floating-bar border-floating-bar-border shadow-floating-bar",
        )}
      >
        <button
          ref={setButtonRef(fab.value)}
          type="button"
          role="tab"
          id={`floating-tab-${fab.value}`}
          aria-label={fab.ariaLabel}
          aria-selected={isActive}
          aria-controls={fab.value}
          tabIndex={isActive ? 0 : -1}
          data-active={isActive ? "true" : undefined}
          data-value={fab.value}
          onClick={() => handleSelect(fab.value)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          onMouseEnter={() => setHoveredValue(fab.value)}
          onFocus={() => setHoveredValue(fab.value)}
          onBlur={() => setHoveredValue(null)}
          className={cn(
            "floating-tabs-button relative z-20 inline-flex h-10 w-10 items-center justify-center rounded-full",
            "focus-visible:outline-none transition-colors duration-200",
            isActive
              ? "text-brand-blue"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {fab.children}
        </button>
      </div>
    );
  };

  return (
    <div
      data-floating-tabs=""
      data-position={position}
      data-pinned={pinned}
      className={cn(
        "pointer-events-none z-20 flex w-full items-center justify-center px-4",
        pinned === "fixed" ? "fixed inset-x-0" : "sticky",
        // Slide with the side panel's open/close animation when offset (fixed only).
        pinned === "fixed" &&
          "transition-[right] duration-500 ease-[var(--ease-motion)]",
        position === "bottom"
          ? offset === "raised"
            ? "bottom-8 mt-auto"
            : "bottom-4 mt-auto"
          : offset === "raised"
            ? "top-8"
            : "top-4",
        className,
      )}
      // Pull the right edge in by the open side panel's width so a viewport-centred
      // fixed bar re-centres over the remaining content instead of overlapping the
      // panel. Inline `right` overrides `inset-x-0`'s `right: 0`. Fixed variant only.
      style={
        pinned === "fixed" && endInset > 0 ? { right: endInset } : undefined
      }
    >
      <style>{FLOATING_TABS_STYLES}</style>

      {/* Outer row — the indicator is positioned against this. */}
      <div
        ref={rowRef}
        className="floating-tabs-row relative flex items-center gap-2"
        onMouseLeave={() => setHoveredValue(null)}
      >
        {/* The shared sliding indicator. Lives at the row level so it can
            travel across all three pills and the gaps between them. */}
        {indicator && (
          <span
            key={pressTick}
            aria-hidden
            data-hovering={isHoverPreview ? "true" : undefined}
            className={cn(
              "floating-tabs-indicator absolute rounded-full",
              measuredOnce.current && "floating-tabs-indicator--animated",
            )}
            style={{
              left: indicator.left,
              top: indicator.top,
              width: indicator.width,
              height: indicator.height,
            }}
          />
        )}

        {leadingFab && renderFabPill(leadingFab, 0)}

        {tabs.length > 1 && (
          <div
            role="tablist"
            aria-label={ariaLabel}
            aria-orientation="horizontal"
            className={cn(
              "floating-tabs-pill pointer-events-auto relative flex h-12 items-center gap-1 rounded-full border p-1",
              "bg-floating-bar border-floating-bar-border shadow-floating-bar",
            )}
          >
            {tabs.map((tab, tabIdx) => {
              const isActive = tab.value === value;
              const Icon = tab.icon;
              const flatIndex = (leadingFab ? 1 : 0) + tabIdx;
              return (
                <button
                  key={tab.value}
                  ref={setButtonRef(tab.value)}
                  type="button"
                  role="tab"
                  id={`floating-tab-${tab.value}`}
                  aria-selected={isActive}
                  aria-controls={tab.value}
                  tabIndex={isActive ? 0 : -1}
                  data-active={isActive ? "true" : undefined}
                  data-value={tab.value}
                  {...(tab.tourTarget
                    ? { "data-tour-target": tab.tourTarget }
                    : {})}
                  onClick={() => handleSelect(tab.value)}
                  onKeyDown={(event) => handleKeyDown(event, flatIndex)}
                  onMouseEnter={() => setHoveredValue(tab.value)}
                  onFocus={() => setHoveredValue(tab.value)}
                  onBlur={() => setHoveredValue(null)}
                  className={cn(
                    "floating-tabs-button relative z-20 inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium",
                    "focus-visible:outline-none transition-colors duration-200",
                    isActive
                      ? "text-brand-blue"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {Icon && <Icon className="h-4 w-4" aria-hidden />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {trailingFab && renderFabPill(trailingFab, orderedValues.length - 1)}
      </div>

      <span className="sr-only" aria-live="polite">
        {value}
      </span>
    </div>
  );
}

/** Glass pill chrome + sliding indicator. */
const FLOATING_TABS_STYLES = `
/* Backdrop blur lives on the OUTER row, not the individual pills. Per-pill
   backdrop-filter creates a stacking context that traps the buttons UNDER
   the row-level indicator. Hoisting the filter here keeps the glass feel
   while letting the indicator (z-5) sit between the pill background and
   the button content (z-20). */
.floating-tabs-row {
  -webkit-backdrop-filter: saturate(180%) blur(28px);
  backdrop-filter: saturate(180%) blur(28px);
  border-radius: 9999px;
}

.floating-tabs-pill {
  /* No backdrop-filter here — see comment on .floating-tabs-row above. */
}

/* Floating indicator — soft inner highlight + subtle outer halo. Sits
   above the pill backgrounds (z-5) but below the button content (z-10),
   so the icon/label stays on top while the indicator paints the
   "selected" bubble. While in transit across the gap between pills it's
   visually a free-floating glass shape — that's the bulge effect. */
.floating-tabs-indicator {
  pointer-events: none;
  z-index: 5;
  background: var(--color-chip-active);
  box-shadow:
    inset 0 1px 0 hsl(0 0% 100% / 0.7),
    inset 0 -1px 0 hsl(240 6% 10% / 0.04),
    0 0 0 1px hsl(0 0% 100% / 0.18),
    0 2px 8px -2px hsl(240 6% 10% / 0.1);
}

.dark .floating-tabs-indicator {
  background: var(--color-chip-active);
  box-shadow:
    inset 0 1px 0 hsl(0 0% 100% / 0.12),
    inset 0 -1px 0 hsl(0 0% 0% / 0.2),
    0 0 0 1px hsl(0 0% 100% / 0.06),
    0 2px 8px -2px hsl(0 0% 0% / 0.4);
}

/* Slide between positions with a soft-overshoot bezier — the "gooey flow". */
.floating-tabs-indicator--animated {
  transition:
    left 360ms cubic-bezier(0.34, 1.32, 0.64, 1),
    top 360ms cubic-bezier(0.34, 1.32, 0.64, 1),
    width 360ms cubic-bezier(0.34, 1.32, 0.64, 1),
    height 360ms cubic-bezier(0.34, 1.32, 0.64, 1),
    opacity 200ms ease-out;
}

/* While previewing on hover (indicator parked over a non-active button),
   dim slightly so it reads as "preview" rather than committed selection. */
.floating-tabs-indicator[data-hovering] {
  opacity: 0.78;
}

/* Click-impact pulse — re-keys via React state to retrigger on each
   selection. Only fires when the indicator is settled on the active item. */
.floating-tabs-indicator--animated:not([data-hovering]) {
  animation: floating-tabs-press 280ms cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes floating-tabs-press {
  0%   { transform: scale(1); }
  40%  { transform: scale(0.92); filter: brightness(0.95); }
  100% { transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .floating-tabs-indicator--animated,
  .floating-tabs-button {
    transition: none !important;
    animation: none !important;
  }
}
`;
