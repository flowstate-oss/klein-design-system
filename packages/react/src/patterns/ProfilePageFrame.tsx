"use client";

/**
 * ProfilePageFrame — vertical layout glue for the Subject Detail
 * pattern. Pages compose:
 *
 *   <ProfilePageFrame
 *     identity={<SubjectIdentityStrip … />}
 *     standing={<SubjectStandingCard … />}
 *     kpis={<SubjectKpiStrip … />}
 *     tabs={<Tabs …><TabsList …>…</TabsList><TabsContent …>…</TabsContent></Tabs>}
 *   />
 *
 * The shell owns spacing (`docs/specs/ai-subject-detail-pattern.md`
 * Vertical rhythm) and nothing else, so individual pages stay
 * declarative. Any of the slots may be omitted — `standing` and `kpis`
 * are optional for surfaces where they don't apply (rare).
 */

import { cn } from "../compat/utils.js";

export interface ProfilePageFrameProps {
  /** Identity strip — always shown, even during loading. */
  identity: React.ReactNode;
  /**
   * Standing card. Omit when the page has no meaningful standing
   * concept (rare — most subject pages do).
   */
  standing?: React.ReactNode;
  /** KPI strip. Omit when the page has no numeric headline. */
  kpis?: React.ReactNode;
  /** Tabs subtree — the `Tabs` primitive plus its `TabsList`/`TabsContent`. */
  tabs: React.ReactNode;
  /** Extra class names — escape hatch for layout. */
  className?: string;
}

/**
 * Layout glue. Renders a single scrollable surface with 16px between
 * sections and 24px between bands.
 */
export function ProfilePageFrame({
  identity,
  standing,
  kpis,
  tabs,
  className,
}: ProfilePageFrameProps): React.JSX.Element {
  return (
    <div
      data-testid="subject-detail-shell"
      className={cn(
        "flex h-full min-h-0 flex-col gap-4 overflow-auto px-6 py-5",
        className,
      )}
    >
      {identity}
      {standing !== undefined ? <div>{standing}</div> : null}
      {kpis !== undefined ? <div className="pt-2">{kpis}</div> : null}
      <div className="flex min-h-0 flex-1 flex-col pt-2">{tabs}</div>
    </div>
  );
}
