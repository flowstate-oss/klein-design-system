import { ProgressPieRenderer } from "./patterns/ProgressPie.js";
export interface ProgressPieProps {
  /** Accessible, application-formatted description of completion. */
  label: string;
  /** Completion percentage from 0 to 100; values outside the range are clamped. */
  value: number;
  /** Semantic assessment supplied by the application. */
  tone?: "neutral" | "good" | "watch" | "bad";
  /** Keep the description accessible while hiding it visually. */
  iconOnly?: boolean;
  /** Canonical glyph sizes. */
  size?: "small" | "medium";
}
/** Compact completion glyph for entity properties and table cells. */
export function ProgressPie({
  label,
  value,
  tone = "neutral",
  iconOnly = false,
  size = "small",
}: ProgressPieProps) {
  return (
    <ProgressPieRenderer
      fraction={value / 100}
      label={label}
      iconOnly={iconOnly}
      className={`k-progress-pie k-progress-pie-${tone}`}
      pieClassName={`k-progress-pie-glyph k-progress-pie-${size}`}
      ringClassName="k-progress-pie-ring"
      wedgeClassName="k-progress-pie-wedge"
    />
  );
}
