"use client";

/**
 * IdentityStrip — top "orientation rail" of the Subject Detail
 * pattern.
 *
 * Renders, on a single 24px-tall row, the subject's name, an optional
 * secondary descriptor (role / team / service slug) and an optional
 * status pill. NO avatar, NO greeting, NO call-to-action — that is
 * deliberately constrained by `docs/specs/ai-subject-detail-pattern.md`.
 *
 * Persona is a CTO/CFO scanning a dense surface; the strip exists so the
 * viewer never loses orientation when scrolling through the standing
 * card and tabs below.
 */

import { cn } from "../compat/utils.js";

/**
 * Status semantics for the optional trailing pill.
 *
 *   - 'neutral'  — informational ("Linked", "Active service account")
 *   - 'good'     — green-tinted ("On track")
 *   - 'warn'     — amber-tinted ("Action required")
 *   - 'bad'      — rose-tinted ("Unlinked", "Suspended")
 */
export type SubjectIdentityStatus = "neutral" | "good" | "warn" | "bad";

const STATUS_STYLES: Record<SubjectIdentityStatus, string> = {
  neutral: "bg-muted text-muted-foreground",
  good: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  warn: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  bad: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
};

export interface IdentityStripProps {
  /** Subject's display name. Required — this is the orientation anchor. */
  name: string;
  /** Optional secondary descriptor (role, team, slug). Shown in muted text. */
  secondary?: string | null;
  /** Optional contact line — usually the linked email. Shown in mono. */
  email?: string | null;
  /** Optional trailing status pill. Omit to suppress entirely. */
  status?: {
    label: string;
    tone: SubjectIdentityStatus;
  } | null;
  /** Extra class names — escape hatch for layout. */
  className?: string;
}

/**
 * Renders the orientation strip. Strictly flat, h-6, gap-3 between
 * segments per the spec.
 */
export function IdentityStrip({
  name,
  secondary = null,
  email = null,
  status = null,
  className,
}: IdentityStripProps): React.JSX.Element {
  return (
    <header
      data-testid="subject-identity-strip"
      className={cn("flex h-6 items-center gap-3 text-xs", className)}
    >
      <span
        data-testid="subject-identity-name"
        className="truncate text-sm font-semibold text-foreground"
      >
        {name}
      </span>
      {secondary !== null && secondary !== "" ? (
        <span
          data-testid="subject-identity-secondary"
          className="truncate text-muted-foreground"
        >
          {secondary}
        </span>
      ) : null}
      {email !== null && email !== "" ? (
        <span
          data-testid="subject-identity-email"
          className="truncate font-mono text-[11px] text-muted-foreground"
        >
          {email}
        </span>
      ) : null}
      {status !== null ? (
        <span
          data-testid="subject-identity-status"
          data-tone={status.tone}
          className={cn(
            "ml-auto inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
            STATUS_STYLES[status.tone],
          )}
        >
          {status.label}
        </span>
      ) : null}
    </header>
  );
}
