"use client";

import * as React from "react";
import { cn } from "./utils.js";

// Lightweight ScrollArea implementation to avoid Radix's compose-refs
// behavior which can trigger render loops in some environments.
// This provides the minimal API this app uses: a root wrapper and a
// viewport that renders children. Styling and overflow are preserved.
const ScrollBar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pointer-events-none", className)} {...props} />
));
ScrollBar.displayName = "ScrollBar";

const ScrollArea = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, style, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    style={style}
    {...props}
  >
    <div className="h-full w-full overflow-auto">{children}</div>
  </div>
));
ScrollArea.displayName = "ScrollArea";

export { ScrollArea, ScrollBar };
