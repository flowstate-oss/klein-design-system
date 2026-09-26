import { useState } from "react";
import { AnalyticsChart, ChartThemeProvider } from "@klein-ui/charts";
import { Select, Switch, Field } from "@klein-ui/react";
import type { ChartRendererProps } from "@klein-ui/charts/ChartRenderer";
import type {
  ChartType,
  AnalyticsMetricType,
  StackedBarLabelFormat,
  SplitScaleMode,
} from "@klein-ui/charts/types";
import { Bubble, Burndown, Gantt } from "./custom-charts.recipes";
export const chartTypes: ChartType[] = [
  "stackedArea",
  "line",
  "pie",
  "stackedBar",
  "groupedBar",
  "donut",
  "heatmap",
  "table",
  "waterfall",
  "scatter",
  "horizontalBar",
  "multiLine",
  "wholeNumber",
];
const periods = ["2026-01", "2026-02", "2026-03", "2026-04"];
const series = [
  {
    key: "platform",
    label: "Platform",
    color: null,
    dataPoints: periods.map((period, i) => ({
      period,
      value: [400, 650, 1800, 750][i],
    })),
  },
  {
    key: "design",
    label: "Design",
    color: null,
    dataPoints: periods.map((period, i) => ({
      period,
      value: [30, 40, 55, 45][i],
    })),
  },
];
const options = (values: readonly string[]) =>
  values.map((value) => ({ value, label: value }));
export default function ChartOptions() {
  const [chartType, setType] = useState<ChartType>("stackedBar");
  const [metric, setMetric] = useState<AnalyticsMetricType>("COST");
  const [currency, setCurrency] = useState("GBP");
  const [label, setLabel] = useState<StackedBarLabelFormat>("value");
  const [scale, setScale] = useState<SplitScaleMode>("auto");
  const [minimal, setMinimal] = useState(false);
  const [average, setAverage] = useState(false);
  const [legend, setLegend] = useState(true);
  const [partial, setPartial] = useState(false);
  const [target, setTarget] = useState(false);
  const [cumulative, setCumulative] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const [percent, setPercent] = useState(false);
  const [dark, setDark] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [axisTitle, setAxisTitle] = useState("Spend");
  const props: ChartRendererProps = {
    chartType,
    series: empty ? [] : series,
    currencyCode: currency,
    metric,
    stackedBarLabel: label,
    splitScale: scale,
    minimal,
    showAverage: average,
    showLegend: legend,
    partialFrom: partial ? "2026-04" : undefined,
    referenceLine: target ? { value: 1000, label: "Budget" } : undefined,
    cumulative,
    highlightIndices: highlight ? [2] : undefined,
    valueFormat: percent ? "percent" : undefined,
    axisTitle,
  };
  return (
    <>
      <h2>Explore every renderer option</h2>
      <div className="docs-chart-options">
        <Select
          label="Chart type"
          value={chartType}
          onValueChange={(v) => setType(v as ChartType)}
          options={options(chartTypes)}
        />
        <Select
          label="Metric"
          value={metric}
          onValueChange={(v) => setMetric(v as AnalyticsMetricType)}
          options={options([
            "COST",
            "FTE",
            "HEADCOUNT",
            "AI_COST",
            "AI_SESSIONS",
            "AI_FRUSTRATION",
            "AI_INPUT_QUALITY_AVG",
            "AI_TOKENS",
            "AI_REQUESTS",
            "PR_COUNT",
            "COST_PER_PR",
            "LINES_CHANGED",
            "AI_SPEND",
            "AI_TOTAL_COST",
            "METRIC_VALUE",
          ])}
        />
        <Select
          label="Currency"
          value={currency}
          onValueChange={setCurrency}
          options={options(["GBP", "USD", "CAD", "EUR"])}
        />
        <Select
          label="Stacked labels"
          value={label}
          onValueChange={(v) => setLabel(v as StackedBarLabelFormat)}
          options={options(["value", "percent", "none"])}
        />
        <Select
          label="Split scale"
          value={scale}
          onValueChange={(v) => setScale(v as SplitScaleMode)}
          options={options(["auto", "on", "off"])}
        />
        <Field
          label="Axis title"
          value={axisTitle}
          onChange={(e) => setAxisTitle(e.target.value)}
        />
        {[
          { label: "Minimal", value: minimal, set: setMinimal },
          { label: "Average", value: average, set: setAverage },
          { label: "Legend", value: legend, set: setLegend },
          { label: "Partial final period", value: partial, set: setPartial },
          { label: "Reference target", value: target, set: setTarget },
          { label: "Cumulative", value: cumulative, set: setCumulative },
          { label: "Highlight spike", value: highlight, set: setHighlight },
          { label: "Percent values", value: percent, set: setPercent },
          { label: "Dark theme", value: dark, set: setDark },
          { label: "Empty data", value: empty, set: setEmpty },
        ].map((control) => (
          <Switch
            key={control.label}
            label={control.label}
            value={control.value}
            onValueChange={control.set}
          />
        ))}
      </div>
      <ChartThemeProvider theme={dark ? "dark" : "light"}>
        <div
          className="docs-chart-frame"
          data-chart-theme={dark ? "dark" : "light"}
        >
          <AnalyticsChart {...props} />
        </div>
      </ChartThemeProvider>
      <h3>Current props</h3>
      <pre>
        <code>{JSON.stringify(props, null, 2)}</code>
      </pre>
      <h2>All thirteen chart types</h2>
      <div className="docs-chart-gallery">
        {chartTypes.map((type) => (
          <section key={type}>
            <h3>{type}</h3>
            <div className="docs-chart-frame">
              <AnalyticsChart
                chartType={type}
                series={series}
                currencyCode="GBP"
                metric="COST"
              />
            </div>
          </section>
        ))}
      </div>
      <h2>Custom charts</h2>
      <h3>Capacity bubble chart</h3>
      <Bubble />
      <h3>Cumulative forecast / actual</h3>
      <Burndown />
      <h3>Allocation timeline</h3>
      <Gantt />
    </>
  );
}
