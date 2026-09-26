import { cn } from "./utils.js";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /**
   * Optional media rendered where the icon goes, above the title — e.g. a row
   * of provider logos that shows what the empty state is asking for. Renders
   * after the icon when both are given.
   */
  media?: ReactNode;
  /**
   * Visual treatment.
   *
   * - `'default'` — full-canvas placeholder: dashed border, generous padding,
   *   prominent centred title. For page/list-level empties.
   * - `'inline'` — quiet, compact, borderless: muted `text-sm` copy with
   *   minimal padding. For empties INSIDE dense panels (dashboard quadrants,
   *   table bodies) where the default's prominence would fight the density
   *   mandate.
   */
  variant?: "default" | "inline";
}

/**
 * Empty state component for displaying when no content is available.
 *
 * The default variant provides a centered layout with optional icon, title,
 * description, and action button, using a dashed border to indicate
 * placeholder status. The `inline` variant is a quiet, compact treatment for
 * dense in-panel empties (no border, muted small text).
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={Users}
 *   title="No members found"
 *   description="Add your first team member to get started"
 *   action={<Button>Add Member</Button>}
 * />
 *
 * // Inside a dense dashboard panel:
 * <EmptyState variant="inline" title="Nothing overdue." />
 * ```
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  media,
  variant = "default",
}: EmptyStateProps) {
  if (variant === "inline") {
    return (
      <div className={cn("flex flex-col gap-1 p-4", className)}>
        {Icon && (
          <Icon className="text-muted-foreground h-4 w-4" aria-hidden="true" />
        )}
        {media && <div data-testid="empty-state-media">{media}</div>}
        <p className="text-muted-foreground text-sm">{title}</p>
        {description && (
          <p className="text-muted-foreground text-xs">{description}</p>
        )}
        {action && <div className="mt-2">{action}</div>}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center",
        className,
      )}
    >
      {Icon && (
        <Icon className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
      )}
      {media && (
        <div className="mb-4" data-testid="empty-state-media">
          {media}
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-muted-foreground mt-2 max-w-md text-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
