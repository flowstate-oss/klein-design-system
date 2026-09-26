import type { ReactNode } from "react";
import {
  DashboardBand as Band,
  SplitBand as Split,
  BandTitle as Title,
} from "./compat/dashboard-band.js";
/** Full-width dashboard stack; no outer gutters, cards or grid gaps. */
export interface EdgeToEdgeLayoutProps {
  children: ReactNode;
  /** Fill a height-constrained parent. */ grow?: boolean;
}
export function EdgeToEdgeLayout({
  children,
  grow = false,
}: EdgeToEdgeLayoutProps) {
  return (
    <div className="k-edge-layout" data-grow={grow || undefined}>
      {children}
    </div>
  );
}
/** A band owns its own gutter. Tables use flush and own their cell gutters. */
export interface DashboardBandProps {
  children: ReactNode;
  flush?: boolean;
  grow?: boolean;
}
export function DashboardBand(props: DashboardBandProps) {
  return <Band {...props} />;
}
/** Two equal full-bleed regions separated by a hairline, stacked on narrow screens. */
export interface SplitBandProps {
  left: ReactNode;
  right: ReactNode;
  grow?: boolean;
}
export function SplitBand(props: SplitBandProps) {
  return <Split {...props} />;
}
/** Sentence-case label and optional actions/information slots. */
export interface BandTitleProps {
  children: ReactNode;
  info?: ReactNode;
  actions?: ReactNode;
}
export function BandTitle(props: BandTitleProps) {
  return <Title {...props} />;
}
