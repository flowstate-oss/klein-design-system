"use client";
import { useMemo, type ReactNode } from "react";
import { List, CalendarRange, Columns3 } from "lucide-react";
import { ViewLayout } from "@klein-ui/react";
import { ViewProvider, useView } from "./ViewContext.js";
import { TableToolbar } from "./TableToolbar.js";
import { TableBody } from "./TableBody.js";
import { useTableLabels } from "./labels.js";
import { tokeniseGridTemplate } from "./table-sizing.js";
import type { TableConfig } from "./view-types.js";
import type { UseViewStateConfig } from "./view-state.js";
/** Complete table organism, previously DataView: one provider, toolbar, filters, properties and body. */
export interface TableCollectionProps<
  T,
  G extends string = string,
  S extends string = string,
> {
  /** Display-ready rows, columns and callbacks. All queries and mutations belong to the caller. */
  config: TableConfig<T, G, S>;
  /** Search, initial preferences and persistence callback from the application. */
  state?: Pick<
    UseViewStateConfig<G, S>,
    "search" | "initialState" | "onPersist"
  >;
  /** Saved-view service adapter; rendered inside the shared state provider. */
  savedViews?: ReactNode;
  /** Additional toolbar actions, for example an application CSV export adapter. */
  actions?: ReactNode;
}
/** Remove unavailable columns and their corresponding sizing tracks together. */
export function withSourcedColumns<T, G extends string, S extends string>(
  config: TableConfig<T, G, S>,
): TableConfig<T, G, S> {
  if (!config.columns.some((c) => c.hasSource === false)) return config;
  const tracks = config.propertiesGridTemplate
    ? tokeniseGridTemplate(config.propertiesGridTemplate)
    : null;
  return {
    ...config,
    columns: config.columns.filter((c) => c.hasSource !== false),
    propertiesGridTemplate: tracks
      ? tracks
          .filter((_, i) => config.columns[i]?.hasSource !== false)
          .join(" ")
      : config.propertiesGridTemplate,
  };
}
export function TableCollection<T, G extends string, S extends string>({
  config: input,
  state,
  savedViews,
  actions,
}: TableCollectionProps<T, G, S>) {
  const config = useMemo(() => withSourcedColumns(input), [input]);
  const visible = useMemo(
    () => config.columns.filter((c) => c.defaultVisible).map((c) => c.id),
    [config.columns],
  );
  const all = useMemo(() => config.columns.map((c) => c.id), [config.columns]);
  const defaultView = config.defaultViews?.find(
    (v) => v.id === config.initialDefaultViewId,
  );
  const initial =
    state?.initialState ??
    (defaultView?.preferences as UseViewStateConfig<G, S>["initialState"]);
  return (
    <ViewProvider
      config={{
        ...config,
        ...state,
        initialState: initial,
        defaultVisibleProperties: visible,
        allPropertyIds: all,
      }}
    >
      <TableCollectionContent
        config={config}
        savedViews={savedViews}
        actions={actions}
      />
    </ViewProvider>
  );
}
/** Compose below an existing ViewProvider when the page owns its state adapter. */
export function TableCollectionContent<T, G extends string, S extends string>({
  config,
  savedViews,
  actions,
}: Omit<TableCollectionProps<T, G, S>, "state">) {
  const t = useTableLabels();
  const icons = { list: List, timeline: CalendarRange, kanban: Columns3 };
  return (
    <div className="flex h-full min-h-0 flex-col">
      {!config.hideToolbar && (
        <TableToolbar
          viewId={config.viewId}
          savedViews={savedViews}
          filterCategories={config.filterCategories}
          showFilterChips={config.showFilterChips}
          hideGrouping={config.hideGrouping}
          groupOptions={config.groupOptions}
          groupNoneValue={config.groupNoneValue}
          propertyDefinitions={config.columns.map((c) => ({
            id: c.id,
            label: c.label,
            defaultVisible: c.defaultVisible,
          }))}
          view={config.view}
          dataSource={config.dataSource}
          periodControl={config.periodControl}
          sortOptions={config.sortOptions}
          displayModeOptions={(config.displayModes ?? ["list"]).map((mode) => ({
            value: mode,
            label: t(`view.${mode === "kanban" ? "board" : mode}`),
            icon: icons[mode],
          }))}
          onAdd={config.onAdd}
          addLabel={config.addLabel}
          addMenuActions={config.addMenuActions}
          extraToolbarActions={
            <>
              {config.extraToolbarActions}
              {actions}
            </>
          }
        />
      )}
      {config.betweenToolbarAndBody}
      <ViewLayout variant="single" main={<TableBody config={config} />} />
    </div>
  );
}
