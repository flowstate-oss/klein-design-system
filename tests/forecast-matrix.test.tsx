import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import {
  ForecastMatrix,
  type ForecastMatrixRow,
} from "../packages/forecast/src/index";
const periods = [{ id: "jan", label: "January" }];
const rows: ForecastMatrixRow[] = [
  {
    id: "team",
    label: "Engineering",
    hasChildren: true,
    cells: { jan: { primary: "2.0", secondary: "£20,000" } },
    total: "£20,000",
    children: [
      {
        id: "person",
        label: "Alex",
        cells: { jan: { primary: "1.0", editable: true, pending: true } },
        total: "£10,000",
      },
    ],
  },
];
describe("complete forecast matrix", () => {
  it("keeps keyboard focus while controlled expansion reveals child rows and emits edit intents", () => {
    const edit = vi.fn();
    function Fixture() {
      const [expanded, setExpanded] = useState(new Set<string>());
      return (
        <ForecastMatrix
          label="Forecast"
          rowHeading="Team"
          rows={rows}
          periods={periods}
          expandedIds={expanded}
          onExpandedChange={(id, value) =>
            setExpanded(value ? new Set([id]) : new Set())
          }
          onCellEdit={edit}
        />
      );
    }
    render(<Fixture />);
    const toggle = screen.getByRole("button", { name: "Expand Engineering" });
    toggle.focus();
    fireEvent.click(toggle);
    expect(
      screen.getByRole("button", { name: "Collapse Engineering" }),
    ).toHaveFocus();
    expect(screen.getByText("Alex")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Edit Alex, January" }));
    expect(edit).toHaveBeenCalledWith("person", "jan");
    expect(screen.getByText("£20,000", { selector: "td" })).toBeVisible();
  });
  it("renders lazy loading and error states without fabricating child values", () => {
    const onExpandedChange = vi.fn();
    const props = {
      label: "Forecast",
      rowHeading: "Team",
      periods,
      expandedIds: new Set(["team"]),
      onExpandedChange,
    };
    const { rerender } = render(
      <ForecastMatrix
        {...props}
        rows={[{ ...rows[0], loading: true, children: undefined }]}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Loading forecast");
    expect(screen.queryByText("Alex")).toBeNull();
    rerender(
      <ForecastMatrix
        {...props}
        rows={[
          { ...rows[0], error: "Could not load children", children: undefined },
        ]}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Could not load children",
    );
  });
  it("uses supplied precision and does not mutate the hierarchy", () => {
    const before = JSON.stringify(rows);
    render(
      <ForecastMatrix
        label="Forecast"
        rowHeading="Team"
        periods={periods}
        rows={rows}
        expandedIds={new Set()}
        onExpandedChange={() => {}}
        refreshing
      />,
    );
    expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("2.0")).toBeVisible();
    expect(JSON.stringify(rows)).toBe(before);
  });
});
