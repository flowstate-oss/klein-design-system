/**
 * Type definitions for the unified Table component.
 *
 * Table is an opinionated component that owns toolbar, state, persistence,
 * layout, drag-and-drop, and multi-view rendering. Pages define *what* (data
 * shape, columns, actions, mutations) — the component owns *how*.
 */

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
type PlanChangeStatus = "ADDED" | "MODIFIED" | "DELETED";

/* -------------------------------------------------------------------------- */
/*                              Row Actions                                   */
/* -------------------------------------------------------------------------- */

/** A single action that can be performed on a row */
export interface RowAction {
  /** Unique key for this action */
  id: string;
  /** Display label */
  label: string;
  /** Icon rendered alongside the label */
  icon: LucideIcon;
  /** Handler invoked when the action is triggered */
  onClick: () => void;
  /** Visual variant — destructive renders in red */
  variant?: "default" | "destructive";
  /** Disables the action */
  disabled?: boolean;
  /**
   * Why a disabled action can't run, already translated — for an action a
   * tool can't support, the connection that would enable it ("Needs the
   * Flowstate Agent"). Shown with the label; see `applyActionAvailability`.
   */
  disabledReason?: string;
  /** Keyboard shortcut hint (e.g., "Enter", "⌘D") */
  shortcut?: string;
}

/* -------------------------------------------------------------------------- */
/*                              Filter Types                                  */
/* -------------------------------------------------------------------------- */

/** A single option within a filter category */
export interface FilterOption {
  id: string;
  label: string;
  /** Optional color dot for visual coding (e.g., lifecycle stages) */
  color?: string | null;
}

/**
 * A standard, discrete-option filter category (e.g. "Team", "Location",
 * "Role"). Selection is stored as the list of selected option IDs under the
 * category's `id` in Table's `filters` state.
 */
export interface FilterOptionsCategory {
  /** Discriminant. Optional for back-compat — absence means an options category. */
  kind?: "options";
  /** Unique key for this category (used as filter key in state) */
  id: string;
  /** Display label for the category */
  label: string;
  /** Icon shown in the category list */
  icon: LucideIcon;
  /** Available options within this category */
  options: FilterOption[];
}

/**
 * A custom filter category whose drilled-in panel is rendered by the page
 * rather than a discrete option list. Use this for filters that can't be
 * expressed as a set of option IDs — e.g. a comparison operator + numeric
 * amount. The value is still stored under the category's `id` in Table's
 * `filters` state as an opaque, page-encoded `string[]` (typically one
 * element), so it flows through the active-count badge, persistence, and
 * clear-all exactly like an options category.
 */
export interface FilterCustomCategory {
  kind: "custom";
  /** Unique key for this category (used as filter key in state) */
  id: string;
  /** Display label for the category */
  label: string;
  /** Icon shown in the category list */
  icon: LucideIcon;
  /**
   * Renders the drilled-in panel. Receives the current encoded value(s), a
   * setter that writes them back into `filters[id]` (pass `[]` to clear), and
   * a callback that closes the filter popover.
   */
  renderPanel: (args: {
    value: string[];
    onChange: (next: string[]) => void;
    onClose: () => void;
  }) => ReactNode;
  /**
   * Optional short summary of the active value, shown on the level-1 category
   * row in place of the numeric count badge (e.g. "> $150,000"). Return null
   * when no value is set.
   */
  summary?: (value: string[]) => string | null;
}

/** A category of filters (e.g., "Team", "Location", "Role") */
export type FilterCategory = FilterOptionsCategory | FilterCustomCategory;

/* -------------------------------------------------------------------------- */
/*                              Column Types                                  */
/* -------------------------------------------------------------------------- */

