"use client";
import { useChartTheme } from "./theme.js";
import { CHART_PALETTE_LIGHT, CHART_PALETTE_DARK } from "./chart-palette.js";
export interface RankedBarItem {
  /** Stable identity; ordering and top-N limits belong to the application. */
  id: string;
  label: string;
  /** Formatted cost, count or other display value. */
  valueLabel: string;
  /** Percentage of the comparison maximum, prepared by the data layer. */
  percentage: number;
  /** Optional count or supporting detail beside the label. */
  description?: string;
}
export interface RankedBarsProps {
  /** Accessible name for this ranking. */
  label: string;
  items: readonly RankedBarItem[];
  /** Controlled selection; other rows remain visible but dimmed. */
  value?: string | null;
  onValueChange?: (id: string) => void;
  loading?: boolean;
  loadingLabel?: string;
  emptyLabel: string;
}
/** Ranked values with proportional bars; never sorts, aggregates or formats domain values. */
export function RankedBars({
  label,
  items,
  value,
  onValueChange,
  loading = false,
  loadingLabel = "Loading",
  emptyLabel,
}: RankedBarsProps) {
  const { theme } = useChartTheme();
  const palette = theme === "dark" ? CHART_PALETTE_DARK : CHART_PALETTE_LIGHT;
  return (
    <section
      aria-label={label}
      className="k-ranked-bars"
      aria-busy={loading || undefined}
    >
      {loading || !items.length ? (
        <p role="status">{loading ? loadingLabel : emptyLabel}</p>
      ) : (
        <ol>
          {items.map((item, index) => {
            const content = (
              <>
                <span className="k-ranked-bar-heading">
                  <span>
                    {item.label}
                    {item.description && <small> {item.description}</small>}
                  </span>
                  <span className="k-ranked-bar-value">{item.valueLabel}</span>
                </span>
                <span className="k-ranked-bar-track" aria-hidden="true">
                  <span
                    style={{
                      width: `${Number.isFinite(item.percentage) ? Math.max(0, Math.min(100, item.percentage)) : 0}%`,
                      backgroundColor: palette[index % palette.length],
                    }}
                  />
                </span>
              </>
            );
            return (
              <li
                key={item.id}
                data-dimmed={(!!value && value !== item.id) || undefined}
              >
                {onValueChange ? (
                  <button
                    type="button"
                    aria-pressed={value === item.id}
                    onClick={() => onValueChange(item.id)}
                  >
                    {content}
                  </button>
                ) : (
                  <div>{content}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
