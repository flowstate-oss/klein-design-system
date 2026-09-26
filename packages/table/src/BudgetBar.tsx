"use client";
import { cn } from "@klein-ui/react/compat/utils";
export type BudgetPace = "within" | "ahead" | "over";
/** The application calculates budget pace and supplies localized descriptions. */
export interface BudgetBarProps {
  spent: number;
  limit: number;
  state: { spentShare: number; fill: number; tick: number; pace: BudgetPace };
  label: string;
  valueLabel: string;
}
/** Fill colour by pace (flat theme tokens). */
const PACE_FILL: Record<BudgetPace, string> = {
  within: "bg-foreground/60",
  ahead: "bg-watch",
  over: "bg-bad",
};

export function BudgetBar({
  spent,
  limit,
  state,
  label,
  valueLabel,
}: BudgetBarProps) {
  return (
    <div
      className="flex min-w-24 items-center gap-2"
      data-testid="budget-bar"
      data-pace={state.pace}
    >
      {/* Screen readers get a native meter; the drawn bar is decorative. */}
      <meter
        className="sr-only"
        min={0}
        max={limit}
        value={Math.min(Math.max(spent, 0), limit)}
        aria-label={label}
      />
      <div
        className="bg-muted relative h-2 flex-1"
        aria-hidden="true"
        title={label}
      >
        <div
          className={cn("h-full", PACE_FILL[state.pace])}
          style={{ width: `${state.fill * 100}%` }}
          data-testid="budget-bar-fill"
        />
        <div
          className="bg-foreground absolute -top-0.5 h-3 w-px"
          style={{ left: `${state.tick * 100}%` }}
          data-testid="budget-bar-tick"
        />
      </div>
      <span
        className={cn(
          "w-10 shrink-0 text-right font-mono text-[11px] font-semibold tabular-nums",
          state.pace === "over" ? "text-bad" : "text-muted-foreground",
        )}
      >
        {valueLabel}
      </span>
    </div>
  );
}
