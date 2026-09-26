"use client";

/**
 * ToolbarSelect — the one consistent value-based dropdown used by Table's
 * first-class toolbar controls (the data "view" pivot and the data-source
 * selector). Mirrors DisplayControl's shape (icon · current label · chevron)
 * so every page's toolbar reads identically.
 *
 * Controlled: it renders `value` exactly as given and never defaults the
 * selection to `options[0]` — the owning page holds the state.
 */

import { ChevronDown, Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@klein-ui/react/compat/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@klein-ui/react/compat/dropdown-menu";
import { cn } from "@klein-ui/react/compat/utils";
export interface ToolbarControlOption {
  value: string;
  label: string;
  icon?: LucideIcon;
  locked?: boolean;
}
import { toolbarTrigger } from "./toolbar-button-styles.js";

interface ToolbarSelectProps {
  value: string;
  options: ToolbarControlOption[];
  onChange: (value: string) => void;
  /** Optional muted prefix, e.g. "View" or "Source". */
  label?: string;
  /** Icon shown when the current option has none of its own. */
  defaultIcon?: LucideIcon;
  /** Dropdown width class. */
  menuWidth?: string;
}

export function ToolbarSelect({
  value,
  options,
  onChange,
  label,
  defaultIcon: DefaultIcon,
  menuWidth = "w-44",
}: ToolbarSelectProps) {
  const current = options.find((o) => o.value === value);
  const CurrentIcon = current?.icon ?? DefaultIcon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={toolbarTrigger}>
          {CurrentIcon ? <CurrentIcon className="h-3.5 w-3.5" /> : null}
          {label ? (
            <span className="text-muted-foreground">{label}</span>
          ) : null}
          <span>{current?.label ?? value}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className={menuWidth}>
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onChange(option.value)}
              className={cn(
                "gap-2 text-xs",
                value === option.value &&
                  "bg-stone-100 font-medium dark:bg-stone-800",
                option.locked && "text-muted-foreground",
              )}
            >
              {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
              <span className="flex-1">{option.label}</span>
              {option.locked ? (
                <Lock className="h-3 w-3 shrink-0 opacity-70" />
              ) : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
