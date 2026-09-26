import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils.js";

const badgeVariants = cva(
  "inline-flex items-center border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-klein-600",
  {
    variants: {
      variant: {
        default: "border-line bg-tint text-ink",
        secondary: "border-klein-100 bg-klein-50 text-klein-700",
        destructive: "border-bad-tint bg-bad-tint text-bad",
        outline: "border-line bg-paper text-ink",
        good: "border-good-tint bg-good-tint text-good",
        watch: "border-watch-tint bg-watch-tint text-watch",
        bad: "border-bad-tint bg-bad-tint text-bad",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
