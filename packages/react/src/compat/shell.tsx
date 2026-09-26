"use client";
import {
  useCallback,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { PanelLeft } from "lucide-react";
import { Button } from "./button.js";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip.js";
import { cn } from "./utils.js";
const MIN_DETAILS_WIDTH = 320;
const MAX_DETAILS_WIDTH = 600;
export const HEADER_TOOLBAR_BUTTON_CLASS =
  "border-line bg-paper text-ink hover:bg-tint relative h-10 border dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800";

export interface ShellSidebarState {
  sidebarRef: RefObject<HTMLElement | null>;
  sidebarOpen: boolean;
  sidebarWidth: number;
  toggleSidebar: () => void;
  handleMouseDown: (e: ReactMouseEvent) => void;
}

export function ShellSidebar({
  state,
  className,
  children,
}: {
  state: ShellSidebarState;
  className?: string;
  children: ReactNode;
}) {
  const { sidebarRef, sidebarOpen, sidebarWidth, handleMouseDown } = state;
  return (
    <aside
      ref={sidebarRef}
      className={cn(
        "bg-sidebar relative flex h-full shrink-0 flex-col",
        sidebarOpen
          ? ""
          : "w-0 overflow-hidden transition-[width] duration-300 ease-[var(--ease-tech)]",
        className,
      )}
      style={{ width: sidebarOpen ? sidebarWidth : 0 }}
    >
      <div className="flex h-full flex-col" style={{ width: sidebarWidth }}>
        {children}
      </div>
      {sidebarOpen && (
        <div
          className="hover:bg-primary/20 active:bg-primary/30 absolute top-0 right-0 h-full w-1 cursor-col-resize"
          onMouseDown={handleMouseDown}
        />
      )}
    </aside>
  );
}

export function ShellSidebarToggle({
  id,
  onToggle,
  label,
}: {
  id: string;
  onToggle: () => void;
  label: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          id={id}
          aria-label={label}
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={HEADER_TOOLBAR_BUTTON_CLASS}
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function ShellTitle({ children }: { children: ReactNode }) {
  return <div className="text-[13px] font-semibold">{children}</div>;
}

export function ShellTitleBar({
  toggleLabel,
  onToggleSidebar,
  leading,
  trailing,
  className,
}: {
  toggleLabel: string;
  onToggleSidebar: () => void;
  leading: ReactNode;
  trailing: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "bg-sidebar flex h-12 shrink-0 items-center justify-between px-2",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <ShellSidebarToggle
          id="sidebar-toggle"
          onToggle={onToggleSidebar}
          label={toggleLabel}
        />
        {leading}
      </div>
      {trailing}
    </header>
  );
}

export function ShellDetailsPanel({
  open: detailsOpen,
  width: detailsWidth,
  onWidthChange: setDetailsWidth,
  children,
}: {
  open: boolean;
  width: number;
  onWidthChange: (width: number) => void;
  children: ReactNode;
}) {
  const detailsRef = useRef<HTMLElement>(null);
  const isResizingDetails = useRef(false);
  const [isResizingDetailsState, setIsResizingDetailsState] = useState(false);

  const handleDetailsMouseDown = useCallback(
    (e: ReactMouseEvent) => {
      e.preventDefault();
      isResizingDetails.current = true;
      setIsResizingDetailsState(true);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const panel = detailsRef.current;
        if (!isResizingDetails.current || panel === null) return;
        const rect = panel.getBoundingClientRect();
        const newWidth = Math.min(
          MAX_DETAILS_WIDTH,
          Math.max(MIN_DETAILS_WIDTH, rect.right - moveEvent.clientX),
        );
        panel.style.width = `${newWidth}px`;
        const innerDiv = panel.firstElementChild;
        if (innerDiv instanceof HTMLElement)
          innerDiv.style.width = `${newWidth}px`;
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        const panel = detailsRef.current;
        if (isResizingDetails.current && panel !== null) {
          isResizingDetails.current = false;
          setIsResizingDetailsState(false);
          document.body.style.cursor = "";
          document.body.style.userSelect = "";
          const rect = panel.getBoundingClientRect();
          const finalWidth = Math.min(
            MAX_DETAILS_WIDTH,
            Math.max(MIN_DETAILS_WIDTH, rect.right - upEvent.clientX),
          );
          setDetailsWidth(finalWidth);
        }
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [setDetailsWidth],
  );

  return (
    <aside
      ref={detailsRef}
      data-entity-details=""
      className={cn(
        "bg-background relative flex h-full shrink-0 flex-col border-l",
        !isResizingDetailsState &&
          "transition-[width] duration-500 ease-[var(--ease-motion)]",
        detailsOpen ? "" : "w-0 overflow-hidden border-l-0",
      )}
      style={{ width: detailsOpen ? detailsWidth : 0 }}
    >
      <div className="flex h-full flex-col" style={{ width: detailsWidth }}>
        {children}
      </div>
      {detailsOpen && (
        <div
          className="hover:bg-primary/20 active:bg-primary/30 absolute top-0 left-0 h-full w-1 cursor-col-resize"
          onMouseDown={handleDetailsMouseDown}
        />
      )}
    </aside>
  );
}

export function ShellBody({
  details,
  top,
  overlay,
  children,
}: {
  details: ReactNode;
  top: ReactNode;
  overlay: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="bg-background relative flex min-h-0 flex-1 overflow-hidden border-t border-l transition-colors duration-500">
      <div className="flex min-w-0 flex-1 flex-col">
        {top}
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
      {details}
      {overlay}
    </div>
  );
}
