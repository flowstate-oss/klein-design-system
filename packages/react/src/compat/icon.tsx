import { cn } from "./utils.js";
import { type LucideProps } from "lucide-react";
import { type ComponentType } from "react";

interface IconProps extends Omit<LucideProps, "ref"> {
  iconNode: ComponentType<LucideProps>;
}

/**
 * Wrapper for Lucide icons with consistent sizing and styling.
 *
 * Applies default 4x4 size with className override support.
 *
 * @param props - Icon props
 * @param props.iconNode - Lucide icon component to render
 * @param props.className - Additional CSS classes
 */
export function Icon({
  iconNode: IconComponent,
  className,
  ...props
}: IconProps) {
  return <IconComponent className={cn("h-4 w-4", className)} {...props} />;
}
