"use client";

import { ArrowUpDown, ChevronDown } from "lucide-react";
import { Button } from "@klein-ui/react/compat/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@klein-ui/react/compat/dropdown-menu";
import { cn } from "@klein-ui/react/compat/utils";

export interface SortOption<T extends string> {
  value: T;
  label: string;
}

export interface SortControlProps<T extends string> {
  labels: { label: string; ascending: string; descending: string };
  sortBy: T;
  sortDir: "asc" | "desc";
  onSortByChange: (value: T) => void;
  onSortDirToggle: () => void;
  options: SortOption<T>[];
}

export function SortControl<T extends string>({
  labels,
  sortBy,
  sortDir,
  onSortByChange,
  onSortDirToggle,
  options,
}: SortControlProps<T>) {
  const sortLabel = options.find((o) => o.value === sortBy)?.label || "Sort";
  const dirIndicator = sortDir === "asc" ? "↑" : "↓";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
          <ArrowUpDown className="h-3.5 w-3.5" />
          {sortLabel} {dirIndicator}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {labels.label}
        </DropdownMenuLabel>
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onSortByChange(option.value)}
            className={cn(
              "text-xs",
              sortBy === option.value && "bg-muted font-medium",
            )}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSortDirToggle} className="text-xs">
          {sortDir === "asc" ? labels.descending : labels.ascending}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
