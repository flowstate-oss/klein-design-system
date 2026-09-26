import * as React from "react";
import { LucideIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "./tabs.js";

export interface ViewOption<T extends string = string> {
  value: T;
  label: string;
  icon: LucideIcon;
}

export interface ViewToggleProps<T extends string = string> {
  value: T;
  onValueChange: (value: T) => void;
  options: ViewOption<T>[];
  className?: string;
}

export function ViewToggle<T extends string = string>({
  value,
  onValueChange,
  options,
  className,
}: ViewToggleProps<T>) {
  const handleValueChange = (v: string) => {
    onValueChange(v as T);
  };

  return (
    <Tabs value={value} onValueChange={handleValueChange} className={className}>
      <TabsList>
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <TabsTrigger
              key={option.value}
              value={option.value}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              {option.label}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
