import type { ReactNode } from "react";
import { cn } from "../compat/utils.js";
/** Migration renderer. New callers use ProgressPie from the package root. */
export interface ProgressPieRendererProps {
  fraction: number;
  label?: ReactNode;
  iconOnly?: boolean;
  ringClassName?: string;
  wedgeClassName?: string;
  pieClassName?: string;
  labelClassName?: string;
  className?: string;
  "data-status"?: string;
  "data-testid"?: string;
}
export function ProgressPieRenderer({
  fraction: input,
  label,
  iconOnly = false,
  ringClassName,
  wedgeClassName,
  pieClassName = "h-3.5 w-3.5",
  labelClassName,
  className,
  ...data
}: ProgressPieRendererProps) {
  const fraction = Number.isFinite(input) ? Math.max(0, Math.min(1, input)) : 0;
  const angle = fraction * 2 * Math.PI;
  const path = `M 7 7 L 7 3.25 A 3.75 3.75 0 ${fraction > 0.5 ? 1 : 0} 1 ${7 + 3.75 * Math.sin(angle)} ${7 - 3.75 * Math.cos(angle)} Z`;
  return (
    <span
      {...data}
      className={cn("inline-flex min-w-0 items-center gap-1.5", className)}
    >
      <svg
        viewBox="0 0 14 14"
        className={cn("block shrink-0", pieClassName)}
        aria-hidden="true"
        focusable="false"
        data-fraction={fraction}
      >
        <circle
          cx={7}
          cy={7}
          r={6.25}
          fill="none"
          strokeWidth={1.5}
          className={ringClassName}
        />
        {fraction >= 1 ? (
          <circle cx={7} cy={7} r={3.75} className={wedgeClassName} />
        ) : fraction > 0 ? (
          <path d={path} className={wedgeClassName} />
        ) : null}
      </svg>
      {label !== undefined && (
        <span className={iconOnly ? "sr-only" : cn("truncate", labelClassName)}>
          {label}
        </span>
      )}
    </span>
  );
}
