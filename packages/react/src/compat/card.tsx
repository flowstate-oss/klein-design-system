/**
 * @deprecated **Do NOT use `Card` in new code.** (2026-06-12)
 *
 * Flowstate is a high-density, edge-to-edge data tool — padded, rounded,
 * shadowed boxes fight that. Card-shaped layouts are the #1 recurring design
 * regression, so the whole family is deprecated. Use instead:
 *
 * - **Chart / metric panel inside a `ViewLayout` grid** → `ViewSection`
 *   (`@/components/view`). Flat, hairline-bordered, no shadow.
 * - **Answer-first / narrative dashboard** → full-width hairline BANDS, not
 *   boxes (see `@/components/insights/DashboardBand` — `divide-y` stack,
 *   `SplitBand` for side-by-side halves).
 * - **Zero-data placeholder** → `EmptyState` (`./empty-state.js`).
 * - **Entity detail** → the canonical `EntityDrawer` / `EntityDetailLayout`.
 *
 * Existing call sites keep working (this file stays until they're migrated)
 * but every PR that touches one should replace it. The shadow exemption in
 * CLAUDE.md §2 ("no shadows except Card and PropertyPill") describes the
 * legacy tail, not a licence for new cards.
 */

import * as React from "react";

import { cn } from "./utils.js";

/** @deprecated Use `ViewSection`, a band layout, or `EmptyState` — see the module doc above. */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card"
    className={cn(
      "bg-card text-card-foreground border border-line shadow-none",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

/** @deprecated See the `Card` deprecation — use `ViewSection`'s header or a `BandTitle`. */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 border-b border-line p-4",
      className,
    )}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

/** @deprecated See the `Card` deprecation. */
const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("leading-none font-semibold tracking-[-0.02em]", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

/** @deprecated See the `Card` deprecation. */
const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-body text-sm", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

/** @deprecated See the `Card` deprecation. */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4", className)} {...props} />
));
CardContent.displayName = "CardContent";

/** @deprecated See the `Card` deprecation. */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center border-t border-line p-4", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
