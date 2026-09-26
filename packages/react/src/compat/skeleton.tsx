import { cn } from "./utils.js";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("bg-tint animate-pulse", className)} {...props} />;
}

export { Skeleton };
