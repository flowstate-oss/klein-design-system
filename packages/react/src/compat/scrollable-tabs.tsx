"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "./utils.js";

const ScrollableTabs = TabsPrimitive.Root;

interface ScrollableTabsListProps extends React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.List
> {
  /** Show arrow buttons when content overflows */
  showArrows?: boolean;
}

/**
 * Scrollable tab list with pill-style container.
 * Renders a muted track with overflow arrow controls.
 */
const ScrollableTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  ScrollableTabsListProps
>(({ className, showArrows = true, children, ...props }, ref) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const [indicatorPos, setIndicatorPos] = React.useState<{
    left: number;
    width: number;
  } | null>(null);

  /** Merge forwarded ref with internal list ref */
  const setListRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      listRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  /** Recalculate overflow state from the scroll container */
  const checkScroll = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  React.useEffect(() => {
    checkScroll();
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("scroll", checkScroll);
    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", checkScroll);
      resizeObserver.disconnect();
    };
  }, [checkScroll]);

  /** Scroll the tab container by half its visible width */
  const scroll = (direction: "left" | "right") => {
    const container = containerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.5;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  /** Measure a tab element's position relative to the list */
  const measureTab = React.useCallback((tab: HTMLElement) => {
    return { left: tab.offsetLeft, width: tab.offsetWidth };
  }, []);

  /** Find and measure the currently active tab */
  const measureActiveTab = React.useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const activeTab = list.querySelector<HTMLElement>(
      '[role="tab"][data-state="active"]',
    );
    if (activeTab) {
      setIndicatorPos(measureTab(activeTab));
    }
  }, [measureTab]);

  /** Watch for active tab changes + resize */
  React.useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    measureActiveTab();

    const mutationObserver = new MutationObserver(measureActiveTab);
    list.querySelectorAll('[role="tab"]').forEach((tab) => {
      mutationObserver.observe(tab, {
        attributes: true,
        attributeFilter: ["data-state"],
      });
    });

    const resizeObserver = new ResizeObserver(measureActiveTab);
    resizeObserver.observe(list);

    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [measureActiveTab]);

  /** Pointer over: slide indicator to hovered tab */
  const handlePointerOver = React.useCallback(
    (e: React.PointerEvent) => {
      const tab = (e.target as HTMLElement).closest<HTMLElement>(
        '[role="tab"]',
      );
      if (tab) {
        setIndicatorPos(measureTab(tab));
      }
    },
    [measureTab],
  );

  /** Pointer leave: snap back to active tab */
  const handlePointerLeave = React.useCallback(() => {
    measureActiveTab();
  }, [measureActiveTab]);

  const showLeftArrow = showArrows && canScrollLeft;
  const showRightArrow = showArrows && canScrollRight;

  return (
    <div className="relative flex items-center">
      {showLeftArrow && (
        <button
          type="button"
          className="bg-background/90 text-muted-foreground hover:text-foreground absolute left-0 z-10 flex h-8 w-6 items-center justify-center backdrop-blur-sm transition-colors"
          onClick={() => scroll("left")}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      <div
        ref={containerRef}
        className={cn(
          "scrollbar-none flex-1 overflow-x-auto overflow-y-hidden",
          showLeftArrow && "pl-6",
          showRightArrow && "pr-6",
        )}
      >
        {/* Underline track: bottom-bordered container for the tab triggers */}
        <TabsPrimitive.List
          ref={setListRef}
          className={cn(
            "relative overflow-hidden text-muted-foreground inline-flex h-9 items-center gap-4 border-b border-border pb-0",
            className,
          )}
          onPointerOver={handlePointerOver}
          onPointerLeave={handlePointerLeave}
          {...props}
        >
          {children}
          {indicatorPos && (
            <div
              className="pointer-events-none absolute bottom-0 left-0 h-[3px] rounded-full bg-[#C4785C] dark:bg-[#D68C70]"
              style={{
                transform: `translateX(${indicatorPos.left}px)`,
                width: `${indicatorPos.width}px`,
                transition:
                  "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.3s cubic-bezier(0.25, 1, 0.5, 1)",
              }}
            />
          )}
        </TabsPrimitive.List>
      </div>

      {showRightArrow && (
        <button
          type="button"
          className="bg-background/90 text-muted-foreground hover:text-foreground absolute right-0 z-10 flex h-8 w-6 items-center justify-center backdrop-blur-sm transition-colors"
          onClick={() => scroll("right")}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
});
ScrollableTabsList.displayName = "ScrollableTabsList";

/**
 * Individual tab trigger with underline indicator.
 *
 * Active state: warm terracotta underline with foreground text.
 * Inactive state: transparent border with muted text.
 */
const ScrollableTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      /* Base layout */
      "relative inline-flex items-center justify-center rounded-none px-3 py-1.5 text-sm font-medium whitespace-nowrap",
      /* Focus + disabled states */
      "focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
      /* Inactive: muted text */
      "text-muted-foreground",
      /* Hover: text color only, no bg */
      "hover:text-foreground",
      /* Transition */
      "transition-colors duration-200",
      /* Active: foreground text + semibold */
      "data-[state=active]:text-foreground data-[state=active]:font-semibold",
      className,
    )}
    {...props}
  />
));
ScrollableTabsTrigger.displayName = "ScrollableTabsTrigger";

/**
 * Tab content panel.
 */
const ScrollableTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "ring-offset-background focus-visible:ring-ring mt-3 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
      className,
    )}
    {...props}
  />
));
ScrollableTabsContent.displayName = "ScrollableTabsContent";

export {
  ScrollableTabs,
  ScrollableTabsList,
  ScrollableTabsTrigger,
  ScrollableTabsContent,
};
