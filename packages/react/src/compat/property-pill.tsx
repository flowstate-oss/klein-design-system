"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import { cn } from "./utils.js";

/**
 * PropertyGrid — responsive grid container for compact property fields.
 * Automatically arranges fields in a responsive grid layout.
 */
export function PropertyGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface PropertyPillProps {
  /** Small label above the value */
  label: string;
  /** The displayed value — rendered with mono font for numbers */
  value: string | number | React.ReactNode;
  /** Click handler — enables edit indicator on hover */
  onClick?: () => void;
  /** Use mini variant for inline/table contexts */
  mini?: boolean;
  /** Additional className for the value text */
  valueClassName?: string;
  /** Additional className for the outer container */
  className?: string;
}

/**
 * PropertyPill — compact flat field for displaying modifiable data.
 *
 * Uses the Klein flat surface treatment, Geist Mono for values, and an edit
 * pencil indicator on hover.
 * Automatically styled with dashed borders in Blueprint Mode via
 * the `.blueprint [data-slot="property-pill"]` CSS rule.
 */
export function PropertyPill({
  label,
  value,
  onClick,
  mini = false,
  valueClassName,
  className,
}: PropertyPillProps) {
  const isClickable = Boolean(onClick);

  return (
    <div
      data-slot="property-pill"
      data-property-pill=""
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        isClickable
          ? (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        /* Base styling */
        "border-line group relative border transition-colors duration-150",
        /* Size variants */
        mini ? "bg-background px-2.5 py-1.5" : "bg-card px-3 py-2.5",
        isClickable && ["hover:bg-tint cursor-pointer"],
        className,
      )}
    >
      {/* Edit indicator — fades in on hover when clickable */}
      {isClickable && (
        <Pencil
          className="text-muted-foreground absolute top-1.5 right-1.5 h-3 w-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          aria-hidden="true"
        />
      )}

      {/* Label */}
      <span
        className={cn(
          "text-muted-foreground block font-medium tracking-wider uppercase",
          mini ? "text-[10px]" : "text-[11px]",
        )}
      >
        {label}
      </span>

      {/* Value — uses mono font for numerical data */}
      <span
        className={cn(
          "block font-mono font-semibold tabular-nums",
          mini ? "text-xs" : "text-sm",
          valueClassName,
        )}
      >
        {value}
      </span>
    </div>
  );
}
