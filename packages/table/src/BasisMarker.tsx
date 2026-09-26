import type { ReactNode } from "react";
export interface BasisMarkerProps {
  basis: string;
  label: string;
  definition: string;
  children: ReactNode;
}
export function BasisMarker({
  basis,
  label,
  definition,
  children,
}: BasisMarkerProps) {
  return (
    <span
      className="decoration-muted-foreground cursor-help underline decoration-dotted underline-offset-4"
      title={definition}
      data-testid="basis-marker"
      data-basis={basis}
    >
      {children}
      <span className="sr-only">{` (${label})`}</span>
    </span>
  );
}
