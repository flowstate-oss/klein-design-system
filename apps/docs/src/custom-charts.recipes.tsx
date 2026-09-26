import { BubbleChart } from "@klein-ui/charts/BubbleChart";
import { BurndownChart } from "@klein-ui/charts/BurndownChart";
import { GanttChart } from "@klein-ui/charts/GanttChart";
export default { title: "Custom charts" };
export function Bubble() {
  return (
    <BubbleChart
      scenarioName="Team capacity"
      width={280}
      height={200}
      bubbles={[
        {
          skillId: "one",
          skillName: "Design",
          headcount: 4,
          delta: 1,
          deltaPercent: 25,
          radius: 36,
          x: 80,
          y: 100,
          tone: "good",
          deltaLabel: "+1",
        },
        {
          skillId: "two",
          skillName: "Engineering",
          headcount: 8,
          delta: 0,
          deltaPercent: 0,
          radius: 50,
          x: 175,
          y: 100,
          tone: "accent",
          deltaLabel: "0",
        },
      ]}
    />
  );
}
export function Burndown() {
  return (
    <BurndownChart
      series={[
        { month: "Jan", forecast: 100, actual: 90 },
        { month: "Feb", forecast: 200, actual: 180 },
        { month: "Mar", forecast: 300, actual: null },
      ]}
      mode="cost"
      todayIndex={1}
      labels={{ forecast: "Forecast", actual: "Actual" }}
      formatValue={(value) => `£${value}`}
    />
  );
}
export function Gantt() {
  return (
    <GanttChart
      tasks={[
        {
          id: 1,
          text: "Launch",
          start: new Date("2026-01-01T00:00:00Z"),
          end: new Date("2026-03-01T00:00:00Z"),
          progress: 0.5,
          type: "task",
          allocation: "2.0/3.0",
          color: "#002FA7",
          projectId: "launch",
        },
      ]}
    />
  );
}
