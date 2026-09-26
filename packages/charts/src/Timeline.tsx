"use client";

import {
  DndContext,
  MouseSensor,
  useDraggable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type {
  DragStartEvent,
  DragMoveEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { useMouse, useThrottle, useWindowScroll } from "@uidotdev/usehooks";
import {
  addDays,
  addMonths,
  differenceInDays,
  differenceInHours,
  differenceInMonths,
  endOfDay,
  endOfMonth,
  format,
  formatDate,
  formatDistance,
  getDate,
  getDaysInMonth,
  isSameDay,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { atom, useAtom } from "jotai";
import throttle from "lodash.throttle";
import { PlusIcon, TrashIcon } from "lucide-react";
import type {
  CSSProperties,
  FC,
  KeyboardEventHandler,
  MouseEventHandler,
  ReactNode,
  RefObject,
} from "react";
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Card } from "@klein-ui/react/compat/card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@klein-ui/react/compat/context-menu";
import { cn } from "@klein-ui/react/compat/utils";

const draggingAtom = atom(false);
const scrollXAtom = atom(0);

export const useGanttDragging = () => useAtom(draggingAtom);
export const useGanttScrollX = () => useAtom(scrollXAtom);

/**
 * Drag handler registry — allows each GanttFeatureItem to register its
 * drag callbacks so a single provider-level DndContext can route events.
 */
export type GanttDragHandlers = {
  onDragStart?: (event: DragStartEvent) => void;
  onDragMove?: (event: DragMoveEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
};

type GanttDragRegistryContextValue = {
  register: (id: string, handlers: GanttDragHandlers) => void;
  unregister: (id: string) => void;
};

const GanttDragRegistryContext = createContext<GanttDragRegistryContextValue>({
  register: () => {},
  unregister: () => {},
});

/**
 * Registers drag handlers for a draggable ID prefix (e.g. a feature ID).
 * The single DndContext in GanttProvider routes events to the matching handler.
 */
export function useGanttDragHandlers(id: string, handlers: GanttDragHandlers) {
  const { register, unregister } = useContext(GanttDragRegistryContext);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    register(id, {
      onDragStart: (e) => handlersRef.current.onDragStart?.(e),
      onDragMove: (e) => handlersRef.current.onDragMove?.(e),
      onDragEnd: (e) => handlersRef.current.onDragEnd?.(e),
    });
    return () => unregister(id);
  }, [id, register, unregister]);
}

export type GanttStatus = {
  id: string;
  name: string;
  color: string;
};

export type GanttFeature = {
  id: string;
  name: string;
  startAt: Date;
  endAt: Date | null;
  status: GanttStatus;
  lane?: string;
};

export type GanttMarkerProps = {
  id: string;
  date: Date;
  label: string;
};

export type Range = "daily" | "monthly" | "quarterly";

export type TimelineData = {
  year: number;
  quarters: {
    months: {
      days: number;
    }[];
  }[];
}[];

export type GanttContextProps = {
  zoom: number;
  range: Range;
  columnWidth: number;
  sidebarWidth: number;
  headerHeight: number;
  rowHeight: number;
  onAddItem: ((date: Date) => void) | undefined;
  placeholderLength: number;
  timelineData: TimelineData;
  ref: RefObject<HTMLDivElement | null> | null;
  scrollToFeature?: (feature: GanttFeature) => void;
};

const getsDaysIn = (range: Range) => {
  let fn = (_date: Date) => 1;

  if (range === "monthly" || range === "quarterly") {
    fn = getDaysInMonth;
  }

  return fn;
};

const getDifferenceIn = (range: Range) => {
  let fn = differenceInDays;

  if (range === "monthly" || range === "quarterly") {
    fn = differenceInMonths;
  }

  return fn;
};

const getInnerDifferenceIn = (range: Range) => {
  let fn = differenceInHours;

  if (range === "monthly" || range === "quarterly") {
    fn = differenceInDays;
  }

  return fn;
};

const getStartOf = (range: Range) => {
  let fn = startOfDay;

  if (range === "monthly" || range === "quarterly") {
    fn = startOfMonth;
  }

  return fn;
};

const getEndOf = (range: Range) => {
  let fn = endOfDay;

  if (range === "monthly" || range === "quarterly") {
    fn = endOfMonth;
  }

  return fn;
};

const getAddRange = (range: Range) => {
  let fn = addDays;

  if (range === "monthly" || range === "quarterly") {
    fn = addMonths;
  }

  return fn;
};

export const getDateByMousePosition = (
  context: GanttContextProps,
  mouseX: number,
) => {
  const timelineStartDate = new Date(context.timelineData[0].year, 0, 1);
  const columnWidth = (context.columnWidth * context.zoom) / 100;
  const offset = Math.floor(mouseX / columnWidth);
  const daysIn = getsDaysIn(context.range);
  const addRange = getAddRange(context.range);
  const month = addRange(timelineStartDate, offset);
  const daysInMonth = daysIn(month);
  const pixelsPerDay = Math.round(columnWidth / daysInMonth);
  const dayOffset = Math.floor((mouseX % columnWidth) / pixelsPerDay);
  const actualDate = addDays(month, dayOffset);

  return actualDate;
};

/** Breathing room to the left of a `start`-anchored chart's first column, in px. */
const ANCHOR_LEAD_IN = 8;

const createInitialTimelineData = (today: Date) => {
  const data: TimelineData = [];

  data.push(
    { year: today.getFullYear() - 1, quarters: new Array(4).fill(null) },
    { year: today.getFullYear(), quarters: new Array(4).fill(null) },
    { year: today.getFullYear() + 1, quarters: new Array(4).fill(null) },
  );

  for (const yearObj of data) {
    yearObj.quarters = new Array(4).fill(null).map((_, quarterIndex) => ({
      months: new Array(3).fill(null).map((_, monthIndex) => {
        const month = quarterIndex * 3 + monthIndex;
        return {
          days: getDaysInMonth(new Date(yearObj.year, month, 1)),
        };
      }),
    }));
  }

  return data;
};

const getOffset = (
  date: Date,
  timelineStartDate: Date,
  context: GanttContextProps,
) => {
  const parsedColumnWidth = (context.columnWidth * context.zoom) / 100;
  const differenceIn = getDifferenceIn(context.range);
  const startOf = getStartOf(context.range);
  const fullColumns = differenceIn(startOf(date), timelineStartDate);

  if (context.range === "daily") {
    return parsedColumnWidth * fullColumns;
  }

  const partialColumns = date.getDate();
  const daysInMonth = getDaysInMonth(date);
  const pixelsPerDay = parsedColumnWidth / daysInMonth;

  return fullColumns * parsedColumnWidth + partialColumns * pixelsPerDay;
};

const getWidth = (
  startAt: Date,
  endAt: Date | null,
  context: GanttContextProps,
) => {
  const parsedColumnWidth = (context.columnWidth * context.zoom) / 100;

  if (!endAt) {
    // Extend open-ended bars to the end of the visible timeline
    const lastYear =
      context.timelineData.at(-1)?.year ?? new Date().getFullYear();
    const timelineEndDate = new Date(lastYear, 11, 31);
    return getWidth(startAt, timelineEndDate, context);
  }

  const differenceIn = getDifferenceIn(context.range);

  if (context.range === "daily") {
    const delta = differenceIn(endAt, startAt);

    return parsedColumnWidth * (delta ? delta : 1);
  }

  const daysInStartMonth = getDaysInMonth(startAt);
  const pixelsPerDayInStartMonth = parsedColumnWidth / daysInStartMonth;

  if (isSameDay(startAt, endAt)) {
    return pixelsPerDayInStartMonth;
  }

  const innerDifferenceIn = getInnerDifferenceIn(context.range);
  const startOf = getStartOf(context.range);

  if (isSameDay(startOf(startAt), startOf(endAt))) {
    return innerDifferenceIn(endAt, startAt) * pixelsPerDayInStartMonth;
  }

  const startRangeOffset = daysInStartMonth - getDate(startAt);
  const endRangeOffset = getDate(endAt);
  const fullRangeOffset = differenceIn(startOf(endAt), startOf(startAt));
  const daysInEndMonth = getDaysInMonth(endAt);
  const pixelsPerDayInEndMonth = parsedColumnWidth / daysInEndMonth;

  return (
    (fullRangeOffset - 1) * parsedColumnWidth +
    startRangeOffset * pixelsPerDayInStartMonth +
    endRangeOffset * pixelsPerDayInEndMonth
  );
};

const calculateInnerOffset = (
  date: Date,
  range: Range,
  columnWidth: number,
) => {
  const startOf = getStartOf(range);
  const endOf = getEndOf(range);
  const differenceIn = getInnerDifferenceIn(range);
  const startOfRange = startOf(date);
  const endOfRange = endOf(date);
  const totalRangeDays = differenceIn(endOfRange, startOfRange);
  const dayOfMonth = date.getDate();

  return (dayOfMonth / totalRangeDays) * columnWidth;
};

export const GanttContext = createContext<GanttContextProps>({
  zoom: 100,
  range: "monthly",
  columnWidth: 50,
  headerHeight: 60,
  sidebarWidth: 300,
  rowHeight: 36,
  onAddItem: undefined,
  placeholderLength: 2,
  timelineData: [],
  ref: null,
  scrollToFeature: undefined,
});

export type GanttContentHeaderProps = {
  renderHeaderItem: (index: number) => ReactNode;
  title: string;
  columns: number;
};

export const GanttContentHeader: FC<GanttContentHeaderProps> = ({
  title,
  columns,
  renderHeaderItem,
}) => {
  const id = useId();

  return (
    <div
      className="bg-backdrop/90 sticky top-0 z-20 grid w-full shrink-0 backdrop-blur-sm"
      style={{ height: "var(--gantt-header-height)" }}
    >
      <div>
        <div
          className="text-muted-foreground sticky inline-flex px-3 py-2 text-xs whitespace-nowrap"
          style={{
            left: "var(--gantt-sidebar-width)",
          }}
        >
          <p>{title}</p>
        </div>
      </div>
      <div
        className="grid w-full"
        style={{
          gridTemplateColumns: `repeat(${columns}, var(--gantt-column-width))`,
        }}
      >
        {Array.from({ length: columns }).map((_, index) => (
          <div
            className="border-border/50 shrink-0 border-b py-1 text-center text-xs"
            key={`${id}-${index}`}
          >
            {renderHeaderItem(index)}
          </div>
        ))}
      </div>
    </div>
  );
};

const DailyHeader: FC = () => {
  const gantt = useContext(GanttContext);

  return gantt.timelineData.map((year) =>
    year.quarters
      .flatMap((quarter) => quarter.months)
      .map((month, index) => (
        <div className="relative flex flex-col" key={`${year.year}-${index}`}>
          <GanttContentHeader
            columns={month.days}
            renderHeaderItem={(item: number) => (
              <div className="flex items-center justify-center gap-1">
                <p>
                  {format(addDays(new Date(year.year, index, 1), item), "d")}
                </p>
                <p className="text-muted-foreground">
                  {format(
                    addDays(new Date(year.year, index, 1), item),
                    "EEEEE",
                  )}
                </p>
              </div>
            )}
            title={format(new Date(year.year, index, 1), "MMMM yyyy")}
          />
          <GanttColumns
            columns={month.days}
            isColumnSecondary={(item: number) =>
              [0, 6].includes(
                addDays(new Date(year.year, index, 1), item).getDay(),
              )
            }
          />
        </div>
      )),
  );
};

const MonthlyHeader: FC = () => {
  const gantt = useContext(GanttContext);

  return gantt.timelineData.map((year) => (
    <div className="relative flex flex-col" key={year.year}>
      <GanttContentHeader
        columns={year.quarters.flatMap((quarter) => quarter.months).length}
        renderHeaderItem={(item: number) => (
          <p>{format(new Date(year.year, item, 1), "MMM")}</p>
        )}
        title={`${year.year}`}
      />
      <GanttColumns
        columns={year.quarters.flatMap((quarter) => quarter.months).length}
      />
    </div>
  ));
};

const QuarterlyHeader: FC = () => {
  const gantt = useContext(GanttContext);

  return gantt.timelineData.map((year) =>
    year.quarters.map((quarter, quarterIndex) => (
      <div
        className="relative flex flex-col"
        key={`${year.year}-${quarterIndex}`}
      >
        <GanttContentHeader
          columns={quarter.months.length}
          renderHeaderItem={(item: number) => (
            <p>
              {format(new Date(year.year, quarterIndex * 3 + item, 1), "MMM")}
            </p>
          )}
          title={`Q${quarterIndex + 1} ${year.year}`}
        />
        <GanttColumns columns={quarter.months.length} />
      </div>
    )),
  );
};

const headers: Record<Range, FC> = {
  daily: DailyHeader,
  monthly: MonthlyHeader,
  quarterly: QuarterlyHeader,
};

export type GanttHeaderProps = {
  className?: string;
};

export const GanttHeader: FC<GanttHeaderProps> = ({ className }) => {
  const gantt = useContext(GanttContext);
  const Header = headers[gantt.range];

  return (
    <div
      className={cn(
        "divide-border/50 flex h-full w-max -space-x-px divide-x",
        className,
      )}
    >
      <Header />
    </div>
  );
};

export type GanttSidebarItemProps = {
  feature: GanttFeature;
  onSelectItem?: (id: string) => void;
  className?: string;
};

export const GanttSidebarItem: FC<GanttSidebarItemProps> = ({
  feature,
  onSelectItem,
  className,
}) => {
  const gantt = useContext(GanttContext);
  const tempEndAt =
    feature.endAt && isSameDay(feature.startAt, feature.endAt)
      ? addDays(feature.endAt, 1)
      : feature.endAt;
  const duration = tempEndAt
    ? formatDistance(feature.startAt, tempEndAt)
    : `${formatDistance(feature.startAt, new Date())} so far`;

  const handleClick: MouseEventHandler<HTMLDivElement> = (event) => {
    if (event.target === event.currentTarget) {
      gantt.scrollToFeature?.(feature);
      onSelectItem?.(feature.id);
    }
  };

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === "Enter") {
      gantt.scrollToFeature?.(feature);
      onSelectItem?.(feature.id);
    }
  };

  return (
    <div
      className={cn(
        "hover:bg-secondary relative flex items-center gap-2.5 p-2.5 text-xs",
        className,
      )}
      key={feature.id}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      style={{
        height: "var(--gantt-row-height)",
      }}
      tabIndex={0}
    >
      <div
        className="pointer-events-none h-2 w-2 shrink-0 rounded-full"
        style={{
          backgroundColor: feature.status.color,
        }}
      />
      <p className="pointer-events-none flex-1 truncate text-left font-medium">
        {feature.name}
      </p>
      <p className="text-muted-foreground pointer-events-none">{duration}</p>
    </div>
  );
};

