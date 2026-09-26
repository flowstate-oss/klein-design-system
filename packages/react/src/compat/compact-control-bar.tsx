"use client";

import {
  ChevronDown,
  Calendar,
  CalendarDays,
  CalendarRange,
  CalendarClock,
  User,
  TrendingUp,
  DollarSign,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu.js";
import { Button } from "./button.js";
import { ButtonGroup } from "./button-group.js";

export type ZoomLevel = "week" | "month" | "quarter" | "year";
export type OrderingOption = "name" | "fte" | "salary" | "team";

export interface VisibleColumns {
  fte: boolean;
  salary: boolean;
}

export interface CompactControlBarProps {
  // Ordering
  ordering?: OrderingOption;
  onOrderingChange?: (ordering: OrderingOption) => void;

  // Properties (visible columns) - simplified to FTE and Salary only
  visibleColumns?: VisibleColumns;
  onVisibleColumnsChange?: (columns: VisibleColumns) => void;

  // Zoom (for forecast view)
  zoom?: ZoomLevel;
  onZoomChange?: (zoom: ZoomLevel) => void;

  // RBAC - hide salary controls if user doesn't have permission
  canViewSalaries?: boolean;

  className?: string;
}

/**
 * Compact Control Bar Component
 *
 * Simplified control bar for forecast view using button-group component.
 * Format: [ Zoom | Sort by | Properties ]
 */
export function CompactControlBar({
  ordering = "name",
  onOrderingChange,
  visibleColumns = { fte: true, salary: false },
  onVisibleColumnsChange,
  zoom = "month",
  onZoomChange,
  canViewSalaries = false,
  className = "",
}: CompactControlBarProps) {
  const orderingLabels: Record<OrderingOption, string> = {
    name: "Name",
    fte: "FTE",
    salary: "Salary",
    team: "Team Name",
  };

  const zoomLabels: Record<ZoomLevel, string> = {
    week: "Weekly",
    month: "Monthly",
    quarter: "Quarterly",
    year: "Yearly",
  };

  const getZoomIcon = (zoom: ZoomLevel) => {
    switch (zoom) {
      case "week":
        return <Calendar className="mr-1.5 h-3.5 w-3.5" />;
      case "month":
        return <CalendarDays className="mr-1.5 h-3.5 w-3.5" />;
      case "quarter":
        return <CalendarRange className="mr-1.5 h-3.5 w-3.5" />;
      case "year":
        return <CalendarClock className="mr-1.5 h-3.5 w-3.5" />;
      default:
        return <CalendarDays className="mr-1.5 h-3.5 w-3.5" />;
    }
  };

  const getOrderingIcon = (ordering: OrderingOption) => {
    switch (ordering) {
      case "name":
        return <User className="mr-1.5 h-3.5 w-3.5" />;
      case "fte":
        return <TrendingUp className="mr-1.5 h-3.5 w-3.5" />;
      case "salary":
        return <DollarSign className="mr-1.5 h-3.5 w-3.5" />;
      case "team":
        return <Users className="mr-1.5 h-3.5 w-3.5" />;
      default:
        return <User className="mr-1.5 h-3.5 w-3.5" />;
    }
  };

  return (
    <ButtonGroup className={className}>
      {/* Zoom */}
      {onZoomChange && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 min-w-[100px] justify-between px-2.5 text-xs"
            >
              <div className="flex items-center">
                {getZoomIcon(zoom)}
                <span>{zoomLabels[zoom]}</span>
              </div>
              <ChevronDown className="ml-1.5 h-3.5 w-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onZoomChange("week")}>
              {zoomLabels.week}
              {zoom === "week" && " ✓"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onZoomChange("month")}>
              {zoomLabels.month}
              {zoom === "month" && " ✓"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onZoomChange("quarter")}>
              {zoomLabels.quarter}
              {zoom === "quarter" && " ✓"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onZoomChange("year")}>
              {zoomLabels.year}
              {zoom === "year" && " ✓"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Sort By */}
      {onOrderingChange && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 min-w-[100px] justify-between px-2.5 text-xs"
            >
              <div className="flex items-center">
                {getOrderingIcon(ordering)}
                <span>{orderingLabels[ordering]}</span>
              </div>
              <ChevronDown className="ml-1.5 h-3.5 w-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onOrderingChange("name")}>
              {orderingLabels.name}
              {ordering === "name" && " ✓"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOrderingChange("fte")}>
              {orderingLabels.fte}
              {ordering === "fte" && " ✓"}
            </DropdownMenuItem>
            {canViewSalaries && (
              <DropdownMenuItem onClick={() => onOrderingChange("salary")}>
                {orderingLabels.salary}
                {ordering === "salary" && " ✓"}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onOrderingChange("team")}>
              {orderingLabels.team}
              {ordering === "team" && " ✓"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Properties */}
      {onVisibleColumnsChange && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 min-w-[100px] justify-between px-2.5 text-xs"
            >
              <div className="flex items-center">
                <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                <span>
                  {visibleColumns.fte && visibleColumns.salary
                    ? "FTE + Salary"
                    : "FTE"}
                </span>
              </div>
              <ChevronDown className="ml-1.5 h-3.5 w-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onClick={() =>
                onVisibleColumnsChange({ fte: true, salary: false })
              }
            >
              FTE
              {visibleColumns.fte && !visibleColumns.salary && " ✓"}
            </DropdownMenuItem>
            {canViewSalaries && (
              <DropdownMenuItem
                onClick={() =>
                  onVisibleColumnsChange({ fte: true, salary: true })
                }
              >
                FTE + Salary
                {visibleColumns.fte && visibleColumns.salary && " ✓"}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </ButtonGroup>
  );
}
