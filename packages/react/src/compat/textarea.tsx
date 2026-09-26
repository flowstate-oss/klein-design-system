import * as React from "react";

import { cn } from "./utils.js";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "border-input placeholder:text-muted-foreground flex min-h-[60px] w-full border bg-tint px-3 py-2 text-base focus-visible:border-klein-600 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-line disabled:text-muted-foreground disabled:opacity-100 md:text-sm",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
