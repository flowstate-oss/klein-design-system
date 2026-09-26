"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger } from "./tabs.js";
import { cn } from "./utils.js";

export type TimePeriod = "last30" | "reporting";

export interface TimePeriodTabsProps {
  value: TimePeriod;
  onChange: (value: TimePeriod) => void;
  reportingLabel?: string;
  className?: string;
}

/**
 * Compact tabs for switching between "Last 30 days" and a custom reporting period.
 * Designed to fit in card headers alongside titles.
 */
export function TimePeriodTabs({
  value,
  onChange,
  reportingLabel = "Reporting Period",
  className,
}: TimePeriodTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as TimePeriod)}
      className={cn("shrink-0", className)}
    >
      <TabsList className="h-7 p-0.5">
        <TabsTrigger value="last30" className="h-6 px-2 text-xs">
          Last 30 days
        </TabsTrigger>
        <TabsTrigger value="reporting" className="h-6 px-2 text-xs">
          {reportingLabel}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
