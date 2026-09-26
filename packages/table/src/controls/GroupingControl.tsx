"use client";

import { Layers, ChevronDown } from "lucide-react";
import { Button } from "@klein-ui/react/compat/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@klein-ui/react/compat/dropdown-menu";
import { cn } from "@klein-ui/react/compat/utils";
import { toolbarTrigger } from "./toolbar-button-styles.js";

export interface GroupingOption<T extends string> {
  value: T;
  label: string;
}

interface GroupingControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: GroupingOption<T>[];
  noneValue: T;
}

export function GroupingControl<T extends string>({
  value,
  onChange,
  options,
  noneValue,
}: GroupingControlProps<T>) {
  const hasGrouping = value !== noneValue;
  const currentLabel = options.find((o) => o.value === value)?.label || "None";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(toolbarTrigger, hasGrouping && "text-foreground")}
        >
          <Layers className="h-3.5 w-3.5" />
          {currentLabel}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Group by
        </DropdownMenuLabel>
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "text-xs",
              value === option.value && "bg-muted font-medium",
            )}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
