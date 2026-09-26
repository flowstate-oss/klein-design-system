import { test, expect } from "@playwright/test";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core/axe.min.js");

test("catalogue search, generated API and example are available without backend", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Build from a shared contract." }),
  ).toBeVisible();
  await page.getByLabel("Find a component").fill("Field");
  await expect(page.getByRole("link", { name: /^Field/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /^PageHeader/ })).toBeHidden();
  await page.getByRole("link", { name: /^Field/ }).click();
  await expect(
    page
      .locator("article#Field")
      .getByRole("rowheader", { name: "label", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("local panels support manual keyboard activation in Chromium", async ({
  page,
}) => {
  await page.goto("/examples/local-panels/");
  const details = page.getByRole("tab", { name: "Details", exact: true });
  await details.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "History" })).toBeFocused();
  await expect(details).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("tabpanel")).toContainText(
    "Updated 24 September 2026",
  );
});

for (const width of [390, 1280])
  test(`list recipe has no horizontal overflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/examples/list-page/");
    await expect(
      page.getByRole("heading", { name: "Cost centres" }),
    ).toBeVisible();
    await page
      .getByRole("searchbox", { name: "Find cost centres" })
      .fill("Platform");
    await expect(page.locator(".docs-example-list li")).toHaveText([
      "Platform",
    ]);
    const size = await page.locator(".k-list-template").evaluate((node) => ({
      scroll: node.scrollWidth,
      width: node.clientWidth,
    }));
    expect(size.scroll).toBeLessThanOrEqual(size.width + 1);
    await page.screenshot({
      path: `artifacts/list-${width}.png`,
      fullPage: true,
    });
  });

test("controls and local panels have no serious accessibility violations", async ({
  page,
}) => {
  for (const story of [
    "components--actions",
    "components--fields",
    "components--local-panels",
    "components--list-page",
  ]) {
    await page.goto(`/examples/${story.replace("components--", "")}/`);
    await expect(
      page
        .locator(".docs-stack, .docs-form, .k-tabs, .docs-page-frame")
        .first(),
    ).toBeVisible();
    await page.addScriptTag({ path: axePath });
    const violations = await page.evaluate(async () => {
      const axe = (
        window as unknown as {
          axe: {
            run: (selector: string) => Promise<{
              violations: { id: string; impact: string; description: string }[];
            }>;
          };
        }
      ).axe;
      const result = await axe.run("body");
      return result.violations.filter((v) =>
        ["serious", "critical"].includes(v.impact),
      );
    });
    expect(violations, story).toEqual([]);
  }
});

test("migrated table and forecast render semantic tables in the standalone site", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/examples/table/");
  await expect(page.getByRole("columnheader", { name: /Name/ })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Alex" })).toBeVisible();
  await page.goto("/examples/forecast-table/");
  await expect(page.getByRole("table", { name: "Forecast" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "£42,000" })).toBeVisible();
  const label = page.getByRole("cell", { name: "Engineering" });
  await expect(label).toHaveCSS("position", "sticky");
  expect(errors).toEqual([]);
  await page.screenshot({ path: "artifacts/forecast.png", fullPage: true });
});

test("edge-to-edge bands meet at the same outer edges and stack on mobile", async ({
  page,
}) => {
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/examples/edge-to-edge/");
    const layout = page.locator(".k-edge-layout");
    await expect(layout).toBeVisible();
    await expect(layout).toHaveCSS("font-family", /Geist/);
    const geometry = await layout.evaluate((node) => ({
      width: node.clientWidth,
      scroll: node.scrollWidth,
      padding: getComputedStyle(node).padding,
      gap: getComputedStyle(node).gap,
    }));
    expect(geometry.scroll).toBeLessThanOrEqual(geometry.width + 1);
    expect(geometry.padding).toBe("0px");
    await page.screenshot({
      path: `artifacts/edge-${width}.png`,
      fullPage: true,
    });
  }
});

test("Eddy rail remains mounted but cannot receive focus when hidden", async ({
  page,
}) => {
  await page.goto("/examples/eddy-rail/");
  const rail = page.locator("[data-assistant-rail]");
  await expect(rail).toHaveAttribute("inert", "");
  await page.getByRole("button", { name: "Toggle Eddy" }).click();
  await expect(rail).not.toHaveAttribute("inert", "");
  await expect(
    rail.getByRole("textbox", { name: "Message Eddy" }),
  ).toBeVisible();
  await rail.getByRole("button", { name: "Close", exact: true }).click();
  await expect(rail).toHaveAttribute("inert", "");
});

test("full table collection coordinates filter, property and sort state", async ({
  page,
}) => {
  await page.goto("/components/TableCollection/");
  const demo = page.locator(".docs-specimen");
  await expect(
    demo.getByRole("cell", { name: "Alex", exact: true }),
  ).toBeVisible();
  await demo
    .getByRole("button", { name: "Sort descending", exact: true })
    .click();
  await expect(
    demo
      .getByRole("row")
      .filter({ has: page.getByRole("cell") })
      .first(),
  ).toContainText("Sam");
  await demo.getByRole("button", { name: "Filter", exact: true }).click();
  await page.getByRole("button", { name: "Team", exact: true }).click();
  await page.getByText("Platform", { exact: true }).last().click();
  await page.keyboard.press("Escape");
  await expect(
    demo.getByRole("cell", { name: "Sam", exact: true }),
  ).toHaveCount(0);
  await demo.getByRole("button", { name: "Properties", exact: true }).click();
  await page.getByRole("button", { name: "Team", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(
    demo.getByRole("columnheader", { name: "Team", exact: true }),
  ).toHaveCount(0);
});
test("chart gallery includes every type and option without runtime errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/charts/");
  await expect(
    page.getByRole("heading", { name: "All thirteen chart types" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "wholeNumber", exact: true }),
  ).toBeVisible();
  await page.getByRole("switch", { name: "Partial final period" }).click();
  await expect(
    page.getByRole("switch", { name: "Partial final period" }),
  ).toHaveAttribute("aria-checked", "true");
  expect(errors).toEqual([]);
});
test("documentation is available without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:61001/components/TableCollection/");
  await expect(
    page.getByRole("heading", { name: "TableCollection", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("rowheader", { name: "config", exact: true }),
  ).toBeVisible();
  await context.close();
});

for (const name of [
  "DashboardPageLayout",
  "DetailPageLayout",
  "WorkspaceLayout",
  "TableCollection",
])
  test(`${name} remains within the mobile viewport`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(`/components/${name}/`);
    await expect(page.locator(".docs-specimen")).not.toBeEmpty();
    const width = await page.evaluate(() => ({
      content: document.documentElement.scrollWidth,
      viewport: innerWidth,
    }));
    expect(width.content).toBeLessThanOrEqual(width.viewport + 1);
  });

for (const width of [390, 1280])
  test(`application shell keeps sidebar and content in one bounded frame at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/components/ApplicationLayout/");
    const shell = page.locator(".k-application-layout");
    await expect(shell).toBeVisible();
    const bounds = await shell.evaluate((element) => {
      const root = element.getBoundingClientRect();
      const body = element
        .querySelector(".k-application-body")!
        .getBoundingClientRect();
      const content = element
        .querySelector(".k-application-content")!
        .getBoundingClientRect();
      return {
        root: root.width,
        body: body.width,
        right: content.right,
        edge: root.right,
        overflow: getComputedStyle(element).overflow,
      };
    });
    expect(bounds.body).toBeLessThanOrEqual(bounds.root + 1);
    expect(bounds.right).toBeLessThanOrEqual(bounds.edge + 1);
    expect(bounds.overflow).toBe("hidden");
  });

