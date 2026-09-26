import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils.js";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        /* Default/info: subtle left border accent */
        default:
          "bg-background text-foreground border-l-[3px] border-l-foreground/20",
        /* Destructive: red left border accent */
        destructive:
          "border-destructive/50 text-destructive [&>svg]:text-destructive border-l-[3px] border-l-red-500",
        /* Success: emerald left border accent */
        success:
          "bg-background text-foreground [&>svg]:text-emerald-500 border-l-[3px] border-l-emerald-500",
        /* Warning: amber left border accent */
        warning:
          "bg-background text-foreground [&>svg]:text-amber-500 border-l-[3px] border-l-amber-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 leading-none font-medium tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
