"use client";
import { ViewControlPanel as ControlPanel } from "@klein-ui/react";

/**
 * ViewControlPanel — the control pane (formerly Table's toolbar), extracted
 * to compose the shared `view-controls/*` widgets against `ViewContext`. It
 * reads/writes view state via `useView()`; the page supplies only the option
 * catalogs + first-class controls as props. MUST render before the ViewLayout.
 *
 *   LHS: saved views · filter · grouping · properties
 *   RHS: view pivot · sort · data source · period · display mode · reset · add
 */

import type {
  AddMenuAction,
  DataSourceControlConfig,
  FilterCategory,
  GroupOption,
  SortOption,
  TableDefaultView,
  TableDisplayMode,
  ViewControlConfig,
} from "./view-types.js";
import { Button } from "@klein-ui/react/compat/button";
import { ActiveFilterChips } from "./controls/ActiveFilterChips.js";
import {
  DisplayControl,
  type DisplayOption,
} from "./controls/DisplayControl.js";
import { FilterCombobox } from "./controls/FilterCombobox.js";
import { GroupingControl } from "./controls/GroupingControl.js";
import { PropertyPicker } from "./controls/PropertyPicker.js";
import { SplitAddButton } from "./controls/SplitAddButton.js";
import { SplitSortButton } from "./controls/SplitSortButton.js";
import { toolbarTrigger } from "./controls/toolbar-button-styles.js";
import { ToolbarSelect } from "./controls/ToolbarSelect.js";
import { useTableLabels } from "./labels.js";
import { Database, Layers, Plus, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { useView } from "./ViewContext.js";

interface PropertyDefinition {
  id: string;
  label: string;
  defaultVisible: boolean;
}

export interface TableToolbarProps<G extends string, S extends string> {
  /** Route key, for the SavedViewSelector. */
  viewId: string;
  /** Saved-view menu supplied by the application data adapter. */
  savedViews?: ReactNode;
  /**
   * The saved views this screen ships with, listed in the saved-view menu
   * above personal/shared views. Omit for none (the menu is unchanged).
   */
  defaultViews?: readonly TableDefaultView[];
  /** Id of the default view applied on first load, so the menu shows its name. */
  initialDefaultViewId?: string | null;
  /* ── LHS ── */
  filterCategories?: FilterCategory[];
  /**
   * Show the active filters as removable chips under the bar ("Team:
   * Platform ×"). Off by default so existing pages render as before; the Helm
   * screen template turns it on.
   */
  showFilterChips?: boolean;
  hideGrouping?: boolean;
  /**
   * Hide the sort control. A CHART dashboard has no row order to sort, so
   * rendering the control there would be a dead widget ("NO SHIT UI").
   * List surfaces leave this off.
   */
  hideSort?: boolean;
  /**
   * Hide the properties/column picker — same reasoning as {@link hideSort}: a
   * chart surface has no columns to show or hide.
   */
  hideProperties?: boolean;
  groupOptions: GroupOption<G>[];
  groupNoneValue: G;
  propertyDefinitions: PropertyDefinition[];
  /* ── RHS ── */
  view?: ViewControlConfig;
  dataSource?: DataSourceControlConfig;
  periodControl?: ReactNode;
  sortOptions: SortOption<S>[];
  displayModeOptions: DisplayOption<TableDisplayMode>[];
  /* ── Add / extras ── */
  onAdd?: () => void;
  addLabel?: string;
  addMenuActions?: AddMenuAction[];
  extraToolbarActions?: ReactNode;
}

export function TableToolbar<G extends string, S extends string>({
  viewId,
  savedViews,
  defaultViews,
  initialDefaultViewId,
  filterCategories,
  showFilterChips = false,
  hideGrouping,
  hideSort,
  hideProperties,
  groupOptions,
  groupNoneValue,
  propertyDefinitions,
  view,
  dataSource,
  periodControl,
  sortOptions,
  displayModeOptions,
  onAdd,
  addLabel,
  addMenuActions,
  extraToolbarActions,
}: TableToolbarProps<G, S>) {
  const tc = useTableLabels();
  const v = useView<G, S>();

  return (
    <ControlPanel
      label="Table controls"
      actions={
        <>
          {view && view.options.length > 1 && (
            <ToolbarSelect
              value={view.value}
              options={view.options}
              onChange={view.onChange}
              label={view.label}
              defaultIcon={Layers}
            />
          )}

          {!hideSort && (
            <SplitSortButton
              sortBy={v.state.sortBy as S}
              sortDir={v.state.sortDir}
              onSortByChange={v.setSortBy}
              onSortDirChange={v.setSortDir}
              options={sortOptions}
            />
          )}

          {dataSource && dataSource.options.length > 1 && (
            <ToolbarSelect
              value={dataSource.value}
              options={dataSource.options}
              onChange={dataSource.onChange}
              label={dataSource.label}
              defaultIcon={Database}
            />
          )}

          {periodControl}

          {displayModeOptions.length > 1 && (
            <DisplayControl
              value={v.state.displayMode}
              onChange={v.setDisplayMode}
              options={displayModeOptions}
            />
          )}

          {v.isModified && (
            <Button
              variant="ghost"
              size="sm"
              className={toolbarTrigger}
              onClick={v.reset}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {tc("reset")}
            </Button>
          )}

          {extraToolbarActions}

          {addMenuActions && addMenuActions.length > 0 ? (
            <SplitAddButton
              label={addLabel ?? tc("add")}
              onAdd={onAdd}
              actions={addMenuActions}
            />
          ) : (
            onAdd && (
              <Button
                variant="default"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={onAdd}
              >
                <Plus className="h-3.5 w-3.5" />
                {addLabel ?? tc("add")}
              </Button>
            )
          )}
        </>
      }
      filters={
        showFilterChips && filterCategories && filterCategories.length > 0 ? (
          <ActiveFilterChips
            categories={filterCategories}
            selected={v.state.filters}
            lockedFilters={v.lockedFilters}
            onRemove={(categoryId) => v.setFilter(categoryId, [])}
          />
        ) : undefined
      }
    >
      {savedViews}

      {filterCategories && filterCategories.length > 0 && (
        <FilterCombobox
          categories={filterCategories}
          selected={v.state.filters}
          lockedFilters={v.lockedFilters}
          onChange={v.setFilter}
          onClearAll={v.clearFilters}
        />
      )}

      {!hideGrouping && (
        <GroupingControl
          value={v.state.groupBy as G}
          onChange={v.setGroupBy}
          options={groupOptions.map((o) => ({
            value: o.value,
            label: o.label,
          }))}
          noneValue={groupNoneValue}
        />
      )}

      {!hideProperties && (
        <PropertyPicker
          properties={propertyDefinitions}
          visible={v.state.visibleProperties}
          onChange={v.setVisibleProperties}
        />
      )}
    </ControlPanel>
  );
}
