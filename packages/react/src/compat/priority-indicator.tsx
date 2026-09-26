"use client";

import * as React from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "./utils.js";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "./dropdown-menu.js";

export interface PriorityIndicatorProps {
  priority: number | null | undefined; // 0-6
  className?: string;
  /** Size of the square. Default 16px (4). */
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
} as const;

// Updated for wider gap and more rounded look
const BAR_SIZE_MAP = {
  sm: "h-3 w-[10px] gap-[1.5px]",
  md: "h-4 w-[13px] gap-[2px]",
  lg: "h-5 w-[16px] gap-[2.5px]",
} as const;

/**
 * Priority indicator rendered as vertical bars like a volume icon.
 * Priority 1-5 fills bars left-to-right. Priority 6 (urgent) shows a caution icon.
 */
export function PriorityIndicator({
  priority = 0,
  className,
  size = "md",
}: PriorityIndicatorProps) {
  const p = priority ?? 0;
  const isUrgent = p === 6;

  if (isUrgent) {
    return (
      <div className={cn(SIZE_MAP[size], className)} title="Urgent Priority">
        <CircleAlert className={cn("text-orange-500", SIZE_MAP[size])} />
      </div>
    );
  }

  const filledCount = BAR_MAP[p] ?? Math.min(p, 3);
  // 3 bars rendered left-to-right with ascending height.
  const bars = [1, 2, 3];

  return (
    <div
      className={cn(
        "flex items-end justify-between",
        BAR_SIZE_MAP[size],
        className,
      )}
      aria-label={`Priority ${p}`}
      role="img"
    >
      {bars.map((threshold) => {
        const filled = threshold <= filledCount;
        // Calculate height percentage: 33%, 66%, 100%
        const heightPercent = Math.round((threshold / 3) * 100);

        return (
          <span
            key={threshold}
            style={{ height: `${heightPercent}%` }}
            className={cn(
              "block w-full min-w-[2.5px] rounded-full",
              filled
                ? "bg-[var(--color-chart-12)]" // Warm taupe from chart palette
                : "bg-muted-foreground/20",
            )}
          />
        );
      })}
    </div>
  );
}

export interface PrioritySelectorProps {
  priority: number | null | undefined;
  onChange?: (priority: number) => void;
  className?: string;
}

const LABELS: Record<number, string> = {
  0: "None",
  1: "Low",
  3: "Medium",
  5: "High",
  6: "Urgent",
};

// Map logical priorities to 1-3 visual bars
const BAR_MAP: Record<number, number> = {
  0: 0, // None -> no bars filled
  1: 1, // Low -> 1 bar
  3: 2, // Medium -> 2 bars
  5: 3, // High -> 3 bars
  6: 3, // Urgent -> 3 bars (but shows orange icon instead)
};

export function PrioritySelector({
  priority = 0,
  onChange,
  className,
}: PrioritySelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "hover:bg-muted inline-flex items-center gap-2 rounded px-1 py-0.5 text-sm",
            className,
          )}
          aria-label="Select priority"
        >
          <PriorityIndicator priority={priority} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent sideOffset={6} className="min-w-[160px]">
        <DropdownMenuLabel>Select priority</DropdownMenuLabel>
        {[0, 1, 3, 5, 6].map((val) => {
          return (
            <DropdownMenuItem
              key={val}
              onClick={() => onChange?.(val)}
              className="flex items-center gap-2"
            >
              <div className="flex items-center gap-2">
                <div className="w-5">
                  <PriorityIndicator priority={val} />
                </div>
                <span className="text-muted-foreground text-sm">
                  {LABELS[val]}
                </span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default PriorityIndicator;