test("simple chart options render every type and preserve keyboard point identities", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/charts/");
  const gallery = page.getByRole("region", { name: "Simple chart options" });
  for (const type of ["line", "area", "pie", "doughnut", "bar"]) {
    await gallery
      .getByRole("combobox", { name: "Chart type", exact: true })
      .click();
    await page.getByRole("option", { name: type, exact: true }).click();
    await expect(gallery.locator("canvas")).toBeVisible();
  }
  await gallery
    .getByRole("combobox", { name: "Orientation", exact: true })
    .click();
  await page.getByRole("option", { name: "horizontal", exact: true }).click();
  await gallery
    .getByRole("switch", { name: "Highlight filter matches" })
    .click();
  await gallery
    .getByRole("switch", { name: "Bound values to zero–one" })
    .click();
  await gallery
    .getByRole("combobox", { name: "Chart height", exact: true })
    .click();
  await page.getByRole("option", { name: "fill", exact: true }).click();
  await expect(gallery.locator(".k-chart-fill")).toBeVisible();
  await gallery.getByText("Monthly capacity data", { exact: true }).click();
  const value = gallery.getByRole("button", { name: "Engineering, Jan: 0.4" });
  await value.focus();
  await page.keyboard.press("Enter");
  await expect(gallery.getByRole("status")).toHaveText(
    "engineering / 2026-01: 0.4",
  );
  expect(errors).toEqual([]);
});