export const GanttSidebarHeader: FC = () => (
  <div
    className="border-border/50 bg-backdrop/90 text-muted-foreground sticky top-0 z-10 flex shrink-0 items-end justify-between gap-2.5 border-b p-2.5 text-xs font-medium backdrop-blur-sm"
    style={{ height: "var(--gantt-header-height)" }}
  >
    <p className="flex-1 truncate text-left">Projects</p>
    <p className="shrink-0">Duration</p>
  </div>
);

export type GanttSidebarGroupProps = {
  children: ReactNode;
  name: string;
  className?: string;
};

export const GanttSidebarGroup: FC<GanttSidebarGroupProps> = ({
  children,
  name,
  className,
}) => (
  <div className={className}>
    {name && (
      <p
        className="text-muted-foreground w-full truncate p-2.5 text-left text-xs font-medium"
        style={{ height: "var(--gantt-row-height)" }}
      >
        {name}
      </p>
    )}
    <div className="divide-border/50 divide-y">{children}</div>
  </div>
);

export type GanttSidebarProps = {
  children: ReactNode;
  className?: string;
};

export const GanttSidebar: FC<GanttSidebarProps> = ({
  children,
  className,
}) => (
  <div
    className={cn(
      "border-border/50 bg-background/90 sticky left-0 z-30 h-max min-h-full overflow-clip border-r backdrop-blur-md",
      className,
    )}
    data-roadmap-ui="gantt-sidebar"
  >
    <GanttSidebarHeader />
    <div className="space-y-4 pt-4">{children}</div>
  </div>
);

