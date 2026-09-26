"use client";

/**
 * StandingSummary — the "where this subject stands and what to do
 * about it" card of the Subject Detail pattern.
 *
 * Replaces the legacy approach of stacking four mini counter-cards
 * across the page. ONE `Card` with structured rows:
 *
 *   1. Standing label + value (e.g. "Tier — Heads-up").
 *   2. Optional supporting copy (one short paragraph, never two).
 *   3. Optional "nudge" line — the single recommended action.
 *   4. Optional policy link — where this standing is decided.
 *
 * The card collapses to a single neutral row when the subject is on
 * track (no scary chrome for a green state).
 */

import { type ComponentType, type AnchorHTMLAttributes } from "react";
import { usePatternLink } from "./routing.js";
import { ArrowRight } from "lucide-react";
import { Card } from "../compat/card.js";
import { cn } from "../compat/utils.js";

/**
 * Tone of the standing — drives the value chip colour and (when
 * `dangerous=true`) the row emphasis.
 */
export type SubjectStandingTone = "neutral" | "good" | "warn" | "bad";

const TONE_STYLES: Record<SubjectStandingTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  good: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  warn: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  bad: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
};

export interface StandingSummaryProps {
  /**
   * Eyebrow label above the standing value, e.g. "Tier", "Standing",
   * "Account status". Renders in 10px upper-case muted text.
   */
  label: string;
  /**
   * The standing value itself, e.g. "Heads-up", "Tier 3", "Active".
   * Renders as a pill with the requested tone.
   */
  value: string;
  /** Standing tone — drives the value pill colour. */
  tone: SubjectStandingTone;
  /**
   * One short paragraph of supporting copy. Keep it under 160 chars —
   * the card is for orientation, not documentation.
   */
  description?: string | null;
  /**
   * The single recommended action the viewer can take. Renders as a
   * compact row with an arrow. Omit when there's nothing to do.
   */
  nudge?: {
    label: string;
    href: string;
  } | null;
  /**
   * Link to the policy / configuration that drives this standing.
   * Renders as a tiny meta line at the bottom of the card.
   */
  policy?: {
    label: string;
    href: string;
  } | null;
  /** Extra class names — escape hatch for layout. */
  className?: string;
}

/**
 * Single-card standing summary. Inherits the `Card` chrome, but when this
 * component renders inside `.ai-surfaces` (see
 * `docs/specs/ai-terminal-design-language.md`) it picks up the flat inner
 * border + 12px padding override instead of the default drop shadow. The
 * `p-3` class here matches the AI Terminal "12px max" rule even outside the
 * scope so the card never disagrees with its sibling AI primitives.
 */
export function StandingSummary({
  label,
  value,
  tone,
  description = null,
  nudge = null,
  policy = null,
  className,
}: StandingSummaryProps): React.JSX.Element {
  const Link = usePatternLink();
  return (
    <Card
      data-testid="subject-standing-card"
      data-tone={tone}
      className={cn("flex flex-col gap-2 p-3", className)}
    >
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span
          data-testid="subject-standing-value"
          className={cn(
            "inline-flex items-center rounded-sm px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-wider",
            TONE_STYLES[tone],
          )}
        >
          {value}
        </span>
      </div>

      {description !== null && description !== "" ? (
        <p
          data-testid="subject-standing-description"
          className="text-sm text-muted-foreground"
        >
          {description}
        </p>
      ) : null}

      {nudge !== null ? (
        <Link
          href={nudge.href}
          data-testid="subject-standing-nudge"
          className="group inline-flex items-center gap-1 self-start text-xs font-medium text-foreground underline-offset-2 hover:underline"
        >
          {nudge.label}
          <ArrowRight
            className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      ) : null}

      {policy !== null ? (
        <Link
          href={policy.href}
          data-testid="subject-standing-policy"
          className="text-[11px] text-muted-foreground underline-offset-2 hover:underline"
        >
          {policy.label}
        </Link>
      ) : null}
    </Card>
  );
}
