import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { it, expect, vi } from "vitest";
import { AssignmentCard } from "../packages/react/src/assignment-card";
import { HierarchySummaryCard } from "../packages/react/src/hierarchy-summary-card";
import { HierarchyTree } from "../packages/react/src/hierarchy-tree";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "../packages/react/src/compat/context-menu";
it("keeps card and assignment actions separate while forwarding context-menu events", async () => {
  const select = vi.fn(),
    entry = vi.fn();
  render(
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <AssignmentCard
          title="Lead"
          value="1.0"
          selectLabel="Open lead"
          emptyLabel="Unfilled"
          entries={[
            {
              id: "a",
              label: "Alex",
              description: "September–December",
              value: "0.8",
            },
          ]}
          onSelect={select}
          onEntrySelect={entry}
        />
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Edit responsibility</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Open lead" }));
  expect(select).toHaveBeenCalledTimes(1);
  await userEvent.click(
    screen.getByRole("button", { name: "Alex September–December" }),
  );
  expect(entry).toHaveBeenCalledWith("a");
  expect(select).toHaveBeenCalledTimes(1);
  fireEvent.contextMenu(screen.getByText("Lead"));
  expect(
    await screen.findByRole("menuitem", { name: "Edit responsibility" }),
  ).toBeVisible();
});
it("exposes a single action when assignments are informational", () => {
  const select = vi.fn();
  render(
    <AssignmentCard
      title="Lead"
      value="1.0"
      size="compact"
      selectLabel="Open lead"
      emptyLabel="Unfilled"
      entries={[{ id: "a", label: "Alex" }]}
      onSelect={select}
    />,
  );
  expect(screen.getAllByRole("button")).toHaveLength(1);
  fireEvent.click(screen.getByText("Alex"));
  expect(select).toHaveBeenCalledTimes(1);
});
it("emits independent controlled expansion intents", () => {
  const related = vi.fn(),
    branch = vi.fn(),
    select = vi.fn();
  render(
    <HierarchySummaryCard
      title="Engineering"
      metrics={["12 people"]}
      onSelect={select}
      expanded={false}
      onExpandedChange={related}
      expandLabel="Show assignments"
      branch={{
        label: "3 groups",
        actionLabel: "Hide groups",
        expanded: true,
        onExpandedChange: branch,
      }}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Show assignments" }));
  expect(related).toHaveBeenCalledWith(true);
  expect(branch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Hide groups" }));
  expect(branch).toHaveBeenCalledWith(false);
  expect(select).not.toHaveBeenCalled();
});
it("preserves prepared hierarchy order with semantic nested lists", () => {
  render(
    <HierarchyTree
      label="Structure"
      nodes={[
        {
          id: "root",
          content: "Director",
          children: [
            { id: "b", content: "Platform" },
            { id: "a", content: "Product" },
          ],
        },
      ]}
    />,
  );
  expect(screen.getByRole("region", { name: "Structure" })).toBeVisible();
  expect(screen.getAllByRole("list")).toHaveLength(2);
  expect(
    screen.getAllByRole("listitem").map((item) => item.textContent),
  ).toEqual(["DirectorPlatformProduct", "Platform", "Product"]);
});

import { RangeTrack } from "../packages/react/src/range-track";
it("clamps a range to the visible track and forwards each handle gesture", () => {
  const handler = vi.fn();
  render(
    <RangeTrack
      label="Assignment"
      valueLabel="January–June"
      left={80}
      width={50}
      columns={[{ id: "jan", weight: 31 }]}
      onPointerDown={(part) => (event) => {
        event.stopPropagation();
        handler(part);
      }}
      testIds={{ bar: "range", start: "start", end: "end" }}
    />,
  );
  expect(screen.getByTestId("range")).toHaveStyle({
    left: "80%",
    width: "20%",
  });
  fireEvent.pointerDown(screen.getByTestId("start"));
  fireEvent.pointerDown(screen.getByTestId("end"));
  fireEvent.pointerDown(screen.getByTestId("range"));
  expect(handler.mock.calls).toEqual([["start"], ["end"], ["move"]]);
});
