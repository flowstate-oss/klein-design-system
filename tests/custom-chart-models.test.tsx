import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { it, expect, vi } from "vitest";
import { RelationshipPlot } from "../packages/charts/src/RelationshipPlot";
import { ForecastAdjustmentChart } from "../packages/charts/src/ForecastAdjustmentChart";
const captured = vi.hoisted(() => ({ scatter: {} as any, line: {} as any }));
vi.mock("../packages/charts/src/chart-base.js", () => ({
  ScatterChart: (props: any) => {
    captured.scatter = props;
    return null;
  },
  LineChart: (props: any) => {
    captured.line = props;
    return null;
  },
}));
it("uses stable relationship IDs for pointer and keyboard intents without recalculating supplied values", async () => {
  const select = vi.fn();
  render(
    <RelationshipPlot
      label="Project health"
      points={[
        {
          id: "project-z",
          label: "Migration",
          x: 35,
          y: 80,
          radius: 12,
          details: ["Budget £200k"],
        },
      ]}
      xAxis={{ label: "Time" }}
      yAxis={{ label: "Spend" }}
      onPointSelect={select}
    />,
  );
  expect(captured.scatter.data.datasets[0].data).toEqual([{ x: 35, y: 80 }]);
  expect(captured.scatter.data.datasets[0].pointRadius({ dataIndex: 0 })).toBe(
    12,
  );
  captured.scatter.onElementClick({ index: 0 });
  expect(select).toHaveBeenLastCalledWith("project-z");
  await userEvent.click(screen.getByText("Project health data"));
  await userEvent.click(screen.getByRole("button", { name: "Migration" }));
  expect(select).toHaveBeenCalledTimes(2);
  expect(screen.getByText("Budget £200k")).toBeVisible();
});
it("retains missing forecast values and the application-formatted adjustment annotation", async () => {
  render(
    <ForecastAdjustmentChart
      label="Projection"
      points={[
        {
          id: "jan",
          label: "January",
          actual: 20,
          forecast: null,
          baseline: null,
        },
        {
          id: "feb",
          label: "February",
          actual: null,
          forecast: 30,
          baseline: 40,
        },
      ]}
      labels={{ actual: "Actual", forecast: "Adjusted", baseline: "Baseline" }}
      annotation={{ pointId: "feb", label: "£10 below baseline", tone: "good" }}
      referenceLine={{ label: "Limit", value: 50 }}
      formatValue={(value) => `£${value}`}
    />,
  );
  expect(captured.line.data.datasets[0].data).toEqual([20, null]);
  expect(screen.getByText("£10 below baseline")).toBeVisible();
  await userEvent.click(screen.getByText("Projection data"));
  expect(screen.getByText("£30")).toBeVisible();
  expect(screen.getByText("£40")).toBeVisible();
  expect(screen.getAllByText("—")).toHaveLength(3);
});
