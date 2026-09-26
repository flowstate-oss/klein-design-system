import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { CapacityBreakdown } from "../packages/charts/src/CapacityBreakdown";
import { ForecastAllocationEditor } from "../packages/forecast/src/ForecastAllocationEditor";
vi.mock("../packages/charts/src/chart-base.js", () => ({
  BarChart: () => null,
}));
describe("display-model organisms", () => {
  it("preserves prepared values and business assessment independently of the plotted value", () => {
    render(
      <CapacityBreakdown
        label="Capacity"
        segments={[
          {
            id: "working",
            label: "Working",
            value: 9,
            displayValue: "9.00 people",
          },
        ]}
        summary={{
          label: "Utilization",
          value: "90.00%",
          tone: "bad",
          statusLabel: "Above permitted limit",
        }}
      />,
    );
    expect(screen.getByText("9.00 people")).toBeVisible();
    expect(screen.getByText("90.00%")).toBeVisible();
    expect(screen.getByText("Above permitted limit")).toBeVisible();
  });
  it("shows zero as a value while explaining the empty chart", () => {
    render(
      <CapacityBreakdown
        label="Capacity"
        emptyLabel="No allocation"
        segments={[
          { id: "working", label: "Working", value: 0, displayValue: "0.0" },
        ]}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("No allocation");
    expect(screen.getByText("0.0")).toBeVisible();
  });
  it("opens a forecast editor through keyboard activation of the value", async () => {
    const onOpenChange = vi.fn();
    render(
      <ForecastAllocationEditor
        open={false}
        onOpenChange={onOpenChange}
        resourceName="Alex"
        resourceType="employee"
        value={1}
        onValueChange={() => {}}
        creating={false}
        onCreatingChange={() => {}}
        loading={false}
        saving={false}
        canCreate={false}
        allocationCount={1}
        directAllocations={[{ id: "a" }]}
        teamAllocations={[]}
        onSave={() => {}}
      >
        1.0
      </ForecastAllocationEditor>,
    );
    await userEvent.tab();
    expect(
      screen.getByRole("button", { name: "Edit Alex allocation" }),
    ).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});

import { ShareBreakdown } from "../packages/charts/src/ShareBreakdown";
it("keeps share values and estimated explanations available to keyboard users", async () => {
  render(
    <ShareBreakdown
      label="Classification"
      totalLabel="Total"
      totalValue="£1,234.56"
      emptyLabel="No data"
      segments={[
        {
          id: "estimate",
          seriesId: "capital",
          label: "Capital (estimated)",
          percentage: 37.5,
          valueLabel: "£462.96",
          estimated: true,
          helpText: "Allocation estimate awaiting confirmation",
        },
      ]}
    />,
  );
  expect(screen.getByText("£1,234.56")).toBeVisible();
  expect(screen.getByText("£462.96")).toBeVisible();
  expect(screen.getByText("37.5%")).toBeVisible();
  await userEvent.tab();
  expect(
    screen.getByRole("button", { name: "About Capital (estimated)" }),
  ).toHaveFocus();
  expect(await screen.findByRole("tooltip")).toHaveTextContent(
    "Allocation estimate awaiting confirmation",
  );
});

import { ProgressPie } from "../packages/react/src/progress-pie";
it("clamps progress and retains its accessible label when icon only", () => {
  const { container, rerender } = render(
    <ProgressPie label="Complete" value={120} iconOnly />,
  );
  expect(screen.getByText("Complete")).toHaveClass("sr-only");
  expect(container.querySelector("svg")).toHaveAttribute("data-fraction", "1");
  rerender(<ProgressPie label="Unknown" value={NaN} />);
  expect(container.querySelector("svg")).toHaveAttribute("data-fraction", "0");
  expect(container.querySelector("path")).toBeNull();
});
