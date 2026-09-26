import { Button, Field, type ButtonProps } from "@klein-ui/react";
import {
  ButtonExample,
  IconButtonExample,
  FieldExample,
  TabsExample,
  RouteTabsExample,
  ViewLayoutExample,
  ListViewTemplateExample,
} from "./examples";
export default { title: "Components" };
export const Actions = () => (
  <div className="docs-stack">
    <ButtonExample />
    <IconButtonExample />
    <Button variant="secondary">Cancel</Button>
    <Button variant="tertiary">Export</Button>
    <Button variant="text">View report</Button>
    <Button tone="danger">Delete budget</Button>
    <Button disabled>Unavailable</Button>
    <Button loading>Saving changes</Button>
  </div>
);
export const Fields = () => (
  <div className="docs-form">
    <FieldExample />
    <Field
      label="Annual limit"
      inputMode="decimal"
      defaultValue="-20"
      error="Enter an amount greater than zero."
    />
    <Field label="Owner" defaultValue="Finance" readOnly />
    <Field label="Archived field" disabled />
  </div>
);
export const LocalPanels = TabsExample;
export const RouteNavigation = RouteTabsExample;
export const DashboardLayout = ViewLayoutExample;
export const ListPage = ListViewTemplateExample;

export { EdgeToEdgeLayoutExample as EdgeToEdge } from "./examples";