export type GanttAddFeatureHelperProps = {
  top: number;
  className?: string;
};

export const GanttAddFeatureHelper: FC<GanttAddFeatureHelperProps> = ({
  top,
  className,
}) => {
  const [scrollX] = useGanttScrollX();
  const gantt = useContext(GanttContext);
  const [mousePosition, mouseRef] = useMouse<HTMLDivElement>();

  const handleClick = () => {
    const ganttRect = gantt.ref?.current?.getBoundingClientRect();
    const x =
      mousePosition.x - (ganttRect?.left ?? 0) + scrollX - gantt.sidebarWidth;
    const currentDate = getDateByMousePosition(gantt, x);

    gantt.onAddItem?.(currentDate);
  };

  return (
    <div
      className={cn("absolute top-0 w-full px-0.5", className)}
      ref={mouseRef}
      style={{
        marginTop: -gantt.rowHeight / 2,
        transform: `translateY(${top}px)`,
      }}
    >
      <button
        className="flex h-full w-full items-center justify-center rounded-md border border-dashed p-2"
        onClick={handleClick}
        type="button"
      >
        <PlusIcon
          className="text-muted-foreground pointer-events-none select-none"
          size={16}
        />
      </button>
    </div>
  );
};

export type GanttColumnProps = {
  index: number;
  isColumnSecondary?: (item: number) => boolean;
};

export const GanttColumn: FC<GanttColumnProps> = memo(
  ({ index, isColumnSecondary }) => {
    const gantt = useContext(GanttContext);
    const [dragging] = useGanttDragging();
    const [hovering, setHovering] = useState(false);
    const [top, setTop] = useState(0);
    const hasAddItem = Boolean(gantt.onAddItem);

    const handleMouseEnter = useCallback(() => setHovering(true), []);
    const handleMouseLeave = useCallback(() => setHovering(false), []);
    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!hasAddItem) return;
        const rect = e.currentTarget.getBoundingClientRect();
        setTop(e.clientY - rect.top);
      },
      [hasAddItem],
    );

    return (
      <div
        className={cn(
          "group relative h-full overflow-hidden",
          isColumnSecondary?.(index) ? "bg-secondary" : "",
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={hasAddItem ? handleMouseMove : undefined}
      >
        {hasAddItem && !dragging && hovering ? (
          <GanttAddFeatureHelper top={top} />
        ) : null}
      </div>
    );
  },
);

export type GanttColumnsProps = {
  columns: number;
  isColumnSecondary?: (item: number) => boolean;
};

export const GanttColumns: FC<GanttColumnsProps> = memo(
  ({ columns, isColumnSecondary }) => {
    const id = useId();

    return (
      <div
        className="divide divide-border/50 grid h-full w-full divide-x"
        style={{
          gridTemplateColumns: `repeat(${columns}, var(--gantt-column-width))`,
        }}
      >
        {Array.from({ length: columns }).map((_, index) => (
          <GanttColumn
            index={index}
            isColumnSecondary={isColumnSecondary}
            key={`${id}-${index}`}
          />
        ))}
      </div>
    );
  },
);

export type GanttCreateMarkerTriggerProps = {
  onCreateMarker: (date: Date) => void;
  className?: string;
};

export const GanttCreateMarkerTrigger: FC<GanttCreateMarkerTriggerProps> = ({
  onCreateMarker,
  className,
}) => {
  const gantt = useContext(GanttContext);
  const [mousePosition, mouseRef] = useMouse<HTMLDivElement>();
  const [windowScroll] = useWindowScroll();
  const x = useThrottle(
    mousePosition.x -
      (mouseRef.current?.getBoundingClientRect().x ?? 0) -
      (windowScroll.x ?? 0),
    10,
  );

  const date = getDateByMousePosition(gantt, x);

  const handleClick = () => onCreateMarker(date);

  return (
    <div
      className={cn(
        "group pointer-events-none absolute top-0 left-0 h-full w-full overflow-visible select-none",
        className,
      )}
      ref={mouseRef}
    >
      <div
        className="pointer-events-auto sticky top-6 z-20 -ml-2 flex w-4 flex-col items-center justify-center gap-1 overflow-visible opacity-0 group-hover:opacity-100"
        style={{ transform: `translateX(${x}px)` }}
      >
        <button
          className="bg-card z-50 inline-flex h-4 w-4 items-center justify-center rounded-full"
          onClick={handleClick}
          type="button"
        >
          <PlusIcon className="text-muted-foreground" size={12} />
        </button>
        <div className="border-border/50 bg-background/90 text-foreground rounded-full border px-2 py-1 text-xs whitespace-nowrap backdrop-blur-lg">
          {formatDate(date, "MMM dd, yyyy")}
        </div>
      </div>
    </div>
  );
};