test("chart interval and separate-unit examples retain accessible data", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/charts/");
  const gallery = page.getByRole("region", { name: "Simple chart options" });
  await gallery
    .getByRole("combobox", { name: "Chart type", exact: true })
    .click();
  await page.getByRole("option", { name: "line", exact: true }).click();
  for (const name of [
    "Secondary axis",
    "Prepared interval",
    "Dashed comparison",
    "Connect missing points",
  ])
    await gallery.getByRole("switch", { name, exact: true }).click();
  await gallery.getByText("Monthly capacity data", { exact: true }).click();
  await expect(
    gallery.getByRole("button", { name: "Design, Jan: 20%" }),
  ).toBeVisible();
  await expect(
    gallery.getByRole("columnheader", { name: "Prepared interval lower" }),
  ).toBeVisible();
  await gallery
    .getByRole("switch", { name: "Pending comparison", exact: true })
    .click();
  await expect(gallery.getByTestId("chart-pending-band")).toBeVisible();
  await expect(
    gallery.getByRole("button", { name: "Design, Jan: 20%" }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("diagram canvas supports keyboard navigation and reset", async ({
  page,
}) => {
  await page.goto("/components/PanZoomCanvas/");
  const canvas = page.getByRole("region", {
    name: "Example diagram",
    exact: true,
  });
  const layer = canvas.locator(".k-pan-zoom-layer");
  await canvas.focus();
  await page.keyboard.press("Home");
  await expect(layer).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
  await page.keyboard.press("ArrowRight");
  await expect(layer).toHaveCSS("transform", "matrix(1, 0, 0, 1, -40, 0)");
  await page.keyboard.press("+");
  await expect(layer).not.toHaveCSS("transform", "matrix(1, 0, 0, 1, -40, 0)");
  await page
    .getByRole("button", { name: "Reset diagram", exact: true })
    .click();
  await expect(layer).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
});
test("Eddy launchpad submits its controlled draft and respects reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/components/EddyLaunchpad/");
  const input = page.getByRole("textbox", {
    name: "Ask about your organisation",
  });
  await input.fill("Show capacity");
  await input.press("Enter");
  await expect(page.getByRole("status")).toHaveText("Show capacity");
  await expect(input).toHaveValue("");
  await expect(page.locator(".eddy-currents .c1")).toHaveCSS(
    "animation-name",
    "none",
  );
  await page
    .getByRole("button", { name: "Where do we have spare capacity?" })
    .click();
  await expect(page.getByRole("status")).toHaveText("capacity");
});

test("hierarchy add action appears for keyboard and touch users", async ({
  page,
  browser,
}) => {
  await page.goto("/components/HierarchyTree/");
  const action = page.getByRole("button", { name: "Add node" });
  await expect(action).toHaveCSS("opacity", "0");
  await action.focus();
  await expect(action).toHaveCSS("opacity", "1");
  const touch = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  try {
    const touchPage = await touch.newPage();
    await touchPage.goto(page.url());
    await expect(touchPage.getByRole("button", { name: "Add node" })).toHaveCSS(
      "opacity",
      "1",
    );
  } finally {
    await touch.close();
  }
});
