"use client";
import { Sparkline as Renderer } from "./Sparkline.js";
/** A compact trend. Tone expresses a consequence decided by the application. */
export interface SparklineProps {
  points: readonly number[];
  label: string;
  partialFromIndex?: number;
  tone?: "neutral" | "accent" | "good" | "watch" | "bad";
  width?: number;
  height?: number;
}
export function Sparkline({ tone = "neutral", ...props }: SparklineProps) {
  return (
    <Renderer
      {...props}
      color={
        tone === "neutral"
          ? "currentColor"
          : `var(--k-${tone === "accent" ? "klein" : tone})`
      }
    />
  );
}
