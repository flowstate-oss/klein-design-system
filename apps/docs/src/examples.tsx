import { Sparkline } from "@klein-ui/charts";
import { EddyRail } from "@klein-ui/eddy";
import {
  Checkbox,
  Switch,
  Select,
  Textarea,
  Dialog,
  Tooltip,
  Progress,
  Avatar,
  Badge,
} from "@klein-ui/react";
import { Table } from "@klein-ui/table";
import { Chart } from "@klein-ui/charts";
import {
  ForecastTable,
  ForecastVariance,
  ForecastDelta,
} from "@klein-ui/forecast";
import {
  EddyComposer,
  EddyMessage,
  EddyConversation,
  EddyHistory,
  EddyPanel,
  EddyChartPreview,
} from "@klein-ui/eddy";
import { useState } from "react";
import {
  Button,
  IconButton,
  Icon,
  Input,
  Field,
  NumericValue,
  PageHeader,
  RouteTabs,
  Tabs,
  ViewControlPanel,
  ViewSection,
  ViewLayout,
  ListViewTemplate,
} from "@klein-ui/react";

export function ButtonExample() {
  return <Button tone="accent">Save changes</Button>;
}
export function IconButtonExample() {
  return <IconButton icon="search" label="Search records" />;
}
export function IconExample() {
  return (
    <span>
      Open report <Icon name="arrow-right" />
    </span>
  );
}
export function InputExample() {
  return (
    <Input aria-label="Find in view" type="search" placeholder="Find in view" />
  );
}
export function FieldExample() {
  const [value, setValue] = useState("Engineering");
  return (
    <Field
      label="Cost centre"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      description="Name used in budget reports."
      required
    />
  );
}
export function NumericValueExample() {
  return <NumericValue>£128,400.00</NumericValue>;
}
export function PageHeaderExample() {
  return (
    <PageHeader
      title="Budgets"
      actions={<Button tone="accent">Create budget</Button>}
    />
  );
}
export function RouteTabsExample() {
  return (
    <RouteTabs
      label="Budget views"
      value="current"
      items={[
        { id: "current", label: "Current budgets", href: "#current" },
        { id: "requests", label: "Requests", href: "#requests" },
      ]}
    />
  );
}
export function TabsExample() {
  const [value, setValue] = useState("details");
  return (
    <Tabs
      label="Budget details"
      value={value}
      onValueChange={setValue}
      items={[
        {
          id: "details",
          label: "Details",
          content: <Field label="Budget name" defaultValue="Platform" />,
        },
        {
          id: "history",
          label: "History",
          content: <p>Updated 24 September 2026</p>,
        },
        { id: "locked", label: "Approvals", content: null, disabled: true },
      ]}
    />
  );
}
export function ViewControlPanelExample() {
  return (
    <ViewControlPanel
      label="Budget controls"
      actions={<Button variant="secondary">Export</Button>}
    >
      <Input
        type="search"
        aria-label="Find budgets"
        placeholder="Find budgets"
      />
    </ViewControlPanel>
  );
}
export function ViewSectionExample() {
  return (
    <ViewSection title="Approved budget">
      <NumericValue>£128,400.00</NumericValue>
    </ViewSection>
  );
}
export function ViewLayoutExample() {
  return (
    <ViewLayout
      variant="2:1"
      top={[
        <ViewSection key="approved" title="Approved">
          <NumericValue>£128,400.00</NumericValue>
        </ViewSection>,
        <ViewSection key="spent" title="Spent">
          <NumericValue>£98,420.00</NumericValue>
        </ViewSection>,
      ]}
      main={
        <ViewSection title="Remaining">
          <NumericValue>£29,980.00</NumericValue>
        </ViewSection>
      }
    />
  );
}
export function ListViewTemplateExample() {
  const [query, setQuery] = useState("");
  const names = ["Engineering", "Platform", "Product"];
  return (
    <div className="docs-page-frame">
      <ListViewTemplate
        header={
          <PageHeader
            title="Cost centres"
            actions={<Button tone="accent">Create cost centre</Button>}
          />
        }
        navigation={
          <RouteTabs
            label="Cost centre views"
            value="active"
            items={[
              { id: "active", label: "Active", href: "#active" },
              { id: "archived", label: "Archived", href: "#archived" },
            ]}
          />
        }
        controls={
          <ViewControlPanel label="Cost centre controls">
            <Input
              aria-label="Find cost centres"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find in view"
            />
          </ViewControlPanel>
        }
      >
        <ul className="docs-example-list">
          {names
            .filter((name) => name.toLowerCase().includes(query.toLowerCase()))
            .map((name) => (
              <li key={name}>{name}</li>
            ))}
        </ul>
        {!names.some((name) =>
          name.toLowerCase().includes(query.toLowerCase()),
        ) && <p className="docs-example-empty">No matching cost centres.</p>}
      </ListViewTemplate>
    </div>
  );
}

