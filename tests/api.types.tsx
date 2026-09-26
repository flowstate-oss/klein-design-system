import { Button, IconButton, ViewLayout, Tabs, Field } from "@klein-ui/react";
const invalidTone = (
  // @ts-expect-error Secondary danger is not an approved visual combination.
  <Button variant="secondary" tone="danger">
    Delete
  </Button>
);
// @ts-expect-error Public controls cannot be restyled.
const override = <Button style={{ borderRadius: 20 }}>Save</Button>;
// @ts-expect-error An icon action must have an accessible label.
const unnamed = <IconButton icon="search" />;
// @ts-expect-error A 2:1 layout needs exactly two top panels.
const wrongLayout = <ViewLayout variant="2:1" top={[<div />]} main={<div />} />;
// @ts-expect-error Local tabs are controlled and need a change callback.
const noHandler = <Tabs label="Details" value="a" items={[]} />;
// @ts-expect-error Checkbox is a separate component, not a text Field variant.
const checkbox = <Field label="Agree" type="checkbox" />;
void [invalidTone, override, unnamed, wrongLayout, noHandler, checkbox];

// New families keep application services and styling out of their closed contracts.
import { Table as KleinTable } from "@klein-ui/table";
import { Chart as KleinChart } from "@klein-ui/charts";
import { EddyComposer } from "@klein-ui/eddy";
const invalidTable = (
  <KleinTable
    label="People"
    rows={[]}
    rowKey={() => ""}
    columns={[]}
    // @ts-expect-error Table styling is owned by Klein.
    className="custom-table"
  />
);
const invalidChart = (
  <KleinChart
    label="Spend"
    type="line"
    labels={[]}
    series={[]}
    // @ts-expect-error Arbitrary vendor chart options are not part of the public chart API.
    options={{ plugins: {} }}
  />
);
const invalidEddy = (
  <EddyComposer
    value=""
    onValueChange={() => {}}
    onSubmit={() => {}}
    label="Message"
    sendLabel="Send"
    // @ts-expect-error The composer receives a submission callback, not a network endpoint.
    endpoint="/api/chat"
  />
);
