"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@klein-ui/react/compat/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@klein-ui/react/compat/dropdown-menu";
import { cn } from "@klein-ui/react/compat/utils";
import type { LucideIcon } from "lucide-react";
import { toolbarTrigger } from "./toolbar-button-styles.js";

export interface DisplayOption<T extends string> {
  value: T;
  label: string;
  icon: LucideIcon;
}

interface DisplayControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: DisplayOption<T>[];
}

export function DisplayControl<T extends string>({
  value,
  onChange,
  options,
}: DisplayControlProps<T>) {
  const currentOption =
    options.find((opt) => opt.value === value) || options[0];
  const CurrentIcon = currentOption.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={toolbarTrigger}>
          <CurrentIcon className="h-3.5 w-3.5" />
          {currentOption.label}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-36">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onChange(option.value)}
              className={cn(
                "gap-2 text-xs",
                value === option.value &&
                  "bg-stone-100 dark:bg-stone-800 font-medium",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {option.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
