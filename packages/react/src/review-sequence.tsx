"use client";
import type { ReactNode } from "react";
import { CheckCircle2, Clock, XCircle, Circle } from "lucide-react";
import { Tooltip } from "./controls.js";
export interface ReviewSequenceStep {
  /** Stable step identity; supplied order is preserved. */
  id: string;
  /** Compact visible reviewer label, such as initials. */
  label: string;
  /** Full accessible description of the reviewer and status. */
  accessibleLabel: string;
  /** Formatted status, date and notes. */
  details: ReactNode;
  /** Business assessment already resolved by the application. */
  tone: "neutral" | "good" | "watch" | "bad";
  /** Symbol paired with the supplied tone and accessible label. */
  icon: "check" | "clock" | "cross" | "circle";
}
export interface ReviewSequenceProps {
  /** Accessible name for the ordered review sequence. */
  label: string;
  steps: readonly ReviewSequenceStep[];
  /** Hide the supplementary icon in dense table rows. */
  compact?: boolean;
}
const icons = {
  check: CheckCircle2,
  clock: Clock,
  cross: XCircle,
  circle: Circle,
};
/** Ordered review stages with keyboard-accessible explanations. */
export function ReviewSequence({
  label,
  steps,
  compact = false,
}: ReviewSequenceProps) {
  if (!steps.length) return null;
  return (
    <ol className="k-review-sequence" aria-label={label}>
      {steps.map((step) => {
        const Icon = icons[step.icon];
        return (
          <li key={step.id} data-tone={step.tone}>
            <Tooltip content={step.details}>
              <button type="button" aria-label={step.accessibleLabel}>
                <span>{step.label}</span>
                <span className="k-review-status" aria-hidden="true">
                  <i />
                  {!compact && <Icon />}
                </span>
              </button>
            </Tooltip>
          </li>
        );
      })}
    </ol>
  );
}
