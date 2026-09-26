import * as React from "react";

import { cn } from "./utils.js";

/**
 * Main container for a layered card.
 */
const LayeredCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("layered-container", className)} {...props}>
    {children}
  </div>
));
LayeredCard.displayName = "LayeredCard";

/**
 * Header container for a layered card.
 */
const LayeredCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("layered-header", className)} {...props}>
    {children}
  </div>
));
LayeredCardHeader.displayName = "LayeredCardHeader";

/**
 * Header left section (icon + title).
 */
const LayeredCardHeaderContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("layered-header-content", className)} {...props}>
    {children}
  </div>
));
LayeredCardHeaderContent.displayName = "LayeredCardHeaderContent";

/**
 * Header icon.
 */
const LayeredCardIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("layered-header-icon", className)} {...props}>
    {children}
  </div>
));
LayeredCardIcon.displayName = "LayeredCardIcon";

/**
 * Header title.
 */
const LayeredCardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("layered-header-title", className)} {...props}>
    {children}
  </div>
));
LayeredCardTitle.displayName = "LayeredCardTitle";

/**
 * Header trailing actions.
 */
const LayeredCardHeaderActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("layered-header-actions", className)} {...props}>
    {children}
  </div>
));
LayeredCardHeaderActions.displayName = "LayeredCardHeaderActions";

/**
 * Content area for a layered card.
 */
interface LayeredCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
  containerClassName?: string;
}

const LayeredCardContent = React.forwardRef<
  HTMLDivElement,
  LayeredCardContentProps
>(
  (
    { className, containerClassName, noPadding = false, children, ...props },
    ref,
  ) => (
    <div className={cn("layered-content", containerClassName)}>
      <div
        ref={ref}
        className={cn(!noPadding && "layered-content-padded", className)}
        {...props}
      >
        {children}
      </div>
    </div>
  ),
);
LayeredCardContent.displayName = "LayeredCardContent";

/**
 * Footer container for a layered card.
 */
interface LayeredCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "actions";
}

const LayeredCardFooter = React.forwardRef<
  HTMLDivElement,
  LayeredCardFooterProps
>(({ className, variant = "default", children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "layered-footer",
      variant === "actions" && "p-1.5",
      className,
    )}
    {...props}
  >
    {children}
  </div>
));
LayeredCardFooter.displayName = "LayeredCardFooter";

/**
 * Footer leading section for actions.
 */
const LayeredCardFooterActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("layered-footer-actions", className)} {...props}>
    {children}
  </div>
));
LayeredCardFooterActions.displayName = "LayeredCardFooterActions";

/**
 * Footer trailing section (metadata).
 */
const LayeredCardMeta = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("layered-footer-meta", className)} {...props}>
    {children}
  </div>
));
LayeredCardMeta.displayName = "LayeredCardMeta";

export {
  LayeredCard,
  LayeredCardContent,
  LayeredCardFooter,
  LayeredCardFooterActions,
  LayeredCardHeader,
  LayeredCardHeaderActions,
  LayeredCardHeaderContent,
  LayeredCardIcon,
  LayeredCardMeta,
  LayeredCardTitle,
};
