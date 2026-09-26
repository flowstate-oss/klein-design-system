import React, { useEffect, useState } from "react";
import { cn } from "./utils.js";

export interface PulsingIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The element to wrap with the indicator */
  children?: React.ReactNode;
  /** Whether the indicator is active/visible */
  active?: boolean;
  /** Whether the pulse animation should run */
  pulsing?: boolean;
  /** Duration in ms to stop pulsing automatically. If undefined, pulses forever. */
  pulseDuration?: number;
  /** Color of the indicator dot */
  color?: string;
  /** Custom class for the wrapper */
  className?: string;
  /** Custom class for the indicator dot */
  indicatorClassName?: string;
  /** Position of the indicator relative to the child */
  position?:
    "top-right" | "top-left" | "bottom-right" | "bottom-left" | "center-right";
}

export const PulsingIndicator = React.forwardRef<
  HTMLDivElement,
  PulsingIndicatorProps
>(
  (
    {
      children,
      active = true,
      pulsing: initialPulsing = true,
      pulseDuration,
      color = "bg-amber-500",
      className,
      indicatorClassName,
      position = "top-right",
      ...props
    },
    ref,
  ) => {
    const [isPulsing, setIsPulsing] = useState(initialPulsing);

    useEffect(() => {
      setIsPulsing(initialPulsing);
    }, [initialPulsing]);

    useEffect(() => {
      if (active && isPulsing && pulseDuration) {
        const timer = setTimeout(() => {
          setIsPulsing(false);
        }, pulseDuration);
        return () => clearTimeout(timer);
      }
    }, [active, isPulsing, pulseDuration]);

    if (!active) return <>{children}</>;

    const positionClasses = {
      "top-right": "-top-1 -right-1",
      "top-left": "-top-1 -left-1",
      "bottom-right": "-bottom-1 -right-1",
      "bottom-left": "-bottom-1 -left-1",
      "center-right": "top-1/2 -translate-y-1/2 right-2",
    };

    return (
      <div
        ref={ref}
        className={cn("relative inline-flex", className)}
        {...props}
      >
        {children}
        <span
          className={cn(
            "absolute z-50 flex h-3 w-3",
            positionClasses[position],
            indicatorClassName,
          )}
        >
          {isPulsing && (
            <span
              className={cn(
                "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                color.replace("bg-", "bg-").replace("500", "400"), // Try to lighten the ping color
              )}
            />
          )}
          <span
            className={cn("relative inline-flex h-3 w-3 rounded-full", color)}
          />
        </span>
      </div>
    );
  },
);

PulsingIndicator.displayName = "PulsingIndicator";
