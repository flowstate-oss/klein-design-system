"use client";
import { useMemo } from "react";
import { Gantt, Willow } from "@svar-ui/react-gantt";
/** Display-ready Gantt tasks; allocation calculations live in the caller. */
export interface GanttTask {
  id: number;
  text: string;
  start: Date;
  end: Date;
  progress: number;
  type: "task";
  allocation: string;
  color: string;
  projectId: string;
}
export type ZoomLevel = "WEEK" | "MONTH" | "QUARTER" | "YEAR";
export interface GanttChartProps {
  tasks: GanttTask[];
  zoomLevel?: ZoomLevel;
}
export function GanttChart({ tasks, zoomLevel = "MONTH" }: GanttChartProps) {
  const scales = useMemo(() => {
    switch (zoomLevel) {
      case "YEAR":
        return [
          { unit: "year" as const, step: 1, format: "yyyy" },
          { unit: "quarter" as const, step: 1, format: "QQQ" },
        ];
      case "QUARTER":
        return [
          { unit: "year" as const, step: 1, format: "yyyy" },
          { unit: "quarter" as const, step: 1, format: "QQQ yyyy" },
          { unit: "month" as const, step: 1, format: "MMM" },
        ];
      case "MONTH":
        return [
          { unit: "year" as const, step: 1, format: "yyyy" },
          { unit: "month" as const, step: 1, format: "MMM yyyy" },
        ];
      case "WEEK":
        return [
          { unit: "year" as const, step: 1, format: "yyyy" },
          { unit: "month" as const, step: 1, format: "MMM yyyy" },
          { unit: "week" as const, step: 1, format: "'W'w" },
        ];
      default:
        return [
          { unit: "year" as const, step: 1, format: "yyyy" },
          { unit: "month" as const, step: 1, format: "MMM yyyy" },
        ];
    }
  }, [zoomLevel]);

  const columns = useMemo(
    () => [
      {
        id: "text",
        header: "Project Name",
        width: 300,
        flexgrow: 1,
      },
      {
        id: "allocation",
        header: "Allocation",
        width: 100,
        align: "center" as const,
      },
    ],
    [],
  );

  if (tasks.length === 0) {
    return (
      <div className="bg-surface-1 flex h-96 items-center justify-center rounded-lg border border-stone-200">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-stone-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="text-secondary-foreground mt-2 text-sm font-medium">
            No projects
          </h3>
          <p className="mt-1 text-sm text-stone-500">
            Get started by creating a new project.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background overflow-hidden rounded-lg border border-stone-200">
      <Willow>
        <div className="h-[600px] w-full">
          <Gantt tasks={tasks} scales={scales} columns={columns} links={[]} />
        </div>
      </Willow>
    </div>
  );
}