import {
  EdgeToEdgeLayout,
  DashboardBand,
  SplitBand,
  BandTitle,
} from "@klein-ui/react";
export function BandTitleExample() {
  return <BandTitle>Approved budget</BandTitle>;
}
export function DashboardBandExample() {
  return (
    <DashboardBand>
      <BandTitle>Approved budget</BandTitle>
      <NumericValue>£128,400.00</NumericValue>
    </DashboardBand>
  );
}
export function SplitBandExample() {
  return (
    <SplitBand
      left={
        <>
          <BandTitle>Spent</BandTitle>
          <NumericValue>£98,420.00</NumericValue>
        </>
      }
      right={
        <>
          <BandTitle>Remaining</BandTitle>
          <NumericValue>£29,980.00</NumericValue>
        </>
      }
    />
  );
}
export function EdgeToEdgeLayoutExample() {
  return (
    <EdgeToEdgeLayout>
      <DashboardBandExample />
      <SplitBandExample />
      <DashboardBand flush>
        <ul className="docs-example-list">
          <li>Platform</li>
          <li>Engineering</li>
        </ul>
      </DashboardBand>
    </EdgeToEdgeLayout>
  );
}

export function TableExample() {
  return (
    <Table
      label="People"
      rowKey={(row) => row.id}
      rows={[
        { id: "1", name: "Alex", role: "Design" },
        { id: "2", name: "Morgan", role: "Engineering" },
      ]}
      columns={[
        { id: "name", label: "Name", render: (row) => row.name },
        { id: "role", label: "Role", render: (row) => row.role },
      ]}
    />
  );
}
export function ChartExample() {
  const [selection, setSelection] = useState("No point selected");
  return (
    <>
      <Chart
        label="Monthly capacity"
        type="bar"
        labels={["Jan", "Feb", "Mar"]}
        pointIds={["2026-01", "2026-02", "2026-03"]}
        series={[{ id: "capacity", label: "Capacity", values: [2, 3, 4] }]}
        referenceLine={{ label: "Target", value: 3 }}
        formatValue={(value) => `${value} FTE`}
        onPointSelect={(point) =>
          setSelection(`${point.seriesId}: ${point.pointId} = ${point.value}`)
        }
      />
      <p role="status">{selection}</p>
    </>
  );
}

