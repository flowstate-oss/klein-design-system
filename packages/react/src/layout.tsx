import type { ReactNode } from "react";

/** Approved view layouts. Named slots and tuple lengths prevent ambiguous grids. */
export type ViewLayoutProps =
  | { variant: "single"; main: ReactNode }
  | { variant: "2:1"; top: readonly [ReactNode, ReactNode]; main: ReactNode }
  | {
      variant: "2:2";
      top: readonly [ReactNode, ReactNode];
      bottom: readonly [ReactNode, ReactNode];
    }
  | {
      variant: "3:3";
      top: readonly [ReactNode, ReactNode, ReactNode];
      bottom: readonly [ReactNode, ReactNode, ReactNode];
    }
  | { variant: "tree:detail"; tree: ReactNode; detail: ReactNode };

/** Own the view's gutters and overflow; never add another padded page wrapper. */
export function ViewLayout(props: ViewLayoutProps) {
  if (props.variant === "single")
    return <div className="k-view-layout k-view-single">{props.main}</div>;
  if (props.variant === "tree:detail")
    return (
      <div className="k-view-layout k-view-split">
        <div className="k-view-tree">{props.tree}</div>
        <div className="k-view-detail">{props.detail}</div>
      </div>
    );
  return (
    <div className="k-view-layout k-view-grid" data-variant={props.variant}>
      <div className="k-view-grid-row">{props.top}</div>
      {props.variant === "2:1" ? (
        <div>{props.main}</div>
      ) : (
        <div className="k-view-grid-row">{props.bottom}</div>
      )}
    </div>
  );
}

/** A flat view region, not a decorative card. */
export interface ViewSectionProps {
  /** Region heading. */
  title: string;
  /** Optional region actions. */
  actions?: ReactNode;
  /** Chart, metric or sub-list content. */
  children: ReactNode;
}
/** Render a titled section with shared geometry. */
export function ViewSection({ title, actions, children }: ViewSectionProps) {
  return (
    <section className="k-view-section">
      <header>
        <h2>{title}</h2>
        {actions && <div className="k-actions">{actions}</div>}
      </header>
      <div className="k-section-body">{children}</div>
    </section>
  );
}

/** The one control surface above a view. */
export interface ViewControlPanelProps {
  /** Accessible region label. */
  label: string;
  /** Filter, search and period controls. */
  children: ReactNode;
  /** Applied filters rendered under the control row. */
  filters?: ReactNode;
  /** Trailing view actions. */
  actions?: ReactNode;
}
/** Render a control region; native Tab order is retained for mixed form controls. */
export function ViewControlPanel({
  label,
  children,
  actions,
  filters,
}: ViewControlPanelProps) {
  return (
    <div className="k-controls-region">
      <div className="k-view-controls" role="group" aria-label={label}>
        <div className="k-controls-start">{children}</div>
        {actions && <div className="k-actions">{actions}</div>}
      </div>
      {filters}
    </div>
  );
}

/** Complete list/index page composition. Data and persistence stay with the caller. */
export interface ListViewTemplateProps {
  /** PageHeader. */
  header: ReactNode;
  /** Optional RouteTabs. */
  navigation?: ReactNode;
  /** Exactly one ViewControlPanel. */
  controls: ReactNode;
  /** The view body. The single layout owns its scrolling. */
  children: ReactNode;
}
/** Keep the header, navigation, controls and scroll body in canonical order. */
export function ListViewTemplate({
  header,
  navigation,
  controls,
  children,
}: ListViewTemplateProps) {
  return (
    <div className="k-list-template">
      {header}
      {navigation}
      {controls}
      <ViewLayout variant="single" main={children} />
    </div>
  );
}

/** Display an already formatted measured value. No financial calculations. */
export interface NumericValueProps {
  /** Locale-aware text supplied by the application. */
  children: string;
  /** Meaning supplied by business rules, never inferred from a sign. @default neutral */
  tone?: "neutral" | "good" | "watch" | "bad";
}
/** Render tabular monospace numerics. */
export function NumericValue({
  children,
  tone = "neutral",
}: NumericValueProps) {
  return (
    <span className="k-numeric" data-tone={tone}>
      {children}
    </span>
  );
}
