import { ArrowDown, ArrowUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader } from "./card.js";
import { Skeleton } from "./skeleton.js";
import { AnimatedNumber } from "./animated-number.js";

export interface StatCardProps {
  /** Icon displayed next to the label */
  icon: React.ReactNode;
  /** Card label (e.g., "Employees", "Total Cost") */
  label: string;
  /** Current numeric value */
  current: number;
  /** Forecast numeric value */
  forecast: number;
  /** Delta (forecast - current) */
  delta: number;
  /** Formatter function for displaying values */
  formatter: (n: number) => string;
  /** Formatter for delta value display (can include +/- sign) */
  deltaFormatter?: (n: number) => string;
  /** Secondary value displayed below current (e.g., full currency amount) */
  secondaryFormatter?: (n: number) => string;
  /** Whether the data is currently being recalculated (shows shimmer) */
  isCalculating?: boolean;
  /** Label for the current value row (default: "Current") */
  currentLabel?: string;
  /** Label for the forecast value row (default: "Current forecast") */
  forecastLabel?: string;
  /** Label for the difference row (default: "Difference") */
  differenceLabel?: string;
}

/**
 * StatCard — Displays a metric with animated value transitions.
 *
 * When values change, numbers smoothly count up/down to the new value.
 * When recalculating (isCalculating=true), shows a subtle shimmer overlay.
 */
export function StatCard({
  icon,
  label,
  current,
  forecast,
  delta,
  formatter,
  deltaFormatter,
  secondaryFormatter,
  isCalculating = false,
  currentLabel = "Current",
  forecastLabel = "Current forecast",
  differenceLabel = "Difference",
}: StatCardProps) {
  const trendColor =
    delta > 0
      ? "text-green-600"
      : delta < 0
        ? "text-red-600"
        : "text-muted-foreground";
  const testId = `stat-card-${label.toLowerCase().replace(/\s+/g, "-")}`;

  // Default delta formatter adds +/- sign
  const formatDelta =
    deltaFormatter ??
    ((n: number) => {
      if (n === 0) return "0";
      const sign = n > 0 ? "+" : "";
      return `${sign}${formatter(n)}`;
    });

  return (
    <Card data-testid={testId}>
      <CardHeader className="pb-3">
        <CardDescription className="flex items-center gap-2">
          {icon}
          {label}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3" data-testid={`${testId}-value`}>
          <div>
            <p className="text-muted-foreground text-xs">{currentLabel}</p>
            <div className="font-mono text-2xl font-semibold tabular-nums">
              <AnimatedNumber
                value={current}
                formatter={formatter}
                isCalculating={isCalculating}
              />
            </div>
            {secondaryFormatter && (
              <div className="text-muted-foreground text-xs">
                <AnimatedNumber
                  value={current}
                  formatter={secondaryFormatter}
                  isCalculating={isCalculating}
                />
              </div>
            )}
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{forecastLabel}</p>
            <div className="text-muted-foreground font-mono text-sm tabular-nums">
              <AnimatedNumber
                value={forecast}
                formatter={formatter}
                isCalculating={isCalculating}
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{differenceLabel}</span>
            <span
              className={`flex items-center gap-1 font-mono font-medium tabular-nums ${trendColor}`}
            >
              {delta > 0 && <ArrowUp className="h-3 w-3" />}
              {delta < 0 && <ArrowDown className="h-3 w-3" />}
              <AnimatedNumber
                value={Math.abs(delta)}
                formatter={(n) => formatDelta(delta >= 0 ? n : -n)}
                isCalculating={isCalculating}
              />
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton placeholder for a StatCard while data is loading.
 */
export function StatCardSkeleton({
  label,
  icon,
}: {
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardDescription className="flex items-center gap-2">
          {icon}
          {label}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}