export function ForecastTableExample() {
  return (
    <ForecastTable
      label="Forecast"
      periods={[
        { id: "jan", label: "Jan" },
        { id: "feb", label: "Feb" },
      ]}
      rows={[
        {
          id: "team",
          label: "Engineering",
          cells: ["£20,000", "£22,000"],
          total: "£42,000",
        },
        {
          id: "person",
          label: "Alex",
          level: 1,
          cells: ["£10,000", "£11,000"],
          total: "£21,000",
        },
      ]}
    />
  );
}
export function ForecastVarianceExample() {
  return <ForecastVariance label="£2,000 below budget" tone="good" />;
}
export function ForecastDeltaExample() {
  return (
    <ForecastDelta label="Cost increased" direction="increase" tone="bad" />
  );
}
export function EddyComposerExample() {
  const [value, setValue] = useState("");
  return (
    <EddyComposer
      value={value}
      onValueChange={setValue}
      onSubmit={() => setValue("")}
      label="Message Eddy"
      placeholder="Ask about your plan"
      sendLabel="Send"
      hint="Enter to send; Shift+Enter for a new line"
    />
  );
}
export function EddyMessageExample() {
  return (
    <EddyMessage
      role="assistant"
      content="The forecast is **within budget**."
      status="complete"
      thinkingLabel="Thinking"
      retryLabel="Retry"
    />
  );
}
export function EddyConversationExample() {
  return (
    <EddyConversation label="Conversation">
      <EddyMessage
        role="user"
        content="How is the forecast?"
        status="complete"
        thinkingLabel="Thinking"
        retryLabel="Retry"
      />
      <EddyMessageExample />
    </EddyConversation>
  );
}
export function EddyHistoryExample() {
  const [value, setValue] = useState<string | null>("forecast");
  return (
    <EddyHistory
      label="Recent conversations"
      items={[
        { id: "forecast", title: "Forecast review", updatedLabel: "Today" },
        { id: "capacity", title: "Capacity", updatedLabel: "Yesterday" },
      ]}
      value={value}
      onValueChange={setValue}
    />
  );
}
export function EddyPanelExample() {
  return (
    <EddyPanel title="Eddy" description="Planning assistant">
      <EddyConversationExample />
      <EddyComposerExample />
    </EddyPanel>
  );
}
export function EddyChartPreviewExample() {
  const [open, setOpen] = useState(false);
  return (
    <EddyChartPreview
      title="Monthly capacity"
      open={open}
      onOpenChange={setOpen}
      compact={<ChartExample />}
      expanded={<ChartExample />}
    />
  );
}

export function CheckboxExample() {
  const [value, setValue] = useState(false);
  return (
    <Checkbox label="Include archived" value={value} onValueChange={setValue} />
  );
}
export function SwitchExample() {
  const [value, setValue] = useState(false);
  return (
    <Switch label="Email updates" value={value} onValueChange={setValue} />
  );
}
export function SelectExample() {
  const [value, setValue] = useState("month");
  return (
    <Select
      label="Period"
      value={value}
      onValueChange={setValue}
      options={[
        { value: "month", label: "Monthly" },
        { value: "quarter", label: "Quarterly" },
      ]}
    />
  );
}
export function TextareaExample() {
  const [value, setValue] = useState("");
  return (
    <Textarea
      label="Description"
      value={value}
      onValueChange={setValue}
      placeholder="Describe this plan"
    />
  );
}
export function DialogExample() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Review changes</Button>
      <Dialog
        title="Review changes"
        description="Confirm the changes to your plan."
        open={open}
        onOpenChange={setOpen}
      >
        <Button onClick={() => setOpen(false)}>Done</Button>
      </Dialog>
    </>
  );
}
export function TooltipExample() {
  return (
    <Tooltip content="Download the current rows">
      <Button variant="secondary">Export</Button>
    </Tooltip>
  );
}
export function ProgressExample() {
  return <Progress label="Completed" value={65} />;
}
export function AvatarExample() {
  return <Avatar label="Alex Morgan" initials="AM" />;
}
export function BadgeExample() {
  return <Badge tone="good">Within budget</Badge>;
}

export function SparklineExample() {
  return (
    <Sparkline
      points={[3, 5, 4, 8, 6, 9]}
      label="Capacity over six months"
      partialFromIndex={5}
    />
  );
}
export function EddyRailExample() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative", height: 400, overflow: "hidden" }}>
      <Button onClick={() => setOpen(!open)}>Toggle Eddy</Button>
      <EddyRail open={open}>
        <EddyPanel
          title="Eddy"
          actions={
            <Button variant="text" onClick={() => setOpen(false)}>
              Close
            </Button>
          }
        >
          <EddyConversationExample />
          <EddyComposerExample />
        </EddyPanel>
      </EddyRail>
    </div>
  );
}

