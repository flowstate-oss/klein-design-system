import { ArrowRight } from "lucide-react";
export interface ValueTransitionProps {
  /** Previous display value; omit for a new assignment. */
  fromLabel?: string | null;
  /** Proposed display value. */
  toLabel: string;
}
/** A compact before/after preview for assignments and other prepared values. */
export function ValueTransition({ fromLabel, toLabel }: ValueTransitionProps) {
  return (
    <div className="k-value-transition">
      {fromLabel && (
        <>
          <span>{fromLabel}</span>
          <ArrowRight aria-hidden="true" size={16} />
        </>
      )}
      <strong>{toLabel}</strong>
    </div>
  );
}
