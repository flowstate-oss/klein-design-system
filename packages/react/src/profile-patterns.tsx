"use client";
import type { ReactNode } from "react";
import { ProfilePageFrame } from "./patterns/ProfilePageFrame.js";
import {
  IdentityStrip as Identity,
  type IdentityStripProps as IdentityProps,
} from "./patterns/IdentityStrip.js";
import {
  StandingSummary as Standing,
  type StandingSummaryProps as StandingProps,
} from "./patterns/StandingSummary.js";
import {
  SectionDivider as Divider,
  type SectionDividerProps as DividerProps,
} from "./patterns/SectionDivider.js";
import { ProgressRing as Ring } from "./patterns/ProgressRing.js";
/** A subject-centric page: identity, standing summary, metrics and tabbed content. */
export interface ProfilePageLayoutProps {
  header: ReactNode;
  summary?: ReactNode;
  metrics?: ReactNode;
  children: ReactNode;
}
export function ProfilePageLayout({
  header,
  summary,
  metrics,
  children,
}: ProfilePageLayoutProps) {
  return (
    <ProfilePageFrame
      identity={header}
      standing={summary}
      kpis={metrics}
      tabs={children}
    />
  );
}
/** A compact identity row with optional status. */
export type IdentityStripProps = Omit<IdentityProps, "className">;
export function IdentityStrip(props: IdentityStripProps) {
  return <Identity {...props} />;
}
/** A standing value, explanation and links to the next action and its policy. */
export type StandingSummaryProps = Omit<StandingProps, "className">;
export function StandingSummary(props: StandingSummaryProps) {
  return <Standing {...props} />;
}
/** A section boundary with optional label, metadata and trailing controls. */
export type SectionDividerProps = Omit<DividerProps, "className">;
export function SectionDivider(props: SectionDividerProps) {
  return <Divider {...props} />;
}
/** Compact measured progress with an accessible value and text label. */
export interface ProgressRingProps {
  label: string;
  value: number;
  size?: number;
}
export function ProgressRing({ label, value, size }: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
    >
      <Ring percent={clamped} size={size} />
    </span>
  );
}