import {
  DashboardPageLayout,
  DetailPageLayout,
  WorkspaceLayout,
} from "@klein-ui/react";
import { TableCollection, useView } from "@klein-ui/table";
import { Users } from "lucide-react";
import {
  AnalyticsChart,
  DashboardChart,
  MetricStrip,
  MetricGrid,
} from "@klein-ui/charts";
import type { TableState } from "@klein-ui/table/view-types";
export function DashboardPageLayoutExample() {
  return (
    <DashboardPageLayout
      header={<PageHeader title="Usage overview" />}
      metrics={<MetricStripExample />}
      tabs={<RouteTabsExample />}
    >
      <ViewSection title="Spend">
        <ChartExample />
      </ViewSection>
    </DashboardPageLayout>
  );
}
export function DetailPageLayoutExample() {
  return (
    <DetailPageLayout
      header={<PageHeader title="Platform initiative" />}
      tabs={<RouteTabsExample />}
      properties={<p>Owner: Engineering</p>}
      supporting={<p>Budget: £120,000</p>}
      description={<p>Build the shared platform.</p>}
      relatedTitle="Related projects"
      related={<TableExample />}
    />
  );
}
export function WorkspaceLayoutExample() {
  return (
    <div className="docs-workspace-frame">
      <WorkspaceLayout
        header={<PageHeader title="Workspace" />}
        navigation={
          <nav aria-label="Areas">
            <a href="#workspace-example">Overview</a>
          </nav>
        }
        details={<p>Selected item details</p>}
      >
        <DashboardPageLayoutExample />
      </WorkspaceLayout>
    </div>
  );
}
export function MetricStripExample() {
  return (
    <MetricStrip
      tiles={[
        {
          id: "cost",
          label: "Spend",
          ariaLabel: "Spend £24,000, up 12 percent",
          value: "£24,000",
          delta: 0.12,
          deltaIsBadWhenUp: true,
          sparkPoints: [10, 12, 11, 15],
          sparkLabel: "Daily spend",
        },
        { id: "people", label: "People", ariaLabel: "42 people", value: "42" },
      ]}
    />
  );
}
export function MetricGridExample() {
  return (
    <MetricGrid
      tiles={[
        {
          id: "cost",
          label: "Spend",
          ariaLabel: "Spend £24,000",
          value: "£24,000",
        },
        { id: "people", label: "People", ariaLabel: "42 people", value: "42" },
        {
          id: "coverage",
          label: "Coverage",
          ariaLabel: "Coverage 92 percent",
          value: "92%",
          delta: 0.04,
        },
      ]}
    />
  );
}
const analyticsSeries = [
  {
    key: "engineering",
    label: "Engineering",
    color: null,
    dataPoints: [
      { period: "2026-01", value: 42 },
      { period: "2026-02", value: 55 },
      { period: "2026-03", value: 48 },
    ],
  },
  {
    key: "design",
    label: "Design",
    color: null,
    dataPoints: [
      { period: "2026-01", value: 14 },
      { period: "2026-02", value: 18 },
      { period: "2026-03", value: 20 },
    ],
  },
];
export function AnalyticsChartExample() {
  return (
    <div className="docs-chart-frame">
      <AnalyticsChart
        chartType="stackedBar"
        series={analyticsSeries}
        currencyCode="GBP"
        metric="COST"
        partialFrom="2026-03"
        referenceLine={{ label: "Budget", value: 70 }}
      />
    </div>
  );
}
export function DashboardChartExample() {
  const [stackBy, setStackBy] = useState("team");
  return (
    <div className="docs-chart-frame">
      <DashboardChart
        chartType="stackedBar"
        series={analyticsSeries}
        currencyCode="GBP"
        metric="COST"
        labels={{
          other: "Other",
          otherCount: (n) => `${n} others`,
          otherGrouped: "Grouped series",
          stackBy: "Stack by",
          partial: "Not final yet",
        }}
        formatValue={(n) => `£${n}`}
        stackOptions={[
          { value: "team", label: "Team" },
          { value: "function", label: "Function" },
        ]}
        stackBy={stackBy}
        onStackByChange={setStackBy}
        partialFrom="2026-03"
      />
    </div>
  );
}
function ExampleSavedViews() {
  const { applySavedView } = useView();
  const [value, setValue] = useState("all");
  return (
    <Select
      label="Saved view"
      value={value}
      onValueChange={(next) => {
        setValue(next);
        applySavedView({
          filters: next === "platform" ? { team: ["Platform"] } : {},
        });
      }}
      options={[
        { value: "all", label: "All people" },
        { value: "platform", label: "Platform team" },
      ]}
    />
  );
}
export function TableCollectionExample() {
  const [state, setState] = useState<TableState>();
  const rows = [
    { id: "alex", name: "Alex", team: "Platform" },
    { id: "sam", name: "Sam", team: "Design" },
    { id: "jo", name: "Jo", team: "Platform" },
  ];
  // This fixture adapter stands in for a server query. The organism receives rows ready to display.
  const selected = state?.filters.team ?? [];
  const items = rows
    .filter((row) => !selected.length || selected.includes(row.team))
    .sort(
      (a, b) =>
        (state?.sortDir === "desc" ? -1 : 1) * a.name.localeCompare(b.name),
    );
  return (
    <TableCollection
      savedViews={<ExampleSavedViews />}
      config={{
        viewId: "people-example",
        items,
        loading: false,
        totalCount: items.length,
        rowKey: (r) => r.id,
        avatar: () => null,
        title: (r) => r.name,
        titleColumnLabel: "Name",
        columns: [
          {
            id: "team",
            label: "Team",
            priority: 1,
            defaultVisible: true,
            render: (r) => r.team,
          },
        ],
        sortOptions: [{ value: "name", label: "Name" }],
        defaultSortBy: "name",
        groupOptions: [
          { value: "none", label: "None" },
          { value: "team", label: "Team" },
        ],
        defaultGroupBy: "none",
        groupNoneValue: "none",
        groupKeyExtractor: (r) => r.team,
        filterCategories: [
          {
            id: "team",
            label: "Team",
            icon: Users,
            options: [
              { id: "Platform", label: "Platform" },
              { id: "Design", label: "Design" },
            ],
          },
        ],
        showFilterChips: true,
        onStateChange: setState,
      }}
    />
  );
}

