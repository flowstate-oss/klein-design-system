import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import {
  Button,
  IconButton,
  Field,
  Tabs,
  RouteTabs,
  ListViewTemplate,
  PageHeader,
  ViewControlPanel,
  NumericValue,
} from "@klein-ui/react";
import { describe, it, expect, vi } from "vitest";

describe("actions", () => {
  it("does not submit a form by default", async () => {
    const submit = vi.fn((event) => event.preventDefault());
    render(
      <form onSubmit={submit}>
        <Button>Save</Button>
      </form>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(submit).not.toHaveBeenCalled();
  });
  it("supports deliberate form submission", async () => {
    const submit = vi.fn((event) => event.preventDefault());
    render(
      <form onSubmit={submit}>
        <Button type="submit">Save</Button>
      </form>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(submit).toHaveBeenCalledOnce();
  });
  it("retains the label and prevents duplicate actions during loading", async () => {
    const click = vi.fn();
    render(
      <Button loading onClick={click}>
        Save changes
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Save changes" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    await userEvent.click(button);
    expect(click).not.toHaveBeenCalled();
  });
  it("names icon actions without exposing decorative glyphs", () => {
    render(<IconButton label="Search records" icon="search" />);
    expect(
      screen.getByRole("button", { name: "Search records" }),
    ).toBeEnabled();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

describe("fields", () => {
  it("connects unique labels, help, and errors while preserving external descriptions", () => {
    render(
      <>
        <p id="external">External instructions</p>
        <Field
          label="Annual limit"
          description="In reporting currency"
          error="Enter a positive amount"
          aria-describedby="external"
        />
        <Field label="Monthly limit" />
      </>,
    );
    const annual = screen.getByLabelText("Annual limit");
    expect(annual).toHaveAccessibleDescription(
      "External instructions In reporting currency Enter a positive amount",
    );
    expect(annual).toHaveAttribute("aria-invalid", "true");
    expect(annual.id).not.toEqual(screen.getByLabelText("Monthly limit").id);
  });
  it("keeps controlled input changes in the caller", async () => {
    function Example() {
      const [value, setValue] = useState("");
      return (
        <Field
          label="Name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      );
    }
    render(<Example />);
    await userEvent.type(screen.getByLabelText("Name"), "Platform");
    expect(screen.getByLabelText("Name")).toHaveValue("Platform");
  });
  it("respects disabled and readonly semantics", async () => {
    render(
      <>
        <Field label="Locked" readOnly defaultValue="Finance" />
        <Field label="Disabled" disabled />
      </>,
    );
    await userEvent.type(screen.getByLabelText("Locked"), "x");
    expect(screen.getByLabelText("Locked")).toHaveValue("Finance");
    expect(screen.getByLabelText("Disabled")).toBeDisabled();
  });
});

describe("navigation", () => {
  it("uses route links, not local tab semantics", () => {
    render(
      <RouteTabs
        label="Budget views"
        value="all"
        items={[
          { id: "all", label: "All budgets", href: "/budgets" },
          { id: "requests", label: "Requests", href: "/requests" },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: "All budgets" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Requests" })).toHaveAttribute(
      "href",
      "/requests",
    );
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });
  it("supports manual keyboard activation and skips disabled panels", async () => {
    function Example() {
      const [value, setValue] = useState("one");
      return (
        <Tabs
          label="Details"
          value={value}
          onValueChange={setValue}
          items={[
            { id: "one", label: "First", content: "First panel" },
            {
              id: "locked",
              label: "Locked",
              content: "Hidden",
              disabled: true,
            },
            { id: "two", label: "Second", content: "Second panel" },
          ]}
        />
      );
    }
    render(<Example />);
    const user = userEvent.setup();
    await user.tab();
    expect(screen.getByRole("tab", { name: "First" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Second" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "First" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await user.keyboard("{Enter}");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Second panel");
    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "First" })).toHaveFocus();
  });
});

it("puts one control region before the scrolling body", () => {
  const { container } = render(
    <ListViewTemplate
      header={<PageHeader title="Budgets" />}
      controls={
        <ViewControlPanel label="Budget controls">
          <Button variant="secondary">Filter</Button>
        </ViewControlPanel>
      }
    >
      <p>Body</p>
    </ListViewTemplate>,
  );
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  const controls = screen.getByRole("group", { name: "Budget controls" });
  expect(
    controls.compareDocumentPosition(screen.getByText("Body")) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(container.querySelectorAll(".k-view-single")).toHaveLength(1);
});
it("does not infer financial consequence from a formatted sign", () => {
  render(<NumericValue>-£1,000.00</NumericValue>);
  expect(screen.getByText("-£1,000.00")).toHaveAttribute(
    "data-tone",
    "neutral",
  );
});
