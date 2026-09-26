import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { it, expect, vi } from "vitest";
import { BreakdownTable } from "../packages/table/src/BreakdownTable";
it("activates a breakdown row by stable ID without intercepting nested controls", async () => {
  const select = vi.fn(),
    nested = vi.fn();
  render(
    <BreakdownTable
      label="Spend"
      shareLabel="Share"
      columns={[{ id: "team", label: "Team" }]}
      rows={[
        { id: "b", cells: ["Beta"], percentage: 60 },
        {
          id: "a",
          cells: [
            <button key="action" onClick={nested}>
              Details
            </button>,
          ],
          percentage: 0,
          shareLabel: "0%",
        },
      ]}
      onRowClick={select}
    />,
  );
  const row = screen.getByText("Beta").closest("tr")!;
  row.focus();
  await userEvent.keyboard("{Enter}");
  expect(select).toHaveBeenCalledWith("b");
  screen.getByRole("button", { name: "Details" }).focus();
  await userEvent.keyboard(" ");
  expect(nested).toHaveBeenCalledTimes(1);
  // The nested control owns its keyboard and pointer action.
  expect(select).toHaveBeenCalledTimes(1);
  expect(screen.getByText("0%")).toBeInTheDocument();
});