/** A property column definition for a Table */
export interface TableColumn<T> {
  /** Unique key for this column (used in visibleProperties preference) */
  id: string;
  /** Display label in the property picker AND in the list-view column header (when `propertiesGridTemplate` is set on Table). */
  label: string;
  /**
   * Responsive hide priority. Lower number = hidden sooner on narrow viewports.
   * 1: Hides first (narrowest)
   * 2: Hides second
   * 3: Hides third
   * 4+: Always visible (unless manually hidden via property picker)
   */
  priority: number;
  /** Whether this column is visible by default */
  defaultVisible: boolean;
  /** Render function for this column's content in a row */
  render: (item: T) => ReactNode;
  /**
   * Optional explanatory copy shown behind an (i) tooltip next to the column
   * header label (the same affordance as `ViewSection`'s `info`). Only rendered
   * when `propertiesGridTemplate` is set on Table (i.e. a header row exists).
   */
  headerInfo?: ReactNode;
  /**
   * Horizontal alignment for the column-header cell in list view. Use
   * `'end'` for right-aligned numeric columns (cost, duration) so the
   * header label hugs the right edge alongside the cell value. Has no
   * effect when `propertiesGridTemplate` is not set on Table (no
   * header row is rendered in that case). Defaults to `'start'`.
   */
  headerAlign?: "start" | "end" | "center";
  /**
   * Whether this column has a data source in the current view. Defaults to
   * `true`. A column with `hasSource: false` (e.g. a provider that doesn't
   * report the figure) is removed from the table AND from the property picker
   * — it is never rendered as a blank column. Its entries in `summaryRow` /
   * `groupSummary` are ignored with it.
   */
  hasSource?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                              Bulk actions                                  */
/* -------------------------------------------------------------------------- */

/**
 * An action run on every selected row at once, shown in the bulk action bar
 * while at least one row is selected. Mirrors {@link RowAction}.
 */
export interface BulkAction {
  /** Unique key for this action. */
  id: string;
  /** Display label, already translated. */
  label: string;
  /** Icon rendered alongside the label. */
  icon: LucideIcon;
  /**
   * Runs the action on the selected row ids (see `TableConfig.getRowId`).
   * When it resolves, the selection is cleared; when it throws or rejects the
   * selection is kept so the user can retry — the page reports its own error.
   */
  onRun: (ids: string[]) => void | Promise<void>;
  /** Visual variant — destructive renders in red. */
  variant?: "default" | "destructive";
  /** Disables the action. */
  disabled?: boolean;
  /** Why a disabled action can't run, already translated. Shown on hover/focus. */
  disabledReason?: string;
}

/* -------------------------------------------------------------------------- */
/*                              Default saved views                           */
/* -------------------------------------------------------------------------- */

/**
 * A saved view a screen ships with ("Each screen ships with default saved
 * views"). Listed in its own group above the viewer's personal and shared
 * views and applied exactly like a saved view (`applySavedView`). Not stored
 * in the database and not editable.
 */
export interface TableDefaultView {
  /** Stable id, unique within the screen. */
  id: string;
  /** Display name, already translated. */
  name: string;
  /** The view preferences it applies — the same shape a saved view stores. */
  preferences: Record<string, unknown>;
}

/* -------------------------------------------------------------------------- */
/*                              CSV export                                    */
/* -------------------------------------------------------------------------- */

/** One column of a list's CSV export. */
export interface TableCsvColumn<T> {
  /** Column header in the file, already translated. */
  header: string;
  /**
   * The cell value — a plain figure (a number, or a decimal string for money
   * in major units), never a formatted, symbol-bearing display string.
   */
  value: (item: T) => string | number | null;
  /**
   * The `TableColumn.id` this CSV column mirrors. When set, the CSV column
   * is exported only while that table column is visible (picked in the
   * property picker and `hasSource !== false`), so the file matches the view.
   * Omit for columns that always export (e.g. the name or the currency code).
   */
  columnId?: string;
}

/**
 * Configuration for a list's "Export" button (CSV of the current view).
 */
export interface TableCsvExport<
  T,
  G extends string = string,
  S extends string = string,
> {
  /** File name offered to the user, ending `.csv`. */
  filename: string;
  /** The exported columns, in file order. */
  columns: readonly TableCsvColumn<T>[];
  /**
   * Fetch EVERY row matching the current view state (search, filters, sort) —
   * not just the page on screen. Pages SHOULD pass this: without it the export
   * holds only the rows currently loaded (one page).
   */
  fetchRows?: (state: TableState<G, S>) => Promise<T[]>;
}

/* -------------------------------------------------------------------------- */
/*                              Date Range Types (Timeline)                   */
/* -------------------------------------------------------------------------- */

/** A date range definition for timeline view. Views can offer multiple date ranges. */
export interface TableDateRange<T> {
  /** Unique key (e.g., 'employment', 'allocation') */
  id: string;
  /** Display label (e.g., 'Employment period', 'Project allocation') */
  label: string;
  /** Extract start date from an item. Null = no start (renders from left edge). */
  start: (item: T) => Date | null;
  /** Extract end date from an item. Null = ongoing (renders with gradient/arrow to right edge). */
  end: (item: T) => Date | null;
}

/* -------------------------------------------------------------------------- */
/*                              Property Mutation Types (DnD)                 */
/* -------------------------------------------------------------------------- */

/** Props passed to a side-effect render function during drag-and-drop */
export interface PropertyMutationSideEffectProps<T> {
  /** The item being moved */
  item: T;
  /** The target group value (e.g., team ID) */
  targetValue: string;
  /** Display label for the target (e.g., "Product Team") */
  targetLabel: string;
  /** Call this to confirm the mutation */
  onConfirm: () => void;
  /** Call this to cancel the mutation */
  onCancel: () => void;
}

/**
 * Configures how a groupBy attribute is mutated when items are dragged
 * between groups. Each config maps a `propertyKey` (which matches a
 * `groupBy` value) to a mutation function and optional side-effect UI.
 */
export interface PropertyMutationConfig<T> {
  /** The property key this handles (must match a groupBy option value) */
  propertyKey: string;

