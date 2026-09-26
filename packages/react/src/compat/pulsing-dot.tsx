import React from "react";
import { cn } from "./utils.js";

interface PulsingDotProps {
  className?: string;
  color?: string;
}

export function PulsingDot({
  className,
  color = "bg-blue-500",
}: PulsingDotProps) {
  return (
    <span className={cn("relative flex h-2 w-2", className)}>
      <span
        className={cn(
          "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
          color,
        )}
      />
      <span
        className={cn("relative inline-flex h-2 w-2 rounded-full", color)}
      />
    </span>
  );
}
