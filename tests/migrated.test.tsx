import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { ForecastTable, ForecastVariance } from "@klein-ui/forecast";
import { EddyComposer, EddyMessage, EddyHistory } from "@klein-ui/eddy";
import { Table } from "@klein-ui/table";
import { TooltipProvider } from "@klein-ui/react/compat/tooltip";
describe("forecast presentation", () => {
  it("renders supplied financial values without aggregating or changing their precision", () => {
    render(
      <ForecastTable
        label="Forecast"
        periods={[
          { id: "p1", label: "January" },
          { id: "p2", label: "February" },
        ]}
        rows={[
          {
            id: "r",
            label: "Engineering",
            cells: ["£1.005", "£2.005"],
            total: "£3.01",
          },
        ]}
      />,
    );
    expect(screen.getByRole("table", { name: "Forecast" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "£3.01" })).toHaveAttribute(
      "data-position",
      "total",
    );
    expect(screen.getByRole("cell", { name: "Engineering" })).toHaveAttribute(
      "data-position",
      "label",
    );
  });
  it("exposes refreshing state while retaining data", () => {
    render(
      <ForecastTable
        label="Forecast"
        refreshing
        periods={[]}
        rows={[{ id: "r", label: "Team", cells: [], total: "£42" }]}
      />,
    );
    expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("£42")).toBeInTheDocument();
  });
});
describe("Eddy", () => {
  it("submits Enter but keeps Shift+Enter and composition for text entry", () => {
    const submit = vi.fn();
    render(
      <EddyComposer
        value="Plan"
        onValueChange={() => {}}
        onSubmit={submit}
        label="Message"
        sendLabel="Send"
      />,
    );
    const input = screen.getByRole("textbox");
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    fireEvent.keyDown(input, { key: "Enter", isComposing: true, keyCode: 229 });
    expect(submit).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(submit).toHaveBeenCalledOnce();
  });
  it("prevents blank or duplicate submissions", async () => {
    const submit = vi.fn();
    const { rerender } = render(
      <EddyComposer
        value=" "
        onValueChange={() => {}}
        onSubmit={submit}
        label="Message"
        sendLabel="Send"
      />,
    );
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    rerender(
      <EddyComposer
        value="Plan"
        loading
        onValueChange={() => {}}
        onSubmit={submit}
        label="Message"
        sendLabel="Send"
      />,
    );
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    expect(submit).not.toHaveBeenCalled();
  });
  it("uses explicit error state rather than interpreting assistant text", () => {
    const { rerender } = render(
      <EddyMessage
        role="assistant"
        content="An error budget measures reliability."
        status="complete"
        thinkingLabel="Thinking"
        retryLabel="Retry"
        onRetry={() => {}}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Retry" }),
    ).not.toBeInTheDocument();
    rerender(
      <EddyMessage
        role="assistant"
        content="Unavailable"
        status="error"
        thinkingLabel="Thinking"
        retryLabel="Retry"
        onRetry={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
  it("selects history with real Radix keyboard interaction", async () => {
    const select = vi.fn();
    render(
      <EddyHistory
        label="History"
        items={[{ id: "one", title: "Forecast" }]}
        value={null}
        onValueChange={select}
      />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "History" }));
    await user.click(screen.getByRole("menuitem", { name: "Forecast" }));
    expect(select).toHaveBeenCalledWith("one");
  });
});
describe("Table", () => {
  it("renders typed rows with the extracted semantic renderer and routes row actions", async () => {
    const click = vi.fn();
    render(
      <TooltipProvider>
        <Table
          label="People"
          rows={[{ id: "alex", name: "Alex" }]}
          rowKey={(row) => row.id}
          onRowClick={click}
          columns={[{ id: "name", label: "Name", render: (row) => row.name }]}
        />
      </TooltipProvider>,
    );
    expect(
      screen.getByRole("columnheader", { name: /Name/ }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByText("Alex"));
    expect(click).toHaveBeenCalledWith({ id: "alex", name: "Alex" });
  });
});

describe("chart formatting compatibility", () => {
  it("retains currency-qualified symbols and negative values", async () => {
    const { formatMoneyK } = await import("../packages/charts/src/format");
    expect(formatMoneyK(20000, 1, "CAD")).toBe("CA$20.0k");
    expect(formatMoneyK(-1500000, 1, "USD")).toBe("-$1.5m");
    expect(formatMoneyK(500, 1, "bad-code")).toBe("$500");
  });
});
