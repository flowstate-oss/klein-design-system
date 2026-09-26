import { Card } from "./card.js";
import { Skeleton } from "./skeleton.js";
import { cn } from "./utils.js";

interface TextSkeletonProps {
  lines?: number;
  className?: string;
  animate?: boolean;
}

/**
 * Renders a multi-line text skeleton for loading states.
 * The last line is shorter to simulate typical text patterns.
 */
export function TextSkeleton({
  lines = 2,
  className = "",
  animate = true,
}: TextSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1
              ? "w-1/2"
              : i % 3 === 0
                ? "w-3/4"
                : i % 3 === 1
                  ? "w-full"
                  : "w-5/6",
            animate && "animate-pulse",
          )}
        />
      ))}
    </div>
  );
}

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
  showHeader?: boolean;
  className?: string;
}

/**
 * Renders a table skeleton with configurable rows and columns.
 * Includes optional header row.
 */
export function TableSkeleton({
  rows = 5,
  cols = 4,
  showHeader = true,
  className = "",
}: TableSkeletonProps) {
  return (
    <div className={cn("w-full", className)}>
      {showHeader && (
        <div className="border-b border-stone-200">
          <div
            className="grid gap-4 px-4 py-3"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {Array.from({ length: cols }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-20" />
            ))}
          </div>
        </div>
      )}
      <div className="divide-y divide-stone-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-4 px-4 py-3"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {Array.from({ length: cols }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className={cn(
                  "h-4",
                  colIndex === 0
                    ? "w-24"
                    : colIndex === cols - 1
                      ? "w-16"
                      : "w-20",
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

interface CardSkeletonProps {
  count?: number;
  showActions?: boolean;
  className?: string;
}

/**
 * Renders card skeletons for loading states.
 * Commonly used for lists of items like team members or plans.
 */
export function CardSkeleton({
  count = 3,
  showActions = true,
  className = "",
}: CardSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
                <div className="mt-2 flex items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            </div>
            {showActions && (
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

interface StatCardSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * Renders statistic card skeletons for dashboards and summaries.
 */
export function StatCardSkeleton({
  count = 3,
  className = "",
}: StatCardSkeletonProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-6">
          <Skeleton className="mb-2 h-4 w-24" />
          <Skeleton className="mb-1 h-8 w-32" />
          <Skeleton className="h-3 w-20" />
        </Card>
      ))}
    </div>
  );
}

interface FormSkeletonProps {
  fields?: number;
  showLabels?: boolean;
  className?: string;
}

/**
 * Renders a form skeleton with fields and labels.
 */
export function FormSkeleton({
  fields = 4,
  showLabels = true,
  className = "",
}: FormSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          {showLabels && <Skeleton className="h-4 w-24" />}
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
    </div>
  );
}

interface ListItemSkeletonProps {
  count?: number;
  showAvatar?: boolean;
  showActions?: boolean;
  className?: string;
}

/**
 * Renders list item skeletons for simple lists.
 */
export function ListItemSkeleton({
  count = 5,
  showAvatar = true,
  showActions = false,
  className = "",
}: ListItemSkeletonProps) {
  return (
    <div className={cn("divide-y divide-stone-200", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            {showAvatar && <Skeleton className="h-10 w-10 rounded-full" />}
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          {showActions && <Skeleton className="h-8 w-16 rounded" />}
        </div>
      ))}
    </div>
  );
}
