"use client";

import * as React from "react";
import { cn } from "./utils.js";

const Timeline = React.forwardRef<
  HTMLOListElement,
  React.HTMLAttributes<HTMLOListElement>
>(({ className, ...props }, ref) => (
  <ol ref={ref} className={cn("space-y-6", className)} {...props} />
));
Timeline.displayName = "Timeline";

const TimelineItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement> & {
    variant?: "default" | "success" | "warning" | "error";
  }
>(({ className, variant = "default", ...props }, ref) => (
  <li
    ref={ref}
    className={cn("group relative flex gap-4 pb-6", className)}
    {...props}
  />
));
TimelineItem.displayName = "TimelineItem";

const TimelineDot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "success" | "warning" | "error";
  }
>(({ className, variant = "default", children, ...props }, ref) => {
  const variantStyles = {
    default: "bg-blue-500 border-blue-200",
    success: "bg-green-500 border-green-200",
    warning: "bg-yellow-500 border-yellow-200",
    error: "bg-red-500 border-red-200",
  };

  return (
    <div className="flex flex-col items-center pt-1">
      <div
        ref={ref}
        className={cn(
          "border-background relative z-10 flex h-3 w-3 items-center justify-center rounded-full border-4",
          variantStyles[variant],
          className,
        )}
        {...props}
      >
        {children}
      </div>
      <div className="bg-border mt-1 w-px flex-1 group-last:hidden" />
    </div>
  );
});
TimelineDot.displayName = "TimelineDot";

const TimelineContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex-1 space-y-2", className)} {...props} />
));
TimelineContent.displayName = "TimelineContent";

const TimelineHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-between gap-4", className)}
    {...props}
  />
));
TimelineHeader.displayName = "TimelineHeader";

const TimelineTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-foreground text-sm leading-none font-semibold",
      className,
    )}
    {...props}
  />
));
TimelineTitle.displayName = "TimelineTitle";

const TimelineDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-muted-foreground text-sm", className)}
    {...props}
  />
));
TimelineDescription.displayName = "TimelineDescription";

const TimelineTime = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn("text-muted-foreground text-xs", className)}
    {...props}
  />
));
TimelineTime.displayName = "TimelineTime";

export {
  Timeline,
  TimelineItem,
  TimelineDot,
  TimelineContent,
  TimelineHeader,
  TimelineTitle,
  TimelineDescription,
  TimelineTime,
};