  /**
   * Execute the mutation. Called from drag-drop, popovers, context menus.
   * Return true on success, false on failure.
   */
  mutate: (item: T, newValue: string) => Promise<boolean>;

  /**
   * Optional side-effect flow. When defined, the Table renders this UI
   * instead of calling mutate() directly — letting the user confirm or
   * provide additional data (e.g., "When should this team change take effect?").
   *
   * The rendered component receives the item, target, and confirm/cancel callbacks.
   */
  sideEffect?: {
    render: (props: PropertyMutationSideEffectProps<T>) => ReactNode;
  };
}

/* -------------------------------------------------------------------------- */
/*                              Add-menu Action Types                         */
/* -------------------------------------------------------------------------- */

/**
 * A secondary action shown in the split-dropdown attached to the "Add" button.
 * The primary click still fires `TableConfig.onAdd`; these populate the
 * chevron menu beside it (e.g. "Bulk adjust salary").
 */
export interface AddMenuAction {
  /** Unique key for this action */
  id: string;
  /** Display label */
  label: string;
  /** Optional icon rendered alongside the label */
  icon?: LucideIcon;
  /** Handler invoked when the action is triggered */
  onClick: () => void;
  /** Disables the action (e.g. until a precondition is met) */
  disabled?: boolean;
  /** Short reason shown beneath the label when the action is disabled */
  disabledReason?: string;
  /** Optional test id applied to the menu item */
  testId?: string;
}

/* -------------------------------------------------------------------------- */
/*                              Sort / Group Option Types                     */
/* -------------------------------------------------------------------------- */

/** A sort option for the toolbar */
export interface SortOption<T extends string = string> {
  value: T;
  label: string;
}

/** A group option for the toolbar */
export interface GroupOption<T extends string = string> {
  value: T;
  label: string;
}

/* -------------------------------------------------------------------------- */
/*                       Server-side grouping (group sort)                     */
/* -------------------------------------------------------------------------- */

/**
 * A server-computed group bucket: a group's TRUE total over the full filtered
 * set. Mirrors the GraphQL `ListGroup` type. The server group-orders the rows
 * (one node per row carries `listGroupKey`/`listGroupLabel`); these buckets give
 * the accurate per-group header counts.
 */
export interface ListGroup {
  key: string;
  label: string;
  count: number;
}

/** Display mode option for the toolbar */
export type TableDisplayMode = "list" | "timeline" | "kanban";

export interface DisplayModeOption {
  value: TableDisplayMode;
  label: string;
  icon: LucideIcon;
}

/* -------------------------------------------------------------------------- */
/*          Optional first-class toolbar controls (page-controlled)           */
/* -------------------------------------------------------------------------- */

/**
 * One option in a value-based toolbar control (the "view" pivot or the data
 * source). The optional icon prefixes the option in the dropdown.
 */
export interface ToolbarControlOption {
  value: string;
  label: string;
  icon?: LucideIcon;
  /**
   * Locked option — still selectable (so a page can route to an upgrade
   * sneak-peek) but rendered with a trailing lock glyph + muted text to signal
   * it needs an upgrade. Used by the AI-insights dimension control.
   */
  locked?: boolean;
}

/**
 * The data "view" pivot — e.g. `Projects | Members`. Rendered as a dropdown in
 * the toolbar (RHS) only when provided. Fully controlled by the page; never
 * persisted. Renders `value` exactly as given.
 */
export interface ViewControlConfig {
  value: string;
  options: ToolbarControlOption[];
  onChange: (value: string) => void;
  /** Optional prefix, e.g. "View". */
  label?: string;
}

/**
 * The reporting data source — e.g. submissions / estimate / disparity.
 * Rendered as a dropdown (RHS) only when there is more than one option. Fully
 * controlled by the page; never persisted. Renders `value` exactly as given —
 * it must NOT default to `options[0]`.
 */
export interface DataSourceControlConfig {
  value: string;
  options: ToolbarControlOption[];
  onChange: (value: string) => void;
  /** Optional prefix, e.g. "Source". */
  label?: string;
}

/* -------------------------------------------------------------------------- */
/*                              Summary (totals) row                          */
/* -------------------------------------------------------------------------- */

/**
 * A totals row pinned beneath a list-view table. Its figures are supplied by
 * the page — typically computed on the server over EVERY row that matches the
 * current filters, not only the page on screen — so the title should say what
 * it covers (e.g. "Totals for all 175 people"). Table never sums rows
 * itself: a client-side sum of one page would silently disagree with the
 * figure the page states elsewhere.
 */
export interface TableSummaryRow {
  /** Content of the title column: what the row is and what it covers. */
  title: ReactNode;
  /**
   * Cell content keyed by `TableColumn.id`. A visible column with no entry
   * renders an empty cell; hidden columns are skipped with their header.
   */
  cells: Partial<Record<string, ReactNode>>;
  /** Optional `data-testid` on the row. */
  testId?: string;
}

/* -------------------------------------------------------------------------- */
/*                              Pagination options                            */
/* -------------------------------------------------------------------------- */

/**
 * A list's page-size choices. When the view's page size is not one of
 * `pageSizeOptions` (e.g. the view system's untouched default), Table moves
 * it to `defaultPageSize` once, on mount; a size the viewer has picked from the
 * options is kept.
 */
export interface TablePaginationOptions {
  /** Sizes offered by the page-size selector, ascending. */
  pageSizeOptions: number[];
  /** The size a view starts on; must be one of `pageSizeOptions`. */
  defaultPageSize: number;
}

/* -------------------------------------------------------------------------- */
/*                              Table State                                */
/* -------------------------------------------------------------------------- */

/** The full view state exposed via onStateChange callback */
export interface TableState<
  G extends string = string,
  S extends string = string,
> {
  search: string;
  sortBy: S;
  sortDir: "asc" | "desc";
  groupBy: G;
  filters: Record<string, string[]>;
  page: number;
  pageSize: number;
  displayMode: TableDisplayMode;
  visibleProperties: string[];
}

/* -------------------------------------------------------------------------- */
/*                              Table Config (Main API)                    */
/* -------------------------------------------------------------------------- */

/**
 * The full configuration for a Table instance.
 *
 * This is the single, opinionated API that all list pages use. Pages define
 * their data shape, columns, and actions. Table owns rendering, state,
 * toolbar, pagination, drag-and-drop, and view switching.
 */
export interface TableConfig<
  T,
  G extends string = string,
  S extends string = string,
> {
  /* ─── Identity ─── */

  /** Route key for persisting preferences (e.g., 'team/people') */
  viewId: string;

  /* ─── Data ─── */

  /** The items to display */
  items: T[];
  /** Whether a data fetch is in progress */
  loading: boolean;
  /** Total count of items matching current filters (for pagination) */
  totalCount: number;
  /** Pagination page info from GraphQL */
  pageInfo?: { hasNextPage: boolean; hasPreviousPage: boolean };

  /* ─── Row rendering ─── */

  /** Extract a unique key from an item */
  rowKey: (item: T) => string;
  /** Render the avatar/icon slot for a row */
  avatar: (item: T) => ReactNode;
  /** Render the title slot for a row */
  title: (item: T) => ReactNode;
  /**
   * Header label for the leading title column. Defaults to the shared
   * `common:name` string ("Name"); set it when the title is something other
   * than a name (e.g. a session "Purpose").
   */
  titleColumnLabel?: ReactNode;
  /** Render the optional subtitle slot for a row */
  subtitle?: (item: T) => ReactNode;
  /** Handler when a row is clicked (e.g., open detail drawer) */
  onRowClick?: (item: T) => void;
  /**
   * The entity page a row opens (list mode). Clicking a row navigates there
   * with the app router; cmd/ctrl-click opens it in a new tab. Clicks on the
   * row's actions, its checkbox, or any cell content that stops propagation do
   * not navigate. Ignored when `onRowClick` is also given — `onRowClick` wins.
   * Unlike `onRowClick`, a click anywhere in the row (property cells included)
   * navigates, so interactive cell content must stop click propagation itself.
   */
  rowHref?: (item: T) => string;
  /**
   * Handler when a row is double-clicked (e.g., navigate to a detail page).
   * Single-click (`onRowClick`) behaviour is left untouched — a double-click
   * fires `onRowClick` once on the first click and then `onRowDoubleClick`.
   */
  onRowDoubleClick?: (item: T) => void;
  /** Extract change status for plan-aware styling */
  changeStatus?: (item: T) => PlanChangeStatus | null;

  /* ─── Columns / Properties ─── */

  /** Column definitions for the properties displayed on each row */
  columns: TableColumn<T>[];

  /* ─── Row Actions ─── */

  /** The primary action button shown on each row (always visible) */
  primaryAction?: (item: T) => RowAction;
  /** Additional actions shown in the overflow "..." menu */
  overflowActions?: (item: T) => RowAction[];
  /**
   * Hide each row's actions until the row is hovered or has focus within it.
   * The actions keep their width while hidden, so columns never jump. Defaults
   * to `false` (actions always visible).
   */
  rowActionsOnHover?: boolean;

  /* ─── Bulk select ─── */

  /**
   * Actions run on every selected row. When set (and non-empty), list mode
   * gains a leading checkbox column — the header checkbox selects the rows on
   * the current page — and a bulk action bar shows "{count} selected", these
   * actions and Clear. The selection is kept by id across pages until cleared.
   */
  bulkActions?: readonly BulkAction[];
  /**
   * The id a selected row contributes to `BulkAction.onRun`. Defaults to
   * `rowKey`; set it when the row key is not the entity id.
   */
  getRowId?: (item: T) => string;
  /**
   * Wraps each rendered row to attach a right-click context menu. Receives the
   * item and the already-rendered row element, and must return the row wrapped
   * in a context-menu component (e.g. `<TeamRowContextMenu>{row}</…>`). The
   * wrapper component is expected to render the row via `<ContextMenuTrigger
   * asChild>` — `DataRow` forwards refs/props so this works directly.
   */
  rowContextMenu?: (item: T, row: ReactNode) => ReactNode;

  /* ─── Sorting ─── */

  /** Available sort options for the toolbar */
  sortOptions: SortOption<S>[];
  /** Default sort field */
  defaultSortBy: S;
  /** Default sort direction */
  defaultSortDir?: "asc" | "desc";

  /* ─── Grouping ─── */

  /** Available group options for the toolbar */
  groupOptions: GroupOption<G>[];
  /** Default group-by value */
  defaultGroupBy: G;
  /** The value that represents "no grouping" */
  groupNoneValue: G;
  /** Custom label for a group header (defaults to the raw group key) */
  groupTitle?: (groupKey: string) => string;
  /** Optional right-aligned content in group headers (e.g., subtotals) */
  groupSubtitle?: (groupKey: string, items: T[]) => ReactNode;
  /**
   * Per-column content for each group header row (list mode), keyed by
   * `TableColumn.id` — "group rows total every measure". Cells sit under
   * their own columns with the same widths and order as the `summaryRow`
   * cells, so a page can put each group's total (and the same inline bar the
   * rows show) in every measure column. The page supplies the figures —
   * normally the server's per-group totals over the full filtered set, not a
   * sum of the loaded rows. The group label, count and `groupSubtitle` stay in
   * the leading cell. A visible column with no entry renders an empty cell.
   */
  groupSummary?: (group: {
    key: string;
    items: T[];
  }) => Partial<Record<string, ReactNode>>;
  /**
   * @deprecated Legacy client-side grouping over the current page only — this
   * is the source of the "filter/group only affects page 1" bug. Prefer
   * `grouped` (server-side buckets + lazy per-group rows). Still honoured for
   * pages not yet migrated: when `grouped` is absent and this is provided,
   * Table groups the fetched page client-side.
   */
  groupKeyExtractor?: (item: T, groupBy: G) => string;

  /**
   * Server-computed group buckets (key, label, and TRUE count over the full
   * filtered set) for the active grouping. The page supplies these from its list
   * query's `groups`. Table renders accurate group-header counts from them;
   * the rows themselves are the normal paginated `items`, grouped generically by
   * each node's server-emitted `listGroupKey`/`listGroupLabel`.
   */
  groups?: ListGroup[];

  /* ─── Filtering ─── */

  /** Filter categories for the nested filter combobox */
  filterCategories?: FilterCategory[];
  /**
   * Show the active filters as removable chips under the toolbar (see
   * `ViewControlPanel`'s `showFilterChips`). Off by default.
   */
  showFilterChips?: boolean;

  /**
   * Context-derived default filter selections, keyed by filter-category id
   * (e.g. `{ teamId: ['team_123'] }`). These are *soft* defaults: a category is
   * seeded from here only while the user has not made their own choice for it,
   * and the default tracks the surrounding context — when it changes (e.g. the
   * active plan switches) a previously auto-applied value the user never edited
   * is replaced or cleared. A user's explicit selection is never overridden.
   * See `UseViewStateConfig.defaultFilters` for the full semantics.
   */
  defaultFilters?: Record<string, string[]>;

  /**
   * Filter categories LOCKED to a fixed value — the authoritative, non-clearable
   * counterpart to `defaultFilters`, keyed by category id (e.g.
   * `{ teamId: ['team_123'] }`). A locked category cannot be changed or cleared
   * by the user, overrides any persisted/saved value, and renders read-only in
   * the filter menu (only the locked option shown, non-toggleable, excluded from
   * clear-all). Use it to hard-scope a view to a context the user must not escape
   * — e.g. a per-team budget proposal pinned to its own team. See
   * `UseViewStateConfig.lockedFilters` for the full semantics.
   */
  lockedFilters?: Record<string, string[]>;

  /* ─── Display modes ─── */

  /** Which display modes are available for this view */
  displayModes?: TableDisplayMode[];
  /** Default display mode */
  defaultDisplayMode?: TableDisplayMode;

  /* ─── Timeline config ─── */

  /** Date range definitions for timeline view. Users can switch between them. */
  dateRanges?: TableDateRange<T>[];
  /** ID of the default date range */
  defaultDateRange?: string;

  /* ─── Drag-and-drop ─── */

  /**
   * Property mutation configs for drag-and-drop. Each config maps a groupBy
   * value to a mutation. When the user drags an item between groups, Table
   * looks up the config for the current groupBy and triggers the mutation.
   */
  propertyMutations?: PropertyMutationConfig<T>[];

  /* ─── First-class toolbar controls (optional, page-controlled) ─── */

  /**
   * Data "view" pivot (e.g. Projects | Members) — a consistent dropdown in the
   * toolbar RHS. Rendered only when provided. Controlled; never persisted.
   */
  view?: ViewControlConfig;
  /**
   * Reporting data-source selector (e.g. submissions / estimate / disparity) —
   * rendered in the toolbar RHS only when it has more than one option.
   */
  dataSource?: DataSourceControlConfig;
  /**
   * Period / date-range control (FY·Q or relative range), rendered in the
   * standard RHS slot so it sits consistently across pages. Pages pass their
   * own period control (e.g. `<FiscalPeriodControl>`); Table only positions
   * it. Use a value-based control above for view/source; period stays a node
   * because its range logic is page-specific.
   */
  periodControl?: ReactNode;

  /**
   * Optional content rendered as a fixed flex child BETWEEN the control panel
   * (toolbar) and the scrolling body. Use for a dashboard that mixes charts +
   * a table: pass the KPI band + charts here so the ONE `ViewControlPanel`
   * sits ABOVE them, the charts stay put, and only the list rows scroll. Stays
   * `undefined` for ordinary list pages.
   */
  betweenToolbarAndBody?: ReactNode;

  /* ─── Toolbar extras ─── */

  /** Handler for the "Add" button. If undefined, no add button is shown. */
  onAdd?: () => void;
  /** Label for the add button (defaults to common.action.add) */
  addLabel?: string;
  /**
   * Secondary actions for the "Add" button. When provided (and `onAdd` is set),
   * the Add button becomes a split-dropdown: the primary click fires `onAdd`,
   * and a chevron opens a menu of these actions. When omitted, a plain Add
   * button is rendered.
   */
  addMenuActions?: AddMenuAction[];
  /** Bespoke toolbar actions before the add button — the exception, not the
   * default. Prefer `view` / `dataSource` / `periodControl` / `filterCategories`. */
  extraToolbarActions?: ReactNode;
  /**
   * Adds an "Export" button to the toolbar that downloads the current view as
   * CSV. See {@link TableCsvExport}: pass `fetchRows` so the file holds
   * every row of the current filters and sort, not only the loaded page.
   * Not rendered when `hideToolbar` is set.
   */
  csvExport?: TableCsvExport<T, G, S>;

  /* ─── Default saved views ─── */

  /**
   * The saved views this screen ships with, listed in their own group above
   * the viewer's personal and shared views in the saved-view menu.
   */
  defaultViews?: readonly TableDefaultView[];
  /**
   * Id of a `defaultViews` entry applied once on first load — only when the
   * viewer has no persisted state for this view yet, so it never overrides a
   * returning viewer's own layout.
   */
  initialDefaultViewId?: string;

  /* ─── State callback ─── */

  /**
   * Called whenever view state changes. Pages use this to update their
   * GraphQL query variables for server-side filtering/sorting/grouping.
   */
  onStateChange?: (state: TableState<G, S>) => void;

  /* ─── Empty states ─── */

  /** Rendered when there are no items at all */
  emptyState?: ReactNode;
  /** Rendered when filters/search return no results */
  emptyFilteredState?: ReactNode;

  /* ─── Optional hiding ─── */

  /** Hide the grouping control in the toolbar */
  hideGrouping?: boolean;
  /** Hide pagination controls */
  hidePagination?: boolean;
  /**
   * Page-size choices and the size a view starts on. Omit for the view
   * system's defaults (25 / 50 / 100 / 200, starting at 50).
   */
  pagination?: TablePaginationOptions;

  /* ─── Summary row ─── */

  /**
   * A totals row pinned beneath the list-view table (list mode only). See
   * {@link TableSummaryRow}: its figures come from the page, never from a
   * sum of the rows on screen.
   */
  summaryRow?: TableSummaryRow;
  /** Hide the entire view control panel — the page supplies its own controls above. */
  hideToolbar?: boolean;

  /* ─── Row layout overrides ─── */

  /**
   * Optional CSS `grid-template-columns` value applied to each row's
   * properties container. When set, every property cell becomes a
   * fixed-width grid track instead of a flex item — so the columns of
   * property cells line up vertically across rows (the standard
   * flex/gap layout lets each row size its own cells, which works for
   * sparse property sets but reads as "tightly packed pills" on
   * data-dense views).
   *
   * The template MUST declare one track per column in `config.columns`
   * declaration order. Tracks for columns hidden by the PropertyPicker
   * are skipped on the fly — Table only renders visible columns and
   * passes the matching slice of the template to each row, so the
   * surviving cells keep their relative widths.
   */
  propertiesGridTemplate?: string;
}