export type GanttFeatureDragHelperProps = {
  featureId: GanttFeature["id"];
  direction: "left" | "right";
  date: Date | null;
  costImpact?: {
    costDelta: number;
    percentChange: number;
  } | null;
  onDragActiveChange?: (direction: "left" | "right", isActive: boolean) => void;
};

export const GanttFeatureDragHelper: FC<GanttFeatureDragHelperProps> = ({
  direction,
  featureId,
  date,
  costImpact,
  onDragActiveChange,
}) => {
  const [, setDragging] = useGanttDragging();
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `feature-drag-helper-${direction}-${featureId}`,
  });

  const isPressed = Boolean(attributes["aria-pressed"]);

  useEffect(() => setDragging(isPressed), [isPressed, setDragging]);

  // Notify parent when drag state changes
  useEffect(() => {
    onDragActiveChange?.(direction, isPressed);
  }, [isPressed, direction, onDragActiveChange]);

  const formatCurrency = (amount: number): string => {
    if (Math.abs(amount) >= 1_000_000) {
      return `$${(amount / 1_000_000).toFixed(2)}M`;
    }
    if (Math.abs(amount) >= 1_000) {
      return `$${(amount / 1_000).toFixed(2)}k`;
    }
    return `$${amount.toFixed(0)}`;
  };

  return (
    <div
      className={cn(
        "group absolute top-1/2 z-[3] h-full w-6 -translate-y-1/2 !cursor-col-resize rounded-md outline-none",
        direction === "left" ? "-left-2.5" : "-right-2.5",
      )}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
    >
      <div
        className={cn(
          "bg-muted-foreground absolute top-1/2 h-[80%] w-1 -translate-y-1/2 rounded-sm opacity-0 transition-all",
          direction === "left" ? "left-2.5" : "right-2.5",
          direction === "left" ? "group-hover:left-0" : "group-hover:right-0",
          isPressed && (direction === "left" ? "left-0" : "right-0"),
          "group-hover:opacity-100",
          isPressed && "opacity-100",
        )}
      />
      {date && (
        <div
          className={cn(
            "border-border/50 bg-background/90 text-foreground absolute top-10 hidden -translate-x-1/2 rounded-lg border px-2 py-1.5 text-xs whitespace-nowrap backdrop-blur-lg group-hover:block",
            isPressed && "block",
          )}
        >
          <div className="font-medium">{format(date, "MMM dd, yyyy")}</div>
          {costImpact && costImpact.costDelta !== 0 && (
            <div
              className={cn(
                "mt-0.5 text-xs",
                costImpact.costDelta > 0 ? "text-amber-600" : "text-green-600",
              )}
            >
              {costImpact.costDelta > 0 ? "+" : ""}
              {formatCurrency(Math.abs(costImpact.costDelta))} (
              {costImpact.percentChange > 0 ? "+" : ""}
              {costImpact.percentChange.toFixed(0)}%)
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export type GanttFeatureItemCardProps = Pick<GanttFeature, "id"> & {
  children?: ReactNode;
  costImpact?: {
    costDelta: number;
    percentChange: number;
  } | null;
  newStartDate?: Date | null;
  newEndDate?: Date | null;
  onDragActiveChange?: (isActive: boolean) => void;
  /** When true, renders a fade-out gradient on the right edge to indicate an open-ended/indefinite item */
  isOpenEnded?: boolean;
  /** When true, removes the Card's internal padding so children fill edge-to-edge */
  flat?: boolean;
  /** Click handler fired when the card is clicked without triggering a drag */
  onSelectItem?: (id: string) => void;
};

export const GanttFeatureItemCard: FC<GanttFeatureItemCardProps> = memo(
  ({
    id,
    children,
    costImpact,
    newStartDate,
    newEndDate,
    onDragActiveChange,
    isOpenEnded,
    flat,
    onSelectItem,
  }) => {
    const [, setDragging] = useGanttDragging();
    const { attributes, listeners, setNodeRef } = useDraggable({ id });
    const isPressed = Boolean(attributes["aria-pressed"]);
    // Track whether a drag has occurred between pointerdown and click, so
    // clicks that follow a drag don't also fire the select callback.
    const didDragRef = useRef(false);

    useEffect(() => setDragging(isPressed), [isPressed, setDragging]);

    // Notify parent when drag state changes
    useEffect(() => {
      onDragActiveChange?.(isPressed);
    }, [isPressed, onDragActiveChange]);

    // Mark that a drag occurred so the subsequent click is suppressed
    useEffect(() => {
      if (isPressed) didDragRef.current = true;
    }, [isPressed]);

    const formatCurrency = (amount: number): string => {
      if (Math.abs(amount) >= 1_000_000) {
        return `$${(amount / 1_000_000).toFixed(2)}M`;
      }
      if (Math.abs(amount) >= 1_000) {
        return `$${(amount / 1_000).toFixed(2)}k`;
      }
      return `$${amount.toFixed(0)}`;
    };

    return (
      <Card
        data-gantt-feature={id}
        className={cn(
          "relative h-full w-full rounded-md text-xs",
          flat
            ? "border-0 bg-transparent p-0 shadow-none overflow-visible"
            : "bg-background overflow-hidden p-2",
          onSelectItem && !isPressed && "cursor-pointer",
        )}
      >
        <div
          className={cn(
            "flex h-full w-full items-center justify-between gap-2 text-left",
            isPressed && "cursor-grabbing",
          )}
          {...attributes}
          {...listeners}
          ref={setNodeRef}
          onClick={(e) => {
            if (didDragRef.current) {
              didDragRef.current = false;
              return;
            }
            if (onSelectItem) {
              e.stopPropagation();
              onSelectItem(id);
            }
          }}
        >
          {children}
        </div>
        {isOpenEnded && (
          <div className="from-background/0 via-background/40 to-background/80 pointer-events-none absolute inset-y-0 right-0 flex w-16 items-center justify-end pr-2">
            <span className="text-muted-foreground text-[10px]">→</span>
          </div>
        )}
        {isPressed && (newStartDate || newEndDate) && (
          <div className="border-border/50 bg-background/90 text-foreground absolute -top-14 left-1/2 z-[100] -translate-x-1/2 rounded-lg border px-2 py-1.5 text-xs whitespace-nowrap backdrop-blur-lg">
            <div className="font-medium">
              {newStartDate && format(newStartDate, "MMM dd, yyyy")}
              {newStartDate && newEndDate && " - "}
              {newEndDate && format(newEndDate, "MMM dd, yyyy")}
            </div>
            {costImpact && costImpact.costDelta !== 0 && (
              <div
                className={cn(
                  "mt-0.5 text-xs",
                  costImpact.costDelta > 0
                    ? "text-amber-600"
                    : "text-green-600",
                )}
              >
                {costImpact.costDelta > 0 ? "+" : ""}
                {formatCurrency(Math.abs(costImpact.costDelta))} (
                {costImpact.percentChange > 0 ? "+" : ""}
                {costImpact.percentChange.toFixed(0)}%)
              </div>
            )}
          </div>
        )}
      </Card>
    );
  },
);

export type GanttFeatureItemProps = GanttFeature & {
  onMove?: (id: string, startDate: Date, endDate: Date | null) => void;
  onDragMove?: (id: string, startDate: Date, endDate: Date | null) => void;
  onCalculateCostImpact?: (
    id: string,
    newStartDate: Date,
    newEndDate: Date,
  ) => { costDelta: number; percentChange: number; newCost: number } | null;
  children?: ReactNode;
  className?: string;
  /** When true, removes the Card's internal padding so children fill edge-to-edge */
  flat?: boolean;
  /** Click handler fired when the bar is clicked without triggering a drag */
  onSelectItem?: (id: string) => void;
};

export const GanttFeatureItem: FC<GanttFeatureItemProps> = ({
  onMove,
  onDragMove,
  onCalculateCostImpact,
  children,
  className,
  flat,
  onSelectItem,
  ...feature
}) => {
  const [scrollX] = useGanttScrollX();
  const gantt = useContext(GanttContext);
  const timelineStartDate = useMemo(
    () => new Date(gantt.timelineData.at(0)?.year ?? 0, 0, 1),
    [gantt.timelineData],
  );
  const [startAt, setStartAt] = useState<Date>(feature.startAt);
  const [endAt, setEndAt] = useState<Date | null>(feature.endAt);
  const [costImpact, setCostImpact] = useState<{
    costDelta: number;
    percentChange: number;
  } | null>(null);
  const [activeDragHelper, setActiveDragHelper] = useState<
    "left" | "right" | null
  >(null);
  const [mainBarDragging, setMainBarDragging] = useState(false);
  const [mainBarCostImpact, setMainBarCostImpact] = useState<{
    costDelta: number;
    percentChange: number;
  } | null>(null);

  // Reset local state when feature props change (e.g., when user cancels a drag)
  useEffect(() => {
    setStartAt(feature.startAt);
    setEndAt(feature.endAt);
    setCostImpact(null);
    setMainBarCostImpact(null);
  }, [feature.startAt, feature.endAt, feature.id]);

  // Handle drag helper active state changes
  const handleDragActiveChange = useCallback(
    (direction: "left" | "right", isActive: boolean) => {
      setActiveDragHelper(isActive ? direction : null);
      if (!isActive) {
        setCostImpact(null);
      }
    },
    [],
  );

  // Handle main bar drag active state changes
  const handleMainBarDragActiveChange = useCallback((isActive: boolean) => {
    setMainBarDragging(isActive);
    if (!isActive) {
      setMainBarCostImpact(null);
    }
  }, []);

  const width = useMemo(
    () => getWidth(startAt, endAt, gantt),
    [startAt, endAt, gantt],
  );
  const offset = useMemo(
    () => getOffset(startAt, timelineStartDate, gantt),
    [startAt, timelineStartDate, gantt],
  );

  const addRange = useMemo(() => getAddRange(gantt.range), [gantt.range]);

  // Refs for drag state — avoids re-renders from useMouse
  const dragStartXRef = useRef(0);
  const dragStartAtRef = useRef(startAt);
  const dragEndAtRef = useRef(endAt);

  // Clear cost impact when drag helper is cleared
  useEffect(() => {
    if (!activeDragHelper) {
      setCostImpact(null);
    }
  }, [activeDragHelper]);

  /**
   * Converts a mouse clientX to a Gantt-relative X position suitable for getDateByMousePosition.
   */
  const clientXToGanttX = useCallback(
    (clientX: number): number => {
      const ganttRect = gantt.ref?.current?.getBoundingClientRect();
      return clientX - (ganttRect?.left ?? 0) + scrollX - gantt.sidebarWidth;
    },
    [gantt, scrollX],
  );

  // Register drag handlers with the provider-level DndContext
  useGanttDragHandlers(feature.id, {
    onDragStart: (event) => {
      const draggableId = String(event.active.id);
      // Only the main bar drag needs start tracking
      if (draggableId === feature.id) {
        const mouseEvent = event.activatorEvent as MouseEvent;
        dragStartXRef.current = mouseEvent.clientX;
        dragStartAtRef.current = startAt;
        dragEndAtRef.current = endAt;
      }
    },
    onDragMove: (event) => {
      const draggableId = String(event.active.id);
      const mouseEvent = event.activatorEvent as MouseEvent;
      const currentClientX = mouseEvent.clientX + event.delta.x;

      if (draggableId === feature.id) {
        // Main bar drag — calculate day delta from drag start
        const currentX = clientXToGanttX(currentClientX);
        const originalX = clientXToGanttX(dragStartXRef.current);
        const currentDate = getDateByMousePosition(gantt, currentX);
        const originalDate = getDateByMousePosition(gantt, originalX);
        const delta =
          gantt.range === "daily"
            ? getDifferenceIn(gantt.range)(currentDate, originalDate)
            : getInnerDifferenceIn(gantt.range)(currentDate, originalDate);
        const newStartDate = addDays(dragStartAtRef.current, delta);
        const newEndDate = dragEndAtRef.current
          ? addDays(dragEndAtRef.current, delta)
          : null;

        setStartAt(newStartDate);
        setEndAt(newEndDate);
        onDragMove?.(feature.id, newStartDate, newEndDate);

        if (onCalculateCostImpact && newEndDate) {
          const impact = onCalculateCostImpact(
            feature.id,
            newStartDate,
            newEndDate,
          );
          if (impact) {
            setMainBarCostImpact({
              costDelta: impact.costDelta,
              percentChange: impact.percentChange,
            });
          } else {
            setMainBarCostImpact(null);
          }
        }
      } else if (draggableId === `feature-drag-helper-left-${feature.id}`) {
        // Left resize handle
        const x = clientXToGanttX(currentClientX);
        const newStartAt = getDateByMousePosition(gantt, x);
        setStartAt(newStartAt);

        if (onCalculateCostImpact && endAt) {
          const impact = onCalculateCostImpact(feature.id, newStartAt, endAt);
          if (impact) {
            setCostImpact({
              costDelta: impact.costDelta,
              percentChange: impact.percentChange,
            });
          }
        }
      } else if (draggableId === `feature-drag-helper-right-${feature.id}`) {
        // Right resize handle
        const x = clientXToGanttX(currentClientX);
        const newEndAt = getDateByMousePosition(gantt, x);
        setEndAt(newEndAt);

        if (onCalculateCostImpact) {
          const impact = onCalculateCostImpact(feature.id, startAt, newEndAt);
          if (impact) {
            setCostImpact({
              costDelta: impact.costDelta,
              percentChange: impact.percentChange,
            });
          }
        }
      }
    },
    onDragEnd: () => {
      onMove?.(feature.id, startAt, endAt);
    },
  });

  return (
    <div
      className={cn(
        "relative flex w-max min-w-full",
        flat ? "h-full" : "py-0.5",
        className,
      )}
      style={flat ? undefined : { height: "var(--gantt-row-height)" }}
    >
      <div
        className={cn(
          "pointer-events-auto absolute",
          flat ? "inset-y-0" : "top-0.5",
        )}
        style={{
          ...(flat ? {} : { height: "calc(var(--gantt-row-height) - 4px)" }),
          width: Math.round(width),
          left: Math.round(offset),
        }}
      >
        {onMove && (
          <GanttFeatureDragHelper
            date={startAt}
            direction="left"
            featureId={feature.id}
            costImpact={costImpact}
            onDragActiveChange={handleDragActiveChange}
          />
        )}
        <GanttFeatureItemCard
          id={feature.id}
          costImpact={mainBarCostImpact}
          newStartDate={mainBarDragging ? startAt : null}
          newEndDate={mainBarDragging ? endAt : null}
          onDragActiveChange={handleMainBarDragActiveChange}
          isOpenEnded={!feature.endAt}
          flat={flat}
          onSelectItem={onSelectItem}
        >
          {children ?? (
            <p className="flex-1 truncate text-xs">{feature.name}</p>
          )}
        </GanttFeatureItemCard>
        {onMove && feature.endAt && (
          <GanttFeatureDragHelper
            date={endAt ?? addRange(startAt, 2)}
            direction="right"
            featureId={feature.id}
            costImpact={costImpact}
            onDragActiveChange={handleDragActiveChange}
          />
        )}
      </div>
    </div>
  );
};

export type GanttFeatureListGroupProps = {
  children: ReactNode;
  className?: string;
};

export const GanttFeatureListGroup: FC<GanttFeatureListGroupProps> = memo(
  ({ children, className }) => <div className={className}>{children}</div>,
);

/**
 * Computes the number of sub-rows needed to render features without visual overlap.
 * Features that overlap in time are placed on separate sub-rows.
 */
export function computeSubRowCount(features: GanttFeature[]): number {
  if (features.length === 0) return 1;
  const sorted = [...features].sort(
    (a, b) => a.startAt.getTime() - b.startAt.getTime(),
  );
  const subRowEndTimes: (Date | null)[] = [];

  for (const feature of sorted) {
    let subRow = 0;
    while (
      subRow < subRowEndTimes.length &&
      (subRowEndTimes[subRow] === null ||
        (subRowEndTimes[subRow] !== null &&
          (subRowEndTimes[subRow] ?? feature.startAt) > feature.startAt))
    ) {
      subRow++;
    }
    if (subRow === subRowEndTimes.length) {
      subRowEndTimes.push(feature.endAt);
    } else {
      subRowEndTimes[subRow] = feature.endAt;
    }
  }

  return Math.max(1, subRowEndTimes.length);
}

/** Height of a single sub-row in pixels. */
export const GANTT_SUB_ROW_HEIGHT = 44;

/** Height of the timeline's own header band, in px. */
export const GANTT_HEADER_HEIGHT = 60;

/** The shortest a row may be, however few occupants it holds, in px. */
export const GANTT_ROW_HEIGHT = 60;

/** Padding `GanttFeatureList` puts above its first row, in px. */
export const GANTT_LIST_TOP_PADDING = 16;

/**
 * How tall a row stands: its stack of overlapping bars, or the minimum.
 *
 * The one definition of that arithmetic. A consumer sizing its own sidebar or
 * its pane must call this rather than restate `max(60, n × 44)`, or the two
 * drift and rows clip.
 *
 * @param subRows - Overlapping bars in the row, from `computeSubRowCount`.
 * @returns The row's height in px.
 */
export function ganttRowHeight(subRows: number): number {
  return Math.max(
    GANTT_ROW_HEIGHT,
    Math.max(1, subRows) * GANTT_SUB_ROW_HEIGHT,
  );
}

export type GanttFeatureRowProps = {
  features: GanttFeature[];
  onMove?: (id: string, startAt: Date, endAt: Date | null) => void;
  children?: (feature: GanttFeature) => ReactNode;
  className?: string;
  /** When true, removes the Card's internal padding so bars fill edge-to-edge */
  flat?: boolean;
  /** Click handler fired when a bar is clicked without triggering a drag */
  onSelectItem?: (id: string) => void;
};

export const GanttFeatureRow: FC<GanttFeatureRowProps> = ({
  features,
  onMove,
  children,
  className,
  flat,
  onSelectItem,
}) => {
  const sortedFeatures = [...features].sort(
    (a, b) => a.startAt.getTime() - b.startAt.getTime(),
  );

  const featureWithPositions: (GanttFeature & { subRow: number })[] = [];
  const subRowEndTimes: (Date | null)[] = [];

  for (const feature of sortedFeatures) {
    let subRow = 0;

    while (
      subRow < subRowEndTimes.length &&
      (subRowEndTimes[subRow] === null ||
        (subRowEndTimes[subRow] !== null &&
          (subRowEndTimes[subRow] ?? feature.startAt) > feature.startAt))
    ) {
      subRow++;
    }

    if (subRow === subRowEndTimes.length) {
      subRowEndTimes.push(feature.endAt);
    } else {
      subRowEndTimes[subRow] = feature.endAt;
    }

    featureWithPositions.push({ ...feature, subRow });
  }

  const maxSubRows = Math.max(1, subRowEndTimes.length);

  return (
    <div
      className={cn("relative", className)}
      style={{
        height: `${ganttRowHeight(maxSubRows)}px`,
        minHeight: "var(--gantt-row-height)",
      }}
    >
      {featureWithPositions.map((feature) => (
        <div
          key={feature.id}
          className="absolute w-full"
          style={{
            top: `${(feature.subRow * 100) / maxSubRows}%`,
            height: `${100 / maxSubRows}%`,
          }}
        >
          <GanttFeatureItem
            {...feature}
            onMove={onMove}
            flat={flat}
            onSelectItem={onSelectItem}
          >
            {children ? (
              children(feature)
            ) : (
              <p className="flex-1 truncate text-xs">{feature.name}</p>
            )}
          </GanttFeatureItem>
        </div>
      ))}
    </div>
  );
};

export type GanttFeatureListProps = {
  className?: string;
  children: ReactNode;
};

export const GanttFeatureList: FC<GanttFeatureListProps> = ({
  className,
  children,
}) => (
  <div
    className={cn(
      "absolute top-0 left-0 h-full w-max space-y-4 pt-4",
      className,
    )}
    style={{ marginTop: "var(--gantt-header-height)" }}
  >
    {children}
  </div>
);

export const GanttMarker: FC<
  GanttMarkerProps & {
    onRemove?: (id: string) => void;
    className?: string;
  }
> = memo(({ label, date, id, onRemove, className }) => {
  const gantt = useContext(GanttContext);
  const differenceIn = useMemo(
    () => getDifferenceIn(gantt.range),
    [gantt.range],
  );
  const timelineStartDate = useMemo(
    () => new Date(gantt.timelineData.at(0)?.year ?? 0, 0, 1),
    [gantt.timelineData],
  );

  const offset = useMemo(
    () => differenceIn(date, timelineStartDate),
    [differenceIn, date, timelineStartDate],
  );
  const innerOffset = useMemo(
    () =>
      calculateInnerOffset(
        date,
        gantt.range,
        (gantt.columnWidth * gantt.zoom) / 100,
      ),
    [date, gantt.range, gantt.columnWidth, gantt.zoom],
  );

  const handleRemove = useCallback(() => onRemove?.(id), [onRemove, id]);

  return (
    <div
      className="pointer-events-none absolute top-0 left-0 z-20 flex h-full flex-col items-center justify-center overflow-visible select-none"
      style={{
        width: 0,
        transform: `translateX(calc(var(--gantt-column-width) * ${offset} + ${innerOffset}px))`,
      }}
    >
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              "group bg-card text-foreground pointer-events-auto sticky top-0 flex flex-col flex-nowrap items-center justify-center rounded-b-md px-2 py-1 text-xs whitespace-nowrap select-auto",
              className,
            )}
          >
            {label}
            <span className="max-h-[0] overflow-hidden opacity-80 transition-all group-hover:max-h-[2rem]">
              {formatDate(date, "MMM dd, yyyy")}
            </span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {onRemove ? (
            <ContextMenuItem
              className="text-destructive flex items-center gap-2"
              onClick={handleRemove}
            >
              <TrashIcon size={16} />
              Remove marker
            </ContextMenuItem>
          ) : null}
        </ContextMenuContent>
      </ContextMenu>
      <div className={cn("bg-card h-full w-px", className)} />
    </div>
  );
});

GanttMarker.displayName = "GanttMarker";

export type GanttProviderProps = {
  range?: Range;
  zoom?: number;
  onAddItem?: (date: Date) => void;
  children: ReactNode;
  className?: string;
  /**
   * Day the timeline is built around — it draws that year plus the one either
   * side, and scrolling extends it from there. Defaults to today, so a consumer
   * that does not pass it behaves exactly as before. Pass it when the chart
   * covers a window that is not centred on today (e.g. a schedule read as at a
   * past or future As-of day), or the bars fall outside the drawn years.
   */
  start?: Date;
};

export const GanttProvider: FC<GanttProviderProps> = ({
  zoom = 100,
  range = "monthly",
  onAddItem,
  children,
  className,
  start,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [timelineData, setTimelineData] = useState<TimelineData>(() =>
    createInitialTimelineData(start ?? new Date()),
  );

  // Re-anchor when an explicitly-given `start` moves to another year — e.g. the
  // page's As-of day changes. Consumers that never pass `start` keep the years
  // they have, including any the user scrolled into.
  const anchorYear = start?.getFullYear() ?? null;
  const lastAnchorYearRef = useRef(anchorYear);
  useEffect(() => {
    if (anchorYear === null || anchorYear === lastAnchorYearRef.current) return;
    lastAnchorYearRef.current = anchorYear;
    setTimelineData(createInitialTimelineData(new Date(anchorYear, 0, 1)));
  }, [anchorYear]);
  const [, setScrollX] = useGanttScrollX();
  const [sidebarWidth, setSidebarWidth] = useState(0);

  // --- Consolidated drag handler registry ---
  const dragHandlersRef = useRef(new Map<string, GanttDragHandlers>());

  const dragRegistry = useMemo<GanttDragRegistryContextValue>(
    () => ({
      register: (id, handlers) => {
        dragHandlersRef.current.set(id, handlers);
      },
      unregister: (id) => {
        dragHandlersRef.current.delete(id);
      },
    }),
    [],
  );

  /**
   * Resolve drag handlers by finding the feature ID that the draggable belongs to.
   * Draggable IDs follow the pattern: `feature-drag-helper-{left|right}-{featureId}` or just the featureId for the main bar.
   */
  const resolveHandlers = useCallback(
    (draggableId: string): GanttDragHandlers | undefined => {
      // Direct match first (main bar uses feature id directly)
      const direct = dragHandlersRef.current.get(draggableId);
      if (direct) return direct;

      // Try to extract feature ID from drag helper pattern
      const leftMatch = draggableId.match(/^feature-drag-helper-left-(.+)$/);
      if (leftMatch) return dragHandlersRef.current.get(leftMatch[1]);

      const rightMatch = draggableId.match(/^feature-drag-helper-right-(.+)$/);
      if (rightMatch) return dragHandlersRef.current.get(rightMatch[1]);

      return undefined;
    },
    [],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const handlers = resolveHandlers(String(event.active.id));
      handlers?.onDragStart?.(event);
    },
    [resolveHandlers],
  );

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      const handlers = resolveHandlers(String(event.active.id));
      handlers?.onDragMove?.(event);
    },
    [resolveHandlers],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const handlers = resolveHandlers(String(event.active.id));
      handlers?.onDragEnd?.(event);
    },
    [resolveHandlers],
  );

  const dndSensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
  );

  const headerHeight = GANTT_HEADER_HEIGHT;
  const rowHeight = GANTT_ROW_HEIGHT;
  let columnWidth = 50;

  if (range === "monthly") {
    columnWidth = 150;
  } else if (range === "quarterly") {
    columnWidth = 100;
  }

  const cssVariables = useMemo(
    () =>
      ({
        "--gantt-zoom": `${zoom}`,
        "--gantt-column-width": `${(zoom / 100) * columnWidth}px`,
        "--gantt-header-height": `${headerHeight}px`,
        "--gantt-row-height": `${rowHeight}px`,
        "--gantt-sidebar-width": `${sidebarWidth}px`,
      }) as CSSProperties,
    [zoom, columnWidth, sidebarWidth],
  );

  // Open the chart where its content is. With no `start` that is the middle of
  // the drawn span, as it always was. With a `start`, it is that day — otherwise
  // a chart anchored on, say, September opens in the middle of its anchor year
  // and shows six empty months before any of its bars.
  const anchorTime = start?.getTime() ?? null;
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    if (anchorTime === null) {
      scrollElement.scrollLeft =
        scrollElement.scrollWidth / 2 - scrollElement.clientWidth / 2;
    } else {
      const timelineStartDate = new Date(timelineData[0]?.year ?? 0, 0, 1);
      const offset = getOffset(new Date(anchorTime), timelineStartDate, {
        zoom,
        range,
        columnWidth,
        sidebarWidth,
        headerHeight,
        rowHeight,
        onAddItem,
        placeholderLength: 2,
        timelineData,
        ref: scrollRef,
      });
      // A few pixels of lead-in so a bar starting on the first of the month is
      // not flush against the sidebar, but the anchor month is still the first
      // one on screen.
      scrollElement.scrollLeft = Math.max(0, offset - ANCHOR_LEAD_IN);
    }

    setScrollX(scrollElement.scrollLeft);
  }, [
    setScrollX,
    anchorTime,
    timelineData,
    zoom,
    range,
    columnWidth,
    sidebarWidth,
    headerHeight,
    rowHeight,
    onAddItem,
  ]);

  useEffect(() => {
    const updateSidebarWidth = () => {
      const sidebarElement = scrollRef.current?.querySelector(
        '[data-roadmap-ui="gantt-sidebar"]',
      );
      const newWidth = sidebarElement ? 300 : 0;
      setSidebarWidth(newWidth);
    };

    updateSidebarWidth();

    const observer = new MutationObserver(updateSidebarWidth);
    if (scrollRef.current) {
      observer.observe(scrollRef.current, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleScroll = useCallback(
    throttle(() => {
      const scrollElement = scrollRef.current;
      if (!scrollElement) {
        return;
      }

      const { scrollLeft, scrollWidth, clientWidth } = scrollElement;
      setScrollX(scrollLeft);

      if (scrollLeft === 0) {
        const firstYear = timelineData[0]?.year;

        if (!firstYear) {
          return;
        }

        const newTimelineData: TimelineData = [...timelineData];
        newTimelineData.unshift({
          year: firstYear - 1,
          quarters: new Array(4).fill(null).map((_, quarterIndex) => ({
            months: new Array(3).fill(null).map((_, monthIndex) => {
              const month = quarterIndex * 3 + monthIndex;
              return {
                days: getDaysInMonth(new Date(firstYear, month, 1)),
              };
            }),
          })),
        });

        setTimelineData(newTimelineData);

        scrollElement.scrollLeft = scrollElement.clientWidth;
        setScrollX(scrollElement.scrollLeft);
      } else if (scrollLeft + clientWidth >= scrollWidth) {
        const lastYear = timelineData.at(-1)?.year;

        if (!lastYear) {
          return;
        }

        const newTimelineData: TimelineData = [...timelineData];
        newTimelineData.push({
          year: lastYear + 1,
          quarters: new Array(4).fill(null).map((_, quarterIndex) => ({
            months: new Array(3).fill(null).map((_, monthIndex) => {
              const month = quarterIndex * 3 + monthIndex;
              return {
                days: getDaysInMonth(new Date(lastYear, month, 1)),
              };
            }),
          })),
        });

        setTimelineData(newTimelineData);

        scrollElement.scrollLeft =
          scrollElement.scrollWidth - scrollElement.clientWidth;
        setScrollX(scrollElement.scrollLeft);
      }
    }, 100),
    [],
  );

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener("scroll", handleScroll);
      }
    };
  }, [handleScroll]);

  const scrollToFeature = useCallback(
    (feature: GanttFeature) => {
      const scrollElement = scrollRef.current;
      if (!scrollElement) {
        return;
      }

      const timelineStartDate = new Date(timelineData[0].year, 0, 1);

      const offset = getOffset(feature.startAt, timelineStartDate, {
        zoom,
        range,
        columnWidth,
        sidebarWidth,
        headerHeight,
        rowHeight,
        onAddItem,
        placeholderLength: 2,
        timelineData,
        ref: scrollRef,
      });

      const targetScrollLeft = Math.max(0, offset);

      scrollElement.scrollTo({
        left: targetScrollLeft,
        behavior: "smooth",
      });
    },
    [
      timelineData,
      zoom,
      range,
      columnWidth,
      sidebarWidth,
      headerHeight,
      rowHeight,
      onAddItem,
    ],
  );

  return (
    <GanttContext.Provider
      value={{
        zoom,
        range,
        headerHeight,
        columnWidth,
        sidebarWidth,
        rowHeight,
        onAddItem,
        timelineData,
        placeholderLength: 2,
        ref: scrollRef,
        scrollToFeature,
      }}
    >
      <GanttDragRegistryContext.Provider value={dragRegistry}>
        <DndContext
          modifiers={[restrictToHorizontalAxis]}
          sensors={dndSensors}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        >
          <div
            className={cn(
              "gantt bg-secondary relative grid h-full w-full flex-none overflow-auto rounded-sm select-none",
              range,
              className,
            )}
            ref={scrollRef}
            style={{
              ...cssVariables,
              gridTemplateColumns: "var(--gantt-sidebar-width) 1fr",
            }}
          >
            {children}
          </div>
        </DndContext>
      </GanttDragRegistryContext.Provider>
    </GanttContext.Provider>
  );
};

