"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@klein-ui/react/compat/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@klein-ui/react/compat/select";
import { cn } from "@klein-ui/react/compat/utils";

interface PaginationControlsProps {
  /** Current page (1-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of items */
  totalCount: number;
  /** Whether there's a next page */
  hasNextPage: boolean;
  /** Whether there's a previous page */
  hasPreviousPage: boolean;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback when page size changes */
  onPageSizeChange: (size: number) => void;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Optional className */
  className?: string;
}

const DEFAULT_PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

/**
 * Generate page numbers with ellipsis for large page counts.
 * Shows max 5 page numbers: first, last, current, and neighbors.
 */
function generatePageNumbers(
  current: number,
  total: number,
): Array<number | "..."> {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: Array<number | "..."> = [];

  // Always show first page
  pages.push(1);

  // Determine middle range
  const rangeStart = Math.max(2, current - 1);
  const rangeEnd = Math.min(total - 1, current + 1);

  // Add ellipsis if gap exists
  if (rangeStart > 2) {
    pages.push("...");
  }

  // Add middle pages
  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(i);
  }

  // Add ellipsis if gap exists
  if (rangeEnd < total - 1) {
    pages.push("...");
  }

  // Always show last page
  if (total > 1) {
    pages.push(total);
  }

  return pages;
}

export function PaginationControls({
  page,
  pageSize,
  totalCount,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  className,
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  // Generate page numbers to display (max 5 with ellipsis)
  const pageNumbers = generatePageNumbers(page, totalPages);

  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 bg-background flex items-center justify-between border-t px-4 py-3",
        className,
      )}
    >
      {/* Left: Item count */}
      <div className="text-muted-foreground text-sm">
        {totalCount === 0 ? (
          "No items"
        ) : (
          <>
            <span className="font-medium">{startItem}</span>
            {" - "}
            <span className="font-medium">{endItem}</span>
            {" of "}
            <span className="font-medium">{totalCount}</span>
          </>
        )}
      </div>

      {/* Center: Page numbers */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPreviousPage}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pageNumbers.map((pageNum, idx) =>
          pageNum === "..." ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-2 text-sm text-stone-400"
            >
              ...
            </span>
          ) : (
            <Button
              key={pageNum}
              variant={pageNum === page ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8 text-sm"
              onClick={() => onPageChange(pageNum as number)}
            >
              {pageNum}
            </Button>
          ),
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Right: Page size selector */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm">Rows:</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSizeChange(Number(v))}
        >
          <SelectTrigger className="h-8 w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
