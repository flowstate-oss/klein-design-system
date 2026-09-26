"use client";

/**
 * ProgressRing — a small flat SVG donut showing a completion percentage. The
 * track is muted, the filled arc emerald (delivery progress reads as "good"); the
 * percentage renders mono in the centre. Used for the "Progress" header stat on
 * entity detail pages (initiative / project).
 */

import { cn } from "../compat/utils.js";

export interface ProgressRingProps {
  /** 0–100. Clamped. */
  percent: number;
  /** Diameter in px (default 36). */
  size?: number;
  /** Ring stroke width in px (default 4). */
  stroke?: number;
  className?: string;
}

export function ProgressRing({
  percent,
  size = 36,
  stroke = 4,
  className,
}: ProgressRingProps): React.JSX.Element {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const dash = (clamped / 100) * circumference;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        className,
      )}
      aria-hidden
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          className="stroke-emerald-500"
        />
      </svg>
      <span className="absolute font-mono text-[10px] font-semibold tabular-nums">
        {clamped}
      </span>
    </span>
  );
}
