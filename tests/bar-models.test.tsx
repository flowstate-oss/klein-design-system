import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { it, expect, vi } from "vitest";
import { RankedBars } from "../packages/charts/src/RankedBars";
import { SegmentedBar } from "../packages/charts/src/SegmentedBar";
import { ReviewSequence } from "../packages/react/src/review-sequence";
it("preserves ranking and prepared values while emitting keyboard selection IDs", async () => {
  const change = vi.fn();
  render(
    <RankedBars
      label="Spend"
      emptyLabel="No data"
      value="b"
      onValueChange={change}
      items={[
        { id: "b", label: "Beta", valueLabel: "£25", percentage: 100 },
        { id: "a", label: "Alpha", valueLabel: "£5", percentage: 20 },
      ]}
    />,
  );
  const buttons = screen.getAllByRole("button");
  expect(buttons.map((button) => button.textContent)).toEqual([
    "Beta£25",
    "Alpha£5",
  ]);
  expect(buttons[0]).toHaveAttribute("aria-pressed", "true");
  buttons[1].focus();
  await userEvent.keyboard("{Enter}");
  expect(change).toHaveBeenCalledWith("a");
});
it("keeps split amounts accessible even when the legend is visually hidden", () => {
  render(
    <SegmentedBar
      label="Provider split"
      segments={[
        {
          id: "one",
          label: "One",
          percentage: 120,
          valueLabel: "£1.20",
          shareLabel: "120%",
          seriesIndex: 2,
        },
        {
          id: "zero",
          label: "Zero",
          percentage: 0,
          valueLabel: "£0",
          tone: "neutral",
        },
      ]}
    />,
  );
  const region = screen.getByRole("region", { name: "Provider split" });
  expect(within(region).getByText("£1.20")).toBeInTheDocument();
  expect(within(region).getByText("£0")).toBeInTheDocument();
  expect(region.querySelector("[data-provider=one]")).toHaveStyle({
    width: "100%",
  });
});
it("makes review explanations available through keyboard focus", async () => {
  render(
    <ReviewSequence
      label="Review"
      compact
      steps={[
        {
          id: "a",
          label: "AM",
          accessibleLabel: "Alex: approved",
          details: "Reviewed on 24 September",
          tone: "good",
          icon: "check",
        },
      ]}
    />,
  );
  await userEvent.tab();
  expect(screen.getByRole("button", { name: "Alex: approved" })).toHaveFocus();
  expect(await screen.findByRole("tooltip")).toHaveTextContent(
    "Reviewed on 24 September",
  );
});
