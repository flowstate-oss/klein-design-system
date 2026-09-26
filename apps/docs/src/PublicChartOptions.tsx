import { useState } from "react";
import { Chart, ChartThemeProvider, type ChartProps } from "@klein-ui/charts";
import { Select, Switch, Field } from "@klein-ui/react";
const types = ["bar", "line", "area", "pie", "doughnut"] as const;
export default function PublicChartOptions() {
  const [type, setType] = useState<ChartProps["type"]>("bar");
  const [orientation, setOrientation] = useState<"vertical" | "horizontal">(
    "vertical",
  );
  const [caption, setCaption] = useState(true);
  const [legend, setLegend] = useState(true);
  const [highlight, setHighlight] = useState(false);
  const [range, setRange] = useState(false);
  const [stacked, setStacked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [target, setTarget] = useState(true);
  const [dark, setDark] = useState(false);
  const [height, setHeight] = useState("300");
  const [format, setFormat] = useState("number");
  const [label, setLabel] = useState("Monthly capacity");
  const [description, setDescription] = useState(
    "Values prepared by the application",
  );
  const [selection, setSelection] = useState(
    "Select a plotted point or expand the data table and use its buttons.",
  );
  return (
    <section aria-label="Simple chart options">
      <h2>Chart: every public option</h2>
      <div className="docs-option-grid">
        <Select
          label="Chart type"
          value={type}
          onValueChange={(value) => setType(value as ChartProps["type"])}
          options={types.map((value) => ({ value, label: value }))}
        />
        <Select
          label="Chart height"
          value={height}
          onValueChange={setHeight}
          options={["200", "300", "400", "fill"].map((value) => ({
            value,
            label: value,
          }))}
        />
        <Select
          label="Value formatting"
          value={format}
          onValueChange={setFormat}
          options={["number", "currency", "ratio"].map((value) => ({
            value,
            label: value,
          }))}
        />
        <Field
          label="Chart label"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
        />
        <Field
          label="Chart description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <Select
          label="Orientation"
          value={orientation}
          onValueChange={(value) =>
            setOrientation(value as "vertical" | "horizontal")
          }
          options={["vertical", "horizontal"].map((value) => ({
            value,
            label: value,
          }))}
        />
        <Switch
          label="Show chart caption"
          value={caption}
          onValueChange={setCaption}
        />
        <Switch
          label="Show chart legend"
          value={legend}
          onValueChange={setLegend}
        />
        <Switch
          label="Highlight filter matches"
          value={highlight}
          onValueChange={setHighlight}
        />
        <Switch
          label="Bound values to zero–one"
          value={range}
          onValueChange={setRange}
        />
        <Switch
          label="Stack series"
          value={stacked}
          onValueChange={setStacked}
        />
        <Switch
          label="Loading chart"
          value={loading}
          onValueChange={setLoading}
        />
        <Switch label="Show target" value={target} onValueChange={setTarget} />
        <Switch
          label="Dark chart palette"
          value={dark}
          onValueChange={setDark}
        />
      </div>
      <div style={{ height: height === "fill" ? 400 : undefined }}>
        <ChartThemeProvider theme={dark ? "dark" : "light"}>
          <Chart
            label={label}
            description={description}
            type={type}
            height={height === "fill" ? "fill" : Number(height)}
            orientation={orientation}
            showCaption={caption}
            showLegend={legend}
            highlight={
              highlight
                ? { seriesIds: ["engineering"], pointIds: ["2026-01"] }
                : undefined
            }
            valueRange={range ? { min: 0, max: 1 } : undefined}
            stacked={stacked}
            loading={loading}
            labels={["Jan", "Feb", "Mar"]}
            pointIds={["2026-01", "2026-02", "2026-03"]}
            series={[
              {
                id: "engineering",
                label: "Engineering",
                values: [0.4, 0.6, 0.7],
              },
              { id: "design", label: "Design", values: [0.2, null, 0.3] },
            ]}
            referenceLine={target ? { label: "Target", value: 0.8 } : undefined}
            formatValue={(value) =>
              format === "currency"
                ? `£${value.toFixed(2)}`
                : format === "ratio"
                  ? `${(value * 100).toFixed(0)}%`
                  : String(value)
            }
            onPointSelect={(point) =>
              setSelection(
                `${point.seriesId} / ${point.pointId}: ${point.value}`,
              )
            }
          />
        </ChartThemeProvider>
      </div>
      <p role="status">{selection}</p>
      <p>
        Targets and stacking apply to cartesian charts. Null means missing data;
        it is not converted to zero. Changing formatting never changes the
        values. Selection uses series and point IDs.
      </p>
    </section>
  );
}
