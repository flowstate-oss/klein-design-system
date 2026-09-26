"use client";

import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@klein-ui/react/compat/tooltip";
import { cn } from "@klein-ui/react/compat/utils";
import { useTableLabels } from "./labels.js";
type PlanChangeStatus = "ADDED" | "MODIFIED" | "DELETED";

/**
 * Plan change status from the server. These match the GraphQL PlanChangeStatus enum:
 * - ADDED: Entity was created in this scenario (no live correlation)
 * - MODIFIED: Entity was copied from live and modified in this scenario
 * - DELETED: Entity was marked for deletion in this scenario
 */
export type ChangeStatus = PlanChangeStatus | null;

interface ChangeStatusIndicatorProps {
  status: ChangeStatus;
  className?: string;
}

const statusConfig = {
  ADDED: {
    icon: Plus,
    labelKey: "shared.changeStatus.added" as const,
    className: "text-emerald-600 dark:text-emerald-400",
  },
  MODIFIED: {
    icon: Pencil,
    labelKey: "shared.changeStatus.modified" as const,
    className: "text-blue-600 dark:text-blue-400",
  },
  DELETED: {
    icon: Trash2,
    labelKey: "shared.changeStatus.deleted" as const,
    className: "text-red-600 dark:text-red-400",
  },
};

export function ChangeStatusIndicator({
  status,
  className,
}: ChangeStatusIndicatorProps) {
  const t = useTableLabels();
  if (!status) return null;

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Icon
          className={cn(
            "h-3.5 w-3.5 flex-shrink-0",
            config.className,
            className,
          )}
        />
      </TooltipTrigger>
      <TooltipContent side="top">{t(config.labelKey)}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Returns the appropriate row background class based on change status
 */
export function getChangeStatusRowClass(status: ChangeStatus): string {
  if (!status) return "";
  const classes = {
    ADDED: "bg-emerald-50/50 dark:bg-emerald-950/20",
    MODIFIED: "bg-blue-50/50 dark:bg-blue-950/20",
    DELETED: "bg-red-50/50 dark:bg-red-950/20 opacity-60",
  };
  return classes[status];
}
