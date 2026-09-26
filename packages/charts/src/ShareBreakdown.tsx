"use client";
import { Tooltip, Button } from "@klein-ui/react";
import { Info } from "lucide-react";
import { tokens } from "@klein-ui/tokens";
import { CHART_PALETTE_LIGHT, CHART_PALETTE_DARK } from "./chart-palette.js";
import { useChartTheme } from "./theme.js";
/** Prepared share. A shared series ID gives reported and estimated values the same identity. */
export interface ShareSegment {
  id: string;
  seriesId?: string;
  label: string;
  percentage: number;
  valueLabel: string;
  helpText?: string;
  estimated?: boolean;
}
export interface ShareBreakdownProps {
  label: string;
  description?: string;
  segments: readonly ShareSegment[];
  totalLabel: string;
  totalValue: string;
  emptyLabel: string;
}
/** Compact ring with detailed shares, accessible help and estimated-value patterns. */
export function ShareBreakdown({
  label,
  description,
  segments,
  totalLabel,
  totalValue,
  emptyLabel,
}: ShareBreakdownProps) {
  const { theme } = useChartTheme();
  const palette = theme === "dark" ? CHART_PALETTE_DARK : CHART_PALETTE_LIGHT;
  const seriesIds = Array.from(
    new Set(segments.map((segment) => segment.seriesId ?? segment.id)),
  );
  const circumference = 2 * Math.PI * 40;
  let offset = 0;
  const drawing = segments.map((segment) => {
    const length =
      (Math.max(0, Math.min(100, segment.percentage)) / 100) * circumference;
    const item = {
      ...segment,
      color:
        palette[
          seriesIds.indexOf(segment.seriesId ?? segment.id) % palette.length
        ],
      length,
      offset,
    };
    offset += length;
    return item;
  });
  return (
    <figure aria-label={label} className="p-4">
      <figcaption className="mb-4">
        <h3 className="font-semibold text-ink">{label}</h3>
        {description && <p className="text-sm text-body">{description}</p>}
      </figcaption>
      {!segments.length ? (
        <p role="status">{emptyLabel}</p>
      ) : (
        <div className="flex flex-wrap items-center gap-8">
          <div className="relative shrink-0">
            <svg
              aria-hidden="true"
              width="120"
              height="120"
              viewBox="0 0 100 100"
              className="-rotate-90"
            >
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={tokens.border}
                strokeWidth="12"
              />
              {drawing.map((segment) => (
                <circle
                  key={segment.id}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={segment.color}
                  strokeOpacity={segment.estimated ? 0.6 : 1}
                  strokeWidth="12"
                  strokeDasharray={`${segment.length} ${circumference}`}
                  strokeDashoffset={-segment.offset}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-base font-semibold tabular-nums">
                {totalValue}
              </span>
              <span className="text-xs text-body">{totalLabel}</span>
            </div>
          </div>
          <dl className="min-w-0 flex-1 space-y-2">
            {drawing.map((segment) => (
              <div key={segment.id}>
                <dt className="flex items-center gap-2 text-sm">
                  <span
                    aria-hidden="true"
                    className="h-3 w-3 shrink-0"
                    style={{
                      backgroundColor: segment.color,
                      opacity: segment.estimated ? 0.6 : 1,
                      backgroundImage: segment.estimated
                        ? `repeating-linear-gradient(45deg, transparent, transparent 2px, ${tokens.paper} 2px, ${tokens.paper} 3px)`
                        : undefined,
                    }}
                  />
                  {segment.label}
                  {segment.helpText && (
                    <Tooltip content={segment.helpText}>
                      <Button variant="text" size="sm"
                        type="button"
                        aria-label={`About ${segment.label}`}
                        >
                        <Info aria-hidden="true" size={14} />
                      </Button>
                    </Tooltip>
                  )}
                  <span className="ml-auto font-mono tabular-nums">
                    {segment.percentage.toFixed(1)}%
                  </span>
                </dt>
                <dd className="text-right font-mono text-xs text-body tabular-nums">
                  {segment.valueLabel}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </figure>
  );
}
