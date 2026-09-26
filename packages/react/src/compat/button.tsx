import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils.js";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors duration-150 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-ink text-white hover:bg-gray-800 font-semibold",
        "primary-ink": "bg-ink text-white hover:bg-gray-800 font-semibold",
        "primary-klein":
          "bg-klein-600 text-white hover:bg-klein-700 font-semibold",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-klein-600 bg-transparent text-klein-600 hover:bg-klein-50",
        secondary:
          "border border-klein-600 bg-transparent text-klein-600 hover:bg-klein-50",
        tertiary: "bg-tint text-ink hover:bg-line",
        ghost: "bg-transparent text-ink hover:bg-tint",
        function:
          "border border-dashed border-line bg-transparent text-muted-foreground hover:border-klein-600 hover:text-klein-600 hover:bg-klein-50",
        "plan-action":
          "btn-plan-action border border-dashed border-line bg-transparent text-muted-foreground hover:border-klein-600 hover:text-klein-600 hover:bg-klein-50",
        link: "text-klein-600 underline-offset-4 hover:text-klein-800 hover:underline",
        text: "text-klein-600 underline-offset-4 hover:text-klein-800 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