export type GanttTimelineProps = {
  children: ReactNode;
  className?: string;
};

export const GanttTimeline: FC<GanttTimelineProps> = ({
  children,
  className,
}) => (
  // NOTE: uses `overflow-visible` (not `clip`) so descendants with
  // `position: sticky` can reference the outer gantt scroll container
  // instead of being trapped inside the timeline. The outer gantt
  // container already handles visual clipping via its own `overflow-auto`.
  <div
    className={cn(
      "relative flex h-full w-max flex-none overflow-visible",
      className,
    )}
  >
    {children}
  </div>
);

export type GanttTodayProps = {
  className?: string;
};

export const GanttToday: FC<GanttTodayProps> = ({ className }) => {
  const label = "Today";
  const date = useMemo(() => new Date(), []);
  const gantt = useContext(GanttContext);
  const differenceIn = useMemo(
    () => getDifferenceIn(gantt.range),
    [gantt.range],
  );
  const timelineStartDate = useMemo(
    () => new Date(gantt.timelineData.at(0)?.year ?? 0, 0, 1),
    [gantt.timelineData],
  );

  const offset = useMemo(
    () => differenceIn(date, timelineStartDate),
    [differenceIn, date, timelineStartDate],
  );
  const innerOffset = useMemo(
    () =>
      calculateInnerOffset(
        date,
        gantt.range,
        (gantt.columnWidth * gantt.zoom) / 100,
      ),
    [date, gantt.range, gantt.columnWidth, gantt.zoom],
  );

  return (
    <div
      className="pointer-events-none absolute top-0 left-0 z-20 flex h-full flex-col items-center justify-center overflow-visible select-none"
      style={{
        width: 0,
        transform: `translateX(calc(var(--gantt-column-width) * ${offset} + ${innerOffset}px))`,
      }}
    >
      <div
        className={cn(
          "group bg-card text-foreground pointer-events-auto sticky top-0 flex flex-col flex-nowrap items-center justify-center rounded-b-md px-2 py-1 text-xs whitespace-nowrap select-auto",
          className,
        )}
      >
        {label}
        <span className="max-h-[0] overflow-hidden opacity-80 transition-all group-hover:max-h-[2rem]">
          {formatDate(date, "MMM dd, yyyy")}
        </span>
      </div>
      <div className={cn("h-full w-px bg-red-300", className)} />
    </div>
  );
};
