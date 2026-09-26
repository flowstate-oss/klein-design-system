"use client";

import {
  useRef,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";

/**
 * Wrapper that prevents its children from being squished when the
 * RHS entity details panel opens/closes. The content maintains its
 * "full width" and the parent scrolls horizontally if needed.
 *
 * Responds normally to genuine window/viewport resizes.
 *
 * How it works:
 * 1. While the panel is CLOSED, a ResizeObserver continuously tracks the
 *    container's width into a ref (no state, no re-renders, no feedback).
 * 2. When the panel OPENS, a useLayoutEffect (runs before paint) locks
 *    min-width to the last tracked natural width, preventing the flex
 *    container from shrinking the content.
 * 3. While open, window resize events recalculate min-width from the
 *    parent's width (parent + detailsWidth = natural width).
 * 4. When the panel CLOSES, min-width is cleared and the content flows
 *    naturally again.
 */
export function StableWidthLayout({
  children,
  className = "h-full",
  panelActive,
  detailsWidth,
}: {
  children: ReactNode;
  panelActive: boolean;
  detailsWidth: number;
  /**
   * Classes for the wrapper element. Defaults to `'h-full'` — the page-root
   * usage, where this component is rendered directly into a height-bearing
   * `<main>`. When the layout is nested as a *flex child* (e.g. a single tab
   * inside a flex-column route that also renders a persistent header), pass the
   * flex sizing it needs to fill — e.g. `'flex min-h-0 flex-1 flex-col
   * overflow-hidden'` — so it grows into the remaining space instead of forcing
   * a literal 100% height that would overflow the header. The min-width pin
   * (this component's whole job) is applied via inline style and is unaffected
   * by this className.
   */
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [minWidth, setMinWidth] = useState<number | undefined>(undefined);
  const naturalWidthRef = useRef<number>(0);

  // While panel is closed, continuously track the "natural" width in a ref.
  // Using a ref (not state) avoids re-renders and feedback loops.
  useEffect(() => {
    if (panelActive) return;
    const el = containerRef.current;
    if (!el) return;

    // Capture immediately on mount / when panel closes
    naturalWidthRef.current = el.getBoundingClientRect().width;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) naturalWidthRef.current = width;
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [panelActive]);

  // Lock min-width BEFORE paint when panel opens.
  // useLayoutEffect runs synchronously after DOM mutations but before
  // the browser paints, so naturalWidthRef still has the pre-open value.
  //
  // When the panel closes, delay clearing min-width until the aside's
  // CSS transition finishes (200ms) to avoid a width shift mid-animation.
  useLayoutEffect(() => {
    if (panelActive) {
      if (naturalWidthRef.current > 0) {
        setMinWidth(naturalWidthRef.current);
      } else {
        // Panel was already open on mount — estimate natural width
        const el = containerRef.current;
        if (el) {
          setMinWidth(el.getBoundingClientRect().width + detailsWidth);
        }
      }
    } else {
      // Wait for the aside's 200ms CSS transition to finish before
      // releasing the width constraint, so the content doesn't jump
      // while the panel is still animating closed.
      const timer = setTimeout(() => setMinWidth(undefined), 200);
      return () => clearTimeout(timer);
    }
  }, [panelActive, detailsWidth]);

  // While open, adjust for genuine window resizes so the content
  // responds to viewport changes. window.resize does NOT fire during
  // CSS transitions, so there's no jitter from the aside animating.
  useEffect(() => {
    if (!panelActive) return;

    const handleResize = () => {
      // Parent is <main>, whose width = body area - details panel.
      // Natural width = parent width + detailsWidth.
      const parent = containerRef.current?.parentElement;
      if (!parent) return;
      setMinWidth(parent.getBoundingClientRect().width + detailsWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [panelActive, detailsWidth]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ minWidth: minWidth ? `${minWidth}px` : undefined }}
    >
      {children}
    </div>
  );
}
