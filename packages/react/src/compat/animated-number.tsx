"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "./utils.js";

/**
 * Easing function for smooth animation deceleration.
 * Uses ease-out cubic for natural feel.
 */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

interface AnimatedNumberProps {
  /** The target value to animate to */
  value: number;
  /** Function to format the number for display (e.g., currency, percentage) */
  formatter: (n: number) => string;
  /** Animation duration in milliseconds (default: 800ms) */
  duration?: number;
  /** Whether the value is currently being recalculated (shows shimmer) */
  isCalculating?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * AnimatedNumber - Displays a number with smooth counting animation.
 *
 * Features:
 * - Smooth 60fps counting animation using requestAnimationFrame
 * - Ease-out cubic easing for natural deceleration
 * - Respects prefers-reduced-motion accessibility preference
 * - Optional shimmer overlay when recalculating
 * - Customizable formatter for currency, percentages, etc.
 *
 * @example
 * ```tsx
 * <AnimatedNumber
 *   value={1234567}
 *   formatter={(n) => `$${n.toLocaleString()}`}
 *   isCalculating={networkStatus === NetworkStatus.refetch}
 * />
 * ```
 */
export function AnimatedNumber({
  value,
  formatter,
  duration = 800,
  isCalculating = false,
  className,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const animationRef = useRef<number | null>(null);
  const startValueRef = useRef(value);
  const startTimeRef = useRef<number | null>(null);

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    // If reduced motion is preferred, skip animation
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    // If value hasn't changed, no need to animate
    if (value === displayValue && startValueRef.current === value) {
      return;
    }

    // Cancel any existing animation
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }

    // Start animation from current display value
    startValueRef.current = displayValue;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      // Interpolate between start and target values
      const currentValue =
        startValueRef.current + (value - startValueRef.current) * easedProgress;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Ensure we end exactly on the target value
        setDisplayValue(value);
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
    // We intentionally only depend on value and duration to trigger animation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, prefersReducedMotion]);

  return (
    <span className={cn("relative inline-block", className)}>
      {/* The animated number value */}
      <span
        className={cn(
          isCalculating && "opacity-70 transition-opacity duration-200",
        )}
      >
        {formatter(displayValue)}
      </span>

      {/* Shimmer overlay when calculating */}
      {isCalculating && (
        <span
          className="animate-shimmer pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent bg-[length:200%_100%] dark:via-white/10"
          aria-hidden="true"
        />
      )}
    </span>
  );
}
