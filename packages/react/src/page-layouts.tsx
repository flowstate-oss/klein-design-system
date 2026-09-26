import type { ReactNode } from "react";
import { AiPageShell } from "./compat/ai-page-shell.js";
import { EntityDetailOverviewGrid } from "./compat/entity-detail-layout.js";
/** A compact dashboard with header, metrics and tabs above one scrollable body. */
export interface DashboardPageLayoutProps {
  header?: ReactNode;
  metrics?: ReactNode;
  tabs?: ReactNode;
  children: ReactNode;
}
export function DashboardPageLayout({
  header,
  metrics,
  tabs,
  children,
}: DashboardPageLayoutProps) {
  return (
    <AiPageShell header={header} kpis={metrics} tabs={tabs}>
      {children}
    </AiPageShell>
  );
}
/** Persistent detail header and tabs above a responsive properties/content/related composition. */
export interface DetailPageLayoutProps {
  header: ReactNode;
  tabs?: ReactNode;
  properties: ReactNode;
  supporting?: ReactNode;
  description: ReactNode;
  related: ReactNode;
  relatedTitle?: ReactNode;
  relatedActions?: ReactNode;
}
export function DetailPageLayout({
  header,
  tabs,
  properties,
  supporting,
  description,
  related,
  relatedTitle,
  relatedActions,
}: DetailPageLayoutProps) {
  return (
    <div className="k-detail-page">
      {header}
      {tabs}
      <div className="k-detail-page-body">
        <EntityDetailOverviewGrid
          properties={properties}
          capitalise={supporting}
          description={description}
          rightPanel={related}
          rightPanelTitle={relatedTitle}
          rightPanelAction={relatedActions}
        />
      </div>
    </div>
  );
}
/** App-level frame. Supply navigation and detail panels; the main region owns its scroll boundary. */
export interface WorkspaceLayoutProps {
  header: ReactNode;
  navigation?: ReactNode;
  details?: ReactNode;
  overlay?: ReactNode;
  children: ReactNode;
}
export function WorkspaceLayout({
  header,
  navigation,
  details,
  overlay,
  children,
}: WorkspaceLayoutProps) {
  return (
    <div className="k-workspace-layout">
      <header>{header}</header>
      <div className="k-workspace-body">
        {navigation && (
          <aside aria-label="Workspace navigation">{navigation}</aside>
        )}
        <main>{children}</main>
        {details && <aside aria-label="Details">{details}</aside>}
      </div>
      {overlay}
    </div>
  );
}