import {
  CapacityBubbleChart,
  ForecastActualChart,
  AllocationTimeline,
} from "@klein-ui/charts";
export function CapacityBubbleChartExample() {
  return (
    <CapacityBubbleChart
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
export function ForecastActualChartExample() {
  return (
    <ForecastActualChart
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
export function AllocationTimelineExample() {
  return (
    <AllocationTimeline
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

import {
  ProfilePageLayout,
  IdentityStrip,
  StandingSummary,
  SectionDivider,
  ProgressRing,
} from "@klein-ui/react";
import { ForecastMatrix, type ForecastMatrixRow } from "@klein-ui/forecast";
export function IdentityStripExample() {
  return (
    <IdentityStrip
      name="Platform"
      secondary="Engineering"
      status={{ label: "Active", tone: "good" }}
    />
  );
}
export function StandingSummaryExample() {
  return (
    <StandingSummary
      label="Budget standing"
      value="Review required"
      tone="warn"
      description="Forecast spend exceeds the agreed limit."
      nudge={{ label: "Review forecast", href: "#forecast" }}
    />
  );
}
export function SectionDividerExample() {
  return <SectionDivider label="Spend" meta="30 days" />;
}
export function ProgressRingExample() {
  return <ProgressRing label="Delivery progress" value={65} />;
}
export function ProfilePageLayoutExample() {
  return (
    <ProfilePageLayout
      header={<IdentityStripExample />}
      summary={<StandingSummaryExample />}
      metrics={<MetricGridExample />}
    >
      <TabsExample />
    </ProfilePageLayout>
  );
}
export function ForecastMatrixExample() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [edited, setEdited] = useState("");
  const rows: ForecastMatrixRow[] = [
    {
      id: "engineering",
      label: "Engineering",
      count: 2,
      hasChildren: true,
      cells: {
        jan: { primary: "2.0 FTE", secondary: "£20,000" },
        feb: { primary: "2.5 FTE", secondary: "£25,000", tone: "watch" },
      },
      total: "£45,000",
      children: [
        {
          id: "alex",
          label: "Alex",
          cells: {
            jan: { primary: "1.0 FTE", secondary: "£10,000", editable: true },
            feb: { primary: "1.0 FTE", secondary: "£10,000", editable: true },
          },
          total: "£20,000",
        },
      ],
    },
  ];
  return (
    <>
      <ForecastMatrix
        label="Workforce forecast"
        rowHeading="Team / person"
        periods={[
          { id: "jan", label: "January" },
          { id: "feb", label: "February" },
        ]}
        rows={rows}
        expandedIds={expanded}
        onExpandedChange={(id, value) =>
          setExpanded((previous) => {
            const next = new Set(previous);
            if (value) next.add(id);
            else next.delete(id);
            return next;
          })
        }
        onCellEdit={(row, period) => setEdited(`${row}: ${period}`)}
      />
      <p role="status">
        {edited
          ? `Edit requested for ${edited}`
          : "Expand Engineering to edit an allocation."}
      </p>
    </>
  );
}

import {
  RadarComparison,
  CumulativeChart,
  DistributionChart,
} from "@klein-ui/charts";
export function RadarComparisonExample() {
  return (
    <RadarComparison
      labels={{ coverage: "Coverage", balance: "Balance" }}
      series={[
        {
          id: "current",
          label: "Current",
          axes: [
            { id: "design", label: "Design", value: 80 },
            { id: "engineering", label: "Engineering", value: 60 },
            { id: "delivery", label: "Delivery", value: 90 },
          ],
          coverageScore: 76.7,
          balanceScore: 82,
        },
      ]}
    />
  );
}
export function CumulativeChartExample() {
  return (
    <CumulativeChart
      data={[
        {
          month: "January",
          monthDate: new Date("2026-01-01T00:00:00Z"),
          monthlySpend: 100,
          cumulativeSpend: 100,
        },
        {
          month: "February",
          monthDate: new Date("2026-02-01T00:00:00Z"),
          monthlySpend: 150,
          cumulativeSpend: 250,
        },
      ]}
      labels={{
        title: "Cumulative spend",
        description: "Values supplied by the application",
        empty: "No data",
        cumulative: "Cumulative",
        period: "Monthly",
      }}
      formatValue={(value) => `£${value}`}
      currentMonth={new Date("2026-02-01T00:00:00Z")}
    />
  );
}
export function DistributionChartExample() {
  return (
    <DistributionChart
      label="Capacity distribution"
      total={10}
      items={[
        { id: "engineering", label: "Engineering", count: 7, percentage: 70 },
        { id: "design", label: "Design", count: 3, percentage: 30 },
      ]}
      emptyLabel="No categories"
      formatCount={(value) => `${value} people`}
    />
  );
}

import { ApplicationLayout } from "@klein-ui/react";
export function ApplicationLayoutExample() {
  return (
    <ApplicationLayout
      sidebar={
        <RouteTabs
          label="Application"
          items={[
            { id: "projects", label: "Projects", href: "#projects" },
            { id: "people", label: "People", href: "#people" },
          ]}
          value="projects"
        />
      }
    >
      <PageHeader title="Projects" />
      <DashboardPageLayout>
        <TableExample />
      </DashboardPageLayout>
    </ApplicationLayout>
  );
}

import { CapacityBreakdown } from "@klein-ui/charts";
export function CapacityBreakdownExample() {
  return (
    <CapacityBreakdown
      label="Capacity allocation"
      description="Prepared by the application data layer"
      segments={[
        {
          id: "working",
          label: "Working",
          value: 7,
          displayValue: "7.0 FTE",
          barLabel: "70%",
        },
        {
          id: "leave",
          label: "Leave",
          value: 2,
          displayValue: "2.0 FTE",
          barLabel: "20%",
        },
        {
          id: "available",
          label: "Available",
          value: 1,
          displayValue: "1.0 FTE",
          barLabel: "10%",
        },
      ]}
      summary={{
        label: "Utilization",
        value: "70%",
        statusLabel: "Below target",
        tone: "watch",
      }}
    />
  );
}

import { WaterfallChart } from "@klein-ui/charts";
export function WaterfallChartExample() {
  return (
    <WaterfallChart
      label="Capacity bridge"
      emptyLabel="No movements"
      legend={[
        { label: "Opening", tone: "neutral" },
        { label: "Increase", tone: "good" },
        { label: "Decrease", tone: "bad" },
      ]}
      bars={[
        {
          id: "opening",
          label: "Opening",
          title: "Opening",
          range: [0, 10],
          valueLabel: "10",
          tooltipLines: ["Opening: 10"],
          tone: "neutral",
          direction: "total",
        },
        {
          id: "added",
          label: "September",
          title: "September increase",
          range: [10, 12],
          valueLabel: "+2",
          tooltipLines: ["Increase: +2", "Alex", "Morgan"],
          tone: "good",
          direction: "up",
        },
        {
          id: "removed",
          label: "",
          title: "September decrease",
          range: [11, 12],
          valueLabel: "-1",
          tooltipLines: ["Decrease: -1", "Sam"],
          tone: "bad",
          direction: "down",
        },
        {
          id: "closing",
          label: "Closing",
          title: "Closing",
          range: [0, 11],
          valueLabel: "11",
          tooltipLines: ["Closing: 11"],
          tone: "neutral",
          direction: "total",
        },
      ]}
      secondary={{
        label: "Monthly cost",
        values: [null, 84000, 84000, null],
        formatValue: (value) => `£${value.toLocaleString("en-GB")}`,
        formatAxisValue: (value) => `£${value / 1000}k`,
      }}
    />
  );
}

import { ShareBreakdown } from "@klein-ui/charts";
export function ShareBreakdownExample() {
  return (
    <ShareBreakdown
      label="Cost classification"
      description="Confirmed and estimated values"
      totalLabel="Total"
      totalValue="£100k"
      emptyLabel="No spend"
      segments={[
        {
          id: "capital-confirmed",
          seriesId: "capital",
          label: "Capital (reported)",
          percentage: 50,
          valueLabel: "£50,000",
          helpText: "Confirmed development costs.",
        },
        {
          id: "capital-estimated",
          seriesId: "capital",
          label: "Capital (estimated)",
          percentage: 20,
          valueLabel: "£20,000",
          estimated: true,
          helpText: "Unconfirmed allocation estimate.",
        },
        {
          id: "operating",
          label: "Operating",
          percentage: 30,
          valueLabel: "£30,000",
        },
      ]}
    />
  );
}

import { RelationshipPlot, ForecastAdjustmentChart } from "@klein-ui/charts";
import { ChartPanel } from "@klein-ui/react";
export function RelationshipPlotExample() {
  const [selected, setSelected] = useState("No project selected");
  return (
    <>
      <RelationshipPlot
        label="Project health"
        xAxis={{ label: "Timeline progress (%)", min: 0, max: 100 }}
        yAxis={{ label: "Budget consumed (%)", min: 0, max: 150 }}
        points={[
          {
            id: "platform",
            label: "Platform",
            x: 45,
            y: 70,
            radius: 18,
            tone: "watch",
            details: ["Timeline: 45%", "Budget: 70%", "Spend: £70,000"],
          },
          {
            id: "mobile",
            label: "Mobile",
            x: 80,
            y: 60,
            radius: 12,
            tone: "good",
            details: ["Timeline: 80%", "Budget: 60%", "Spend: £30,000"],
          },
        ]}
        onPointSelect={setSelected}
      />
      <p role="status">{selected}</p>
    </>
  );
}
export function ForecastAdjustmentChartExample() {
  return (
    <ForecastAdjustmentChart
      label="Adjusted forecast"
      labels={{
        actual: "Actual",
        forecast: "Adjusted forecast",
        baseline: "Baseline",
      }}
      points={[
        {
          id: "june",
          label: "June",
          actual: 100,
          forecast: null,
          baseline: null,
        },
        {
          id: "july",
          label: "July",
          actual: 110,
          forecast: 110,
          baseline: 110,
        },
        {
          id: "august",
          label: "August",
          actual: null,
          forecast: 240,
          baseline: 120,
        },
        {
          id: "september",
          label: "September",
          actual: null,
          forecast: 260,
          baseline: 130,
        },
      ]}
      referenceLine={{ label: "Monthly limit", value: 340 }}
      annotation={{ pointId: "september", label: "+£130/mo", tone: "bad" }}
      formatValue={(value) => `£${value}`}
      height={260}
    />
  );
}
export function ChartPanelExample() {
  return (
    <ChartPanel title="Monthly capacity" appearance="flat">
      <ChartExample />
    </ChartPanel>
  );
}

import { ProgressPie } from "@klein-ui/react";
export function ProgressPieExample() {
  return <ProgressPie label="3 of 4 completed" value={75} tone="good" />;
}

import { Notice } from "@klein-ui/react";
export function NoticeExample() {
  return (
    <Notice title="Baseline unavailable" tone="watch">
      Choose a comparison period with recorded data.
    </Notice>
  );
}

import { EddyLaunchpad } from "@klein-ui/eddy";
export function EddyLaunchpadExample() {
  const [value, onValueChange] = useState("");
  const [action, setAction] = useState("No question sent");
  return (
    <>
      <EddyLaunchpad
        value={value}
        onValueChange={onValueChange}
        onSubmit={() => {
          setAction(value);
          onValueChange("");
        }}
        onSuggestionSelect={(id) => setAction(id)}
        groups={[
          {
            id: "planning",
            label: "Planning",
            suggestions: [
              { id: "capacity", label: "Where do we have spare capacity?" },
            ],
          },
        ]}
        labels={{
          title: "Eddy",
          placeholder: "Ask about your organisation",
          scope: "Sees what you see — Example organisation",
          send: "Ask Eddy",
          suggestions: "Where to start",
          permission: "Your existing permissions apply.",
        }}
      />
      <p role="status">{action}</p>
    </>
  );
}

import { PanZoomCanvas, type PanZoomCanvasHandle } from "@klein-ui/react";
import { useRef } from "react";
export function PanZoomCanvasExample() {
  const ref = useRef<PanZoomCanvasHandle>(null);
  return (
    <>
      <Button variant="secondary" onClick={() => ref.current?.fit()}>
        Fit diagram
      </Button>
      <Button variant="secondary" onClick={() => ref.current?.reset()}>
        Reset diagram
      </Button>
      <div style={{ height: 300 }}>
        <PanZoomCanvas ref={ref} label="Example diagram">
          <MetricStripExample />
        </PanZoomCanvas>
      </div>
    </>
  );
}
