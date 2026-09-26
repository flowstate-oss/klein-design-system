"use client";

/** Presentation state for the table collection. Persistence and routing are application adapters. */

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import type { TableState, TableDisplayMode } from "./view-types.js";
import {
  mergeSharedFilters,
  pickSharedFilters,
  useSharedFilters,
} from "./shared-filters.js";

/** Internal, persisted view state. (Was `InternalState` inside Table.) */
export interface ViewState {
  sortBy: string;
  sortDir: "asc" | "desc";
  groupBy: string;
  filters: Record<string, string[]>;
  visibleProperties: string[];
  displayMode: TableDisplayMode;
  expandedGroups: Record<string, boolean>;
  page: number;
  pageSize: number;
  /**
   * Per-group "show more" window (1-based) for server-side grouping. Keyed by
   * the group's `ListGroup.key`. Each expanded group lazily loads
   * `groupPage * groupPageSize` rows. Transient; reset whenever the filtered
   * set re-buckets (group/filter/sort/search change).
   */
  groupPages: Record<string, number>;
  timelineDateField: string;
  /**
   * Persisted-only bookkeeping: every property id the view had CONFIGURED at
   * the time the state was last saved. On load, any default-visible property
   * NOT in this set is treated as new-since-save and surfaced, while a
   * property the user deliberately hid (known but not visible) stays hidden.
   *
   * Optional for backwards compatibility with the FROZEN persisted shape:
   * pre-existing blobs without it keep loading unchanged, with
   * `visibleProperties` doubling as the known set on first read (see
   * {@link resolveInitialViewState}).
   */
  knownProperties?: string[];
  /**
   * User-set column widths in pixels, keyed by TanStack column id (the
   * `TableColumn.id`). Written by the table's column-resize handles and fed
   * back into TanStack's `columnSizing` state; absent columns fall back to the
   * width derived from `propertiesGridTemplate`.
   *
   * Optional/additive to the FROZEN persisted shape — exactly like
   * {@link ViewState.knownProperties}: pre-existing blobs without it load
   * unchanged (all columns auto-sized), and `resolveInitialViewState` spreads
   * it through verbatim. Deliberately NOT part of the external `TableState`
   * snapshot — column widths are presentation, not a server-query input, so a
   * resize must never trigger a re-query. Cleared by {@link ViewStateApi.reset}
   * (the `defaults` object omits it).
   */
  columnSizing?: Record<string, number>;
  /**
   * User-set column order — the full list of column ids (incl. the synthetic
   * avatar/title/actions columns) in display order, written when the user drags
   * a table header to reorder. Fed into TanStack's `columnOrder` state.
   *
   * Optional/additive to the FROZEN persisted shape, exactly like
   * {@link ViewState.columnSizing}: old blobs without it load in declaration
   * order, it is excluded from the external `TableState` snapshot (pure
   * presentation, never re-queries), and it is cleared by
   * {@link ViewStateApi.reset}.
   */
  columnOrder?: string[];
}

/** The slice of TableConfig the state machine needs. */
export interface UseViewStateConfig<G extends string, S extends string> {
  viewId: string;
  /** Initial persisted presentation state, supplied by the application. */
  initialState?: Partial<ViewState> | null;
  /** Application persistence adapter; called only for changed presentation state. */
  onPersist?: (viewId: string, state: ViewState) => void;
  /** Search after application routing/debounce, ready for queries. */
  search?: string;

  defaultSortBy: S;
  defaultSortDir?: "asc" | "desc";
  defaultGroupBy: G;
  defaultVisibleProperties: string[];
  defaultDisplayMode?: TableDisplayMode;
  defaultDateRange?: string;
  dateRanges?: { id: string }[];
  /**
   * Context-derived default filter selections, keyed by filter-category id
   * (e.g. `{ teamId: ['team_123'] }`). Applied to a category ONLY while the user
   * has not made their own choice for it — a soft default, never a lock:
   *
   *  - On first load (or when this value changes, e.g. the active plan switches)
   *    a category is seeded from here only if it is currently empty.
   *  - A user choice is sacrosanct: once the user edits a category, the default
   *    never overrides it again.
   *  - When the default changes (e.g. moving between two budget proposals, or
   *    leaving a proposal for the main plan), a *previously auto-applied* value
   *    that the user never touched is replaced/cleared so the default tracks the
   *    context and never lingers where it no longer applies.
   *
   * May be `undefined` (no context default) — the common case.
   */
  defaultFilters?: Record<string, string[]>;
  /**
   * Filter categories LOCKED to a fixed value — the authoritative, non-clearable
   * counterpart to {@link defaultFilters}. Keyed by category id (e.g.
   * `{ teamId: ['team_123'] }`). A locked category is force-set to its value on
   * load and whenever it changes, cannot be altered via {@link ViewStateApi.setFilter},
   * and is preserved by {@link ViewStateApi.clearFilters}/{@link ViewStateApi.reset}.
   *
   * Used to HARD-scope a view to a context the user must not escape — e.g. a
   * per-team budget proposal scoping its workforce lists to the proposal's team,
   * so a manager of several teams cannot view or edit a different team from inside
   * it (a change made against an out-of-scope team would silently not apply to
   * the proposal). Unlike a soft default, the lock overrides even a persisted or
   * saved-view value for that category.
   *
   * May be `undefined` (no lock) — the common case.
   */
  lockedFilters?: Record<string, string[]>;
  /**
   * Every property id the view currently configures (visible or not) —
   * typically `config.columns.map((c) => c.id)`. Persisted as
   * {@link ViewState.knownProperties} so a column added AFTER a user saved
   * their view state can still surface when it is default-visible, without
   * resurrecting columns the user deliberately hid. Optional: when omitted,
   * the union of the current visible + default-visible properties is
   * persisted instead.
   */
  allPropertyIds?: string[];
  onStateChange?: (state: TableState<G, S>) => void;
}

/**
 * Merge persisted view state over the defaults, surfacing default-visible
 * properties the saved state has never seen. Persisted state wins wholesale
 * EXCEPT for `visibleProperties`, where any default-visible property absent
 * from the persisted known set (`knownProperties`, falling back to the
 * persisted `visibleProperties` for pre-existing blobs without it) is
 * appended — so a column added after the user saved their view still shows
 * up, while a column the user deliberately hid (known but not visible)
 * stays hidden.
 *
 * Backwards compatible with the FROZEN persisted shape: `knownProperties` is
 * an optional addition; old blobs without it load exactly as before, plus the
 * new-column surfacing.
 *
 * Columns appended here land in `knownProperties` on the next persist write,
 * so the resurface happens exactly once: for a pre-`knownProperties` blob, a
 * default-visible column the user had hidden reappears on this load, but
 * hiding it again sticks for good.
 *
 * @param args.defaults - The view's default state (from config).
 * @param args.persisted - The persisted blob (null when nothing is stored).
 * @param args.defaultVisibleProperties - Property ids visible by default.
 * @returns The initial {@link ViewState} for the view.
 */
export function resolveInitialViewState(args: {
  defaults: ViewState;
  persisted: Partial<ViewState> | null;
  defaultVisibleProperties: string[];
}): ViewState {
  const { defaults, persisted, defaultVisibleProperties } = args;
  if (!persisted) return defaults;
  const known = new Set(
    persisted.knownProperties ?? persisted.visibleProperties ?? [],
  );
  const newlyDefault = defaultVisibleProperties.filter((id) => !known.has(id));
  return {
    ...defaults,
    ...persisted,
    visibleProperties: [
      ...new Set([
        ...(persisted.visibleProperties ?? defaults.visibleProperties),
        ...newlyDefault,
      ]),
    ],
  };
}

/** Keys excluded from the "modified vs defaults" check (transient UI state). */
const TRANSIENT_KEYS = new Set<keyof ViewState>([
  "filters",
  "page",
  "pageSize",
  "expandedGroups",
  "groupPages",
]);

/**
 * Reconcile ONE filter category against its context-derived default
 * (`config.defaultFilters`). Mutates `next` (the working filters map) and
 * `applied` (the per-category record of what we last auto-wrote) in place, and
 * returns whether `next` changed. See {@link UseViewStateConfig.defaultFilters}.
 *
 * Rules, in order:
 *  - **User-owned** — the live value is non-empty and differs from what we last
 *    wrote: the user has chosen this; leave it untouched and forget we ever
 *    auto-applied here.
 *  - **Already correct** — the live value already equals the wanted default:
 *    nothing to write; just keep the bookkeeping in sync.
 *  - **Seed / replace / clear** — otherwise bring the value to the default
 *    (writing it, or deleting it when the default is empty) and record it.
 */
function reconcileDefaultFilter(args: {
  categoryId: string;
  wanted: string[];
  current: string[];
  next: Record<string, string[]>;
  applied: Record<string, string[]>;
}): boolean {
  const { categoryId, wanted, current, next, applied } = args;
  const previouslyApplied = applied[categoryId] ?? [];

  const userOwns =
    current.length > 0 &&
    JSON.stringify(current) !== JSON.stringify(previouslyApplied);
  if (userOwns) {
    delete applied[categoryId];
    return false;
  }

  if (JSON.stringify(current) === JSON.stringify(wanted)) {
    if (wanted.length > 0) applied[categoryId] = wanted;
    else delete applied[categoryId];
    return false;
  }

  if (wanted.length > 0) {
    next[categoryId] = wanted;
    applied[categoryId] = wanted;
  } else {
    delete next[categoryId];
    delete applied[categoryId];
  }
  return true;
}

export interface ViewStateApi<G extends string, S extends string> {
  state: ViewState;
  /**
   * The context-locked filter categories (keyed by category id), echoed back
   * from config so the control panel can render them read-only (only the locked
   * option shown, non-toggleable, excluded from clear-all). `undefined` when the
   * view has no lock. See {@link UseViewStateConfig.lockedFilters}.
   */
  lockedFilters?: Record<string, string[]>;
  /** The debounced `?q=` search term. */
  search: string;
  /** The external snapshot fired via onStateChange (also useful to read). */
  externalState: TableState<G, S>;
  /** True when non-transient state differs from defaults (drives Reset). */
  isModified: boolean;
  updateState: (patch: Partial<ViewState>) => void;
  setSortBy: (value: S) => void;
  setSortDir: (dir: "asc" | "desc") => void;
  setGroupBy: (value: G) => void;
  setFilter: (categoryId: string, optionIds: string[]) => void;
  clearFilters: () => void;
  setVisibleProperties: (ids: string[]) => void;
  /**
   * Replace the persisted column-width map (px, keyed by column id). Pure
   * presentation — does not reset pagination and is excluded from the external
   * `onStateChange` snapshot so resizing never re-queries the server.
   */
  setColumnSizing: (sizing: Record<string, number>) => void;
  /** Replace the persisted column order (full leaf-column id list). Pure
   *  presentation — excluded from the external snapshot, no re-query. */
  setColumnOrder: (order: string[]) => void;
  setDisplayMode: (mode: TableDisplayMode) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  toggleGroup: (groupKey: string) => void;
  /**
   * Whether a group is expanded. `defaultExpanded` controls the value for a
   * group the user hasn't toggled yet — server-side grouping passes `false`
   * (collapsed first paint = no per-group queries); the legacy client path
   * defaults to expanded.
   */
  isGroupExpanded: (
    groupKey: string,
    opts?: { defaultExpanded?: boolean },
  ) => boolean;
  /** The 1-based "show more" window for a server-grouped group (default 1). */
  getGroupPage: (groupKey: string) => number;
  /** Set the "show more" window for a server-grouped group. */
  setGroupPage: (groupKey: string, page: number) => void;
  reset: () => void;
  applySavedView: (preferences: Record<string, unknown>) => void;
}

export function useViewState<G extends string, S extends string>(
  config: UseViewStateConfig<G, S>,
): ViewStateApi<G, S> {
  const defaults = useMemo<ViewState>(
    () => ({
      sortBy: config.defaultSortBy,
      sortDir: config.defaultSortDir ?? "asc",
      groupBy: config.defaultGroupBy,
      filters: {},
      visibleProperties: config.defaultVisibleProperties,
      displayMode: config.defaultDisplayMode ?? "list",
      expandedGroups: {},
      page: 1,
      pageSize: 50,
      groupPages: {},
      timelineDateField:
        config.defaultDateRange ?? config.dateRanges?.[0]?.id ?? "",
    }),
    [
      config.defaultSortBy,
      config.defaultSortDir,
      config.defaultGroupBy,
      config.defaultDisplayMode,
      config.defaultDateRange,
      config.dateRanges,
      config.defaultVisibleProperties,
    ],
  );

  const [state, setState] = useState<ViewState>(() => {
    const initial = resolveInitialViewState({
      defaults,
      persisted: config.initialState ?? null,
      defaultVisibleProperties: config.defaultVisibleProperties,
    });
    // Locked filters are authoritative — overlay them over any persisted/saved
    // value so a stale team filter can never widen the scope on first paint.
    if (!config.lockedFilters) return initial;
    return {
      ...initial,
      filters: { ...initial.filters, ...config.lockedFilters },
    };
  });

  const search = config.search ?? "";

  // ── Area-shared filters ──────────────────────────────────────────────────
  // Under a `SharedFiltersProvider` (e.g. Helm's filter bar), the categories
  // it owns read and write through it, so they stay set across every screen
  // of the area. Everything else stays per-view. `null` outside a provider —
  // every workspace page — which leaves this machine exactly as it was.
  const shared = useSharedFilters();
  const sharedRef = useRef(shared);
  sharedRef.current = shared;
  const effectiveFilters = useMemo(
    () =>
      shared === null
        ? state.filters
        : mergeSharedFilters(
            state.filters,
            shared.filters,
            shared.keys,
            config.lockedFilters,
          ),
    // `config.lockedFilters` is compared by content below, like everywhere else here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shared, state.filters, JSON.stringify(config.lockedFilters ?? {})],
  );
  const effectiveState = useMemo<ViewState>(
    () =>
      effectiveFilters === state.filters
        ? state
        : { ...state, filters: effectiveFilters },
    [state, effectiveFilters],
  );

  // Persist on every state change. `knownProperties` is recomputed at write
  // time from the CURRENT column catalog so a later load can tell a brand-new
  // column (surface it when default-visible) from one the user hid.
  const prevStateRef = useRef(state);
  useEffect(() => {
    if (prevStateRef.current !== state) {
      prevStateRef.current = state;
      const knownProperties =
        config.allPropertyIds ??
        Array.from(
          new Set([
            ...state.visibleProperties,
            ...config.defaultVisibleProperties,
          ]),
        );
      config.onPersist?.(config.viewId, { ...state, knownProperties });
    }
  }, [
    state,
    config.viewId,
    config.allPropertyIds,
    config.defaultVisibleProperties,
    config.onPersist,
  ]);

  const externalState = useMemo<TableState<G, S>>(
    () => ({
      search,
      sortBy: state.sortBy as S,
      sortDir: state.sortDir,
      groupBy: state.groupBy as G,
      filters: effectiveFilters,
      page: state.page,
      pageSize: state.pageSize,
      displayMode: state.displayMode,
      visibleProperties: state.visibleProperties,
    }),
    [
      search,
      state.sortBy,
      state.sortDir,
      state.groupBy,
      effectiveFilters,
      state.page,
      state.pageSize,
      state.displayMode,
      state.visibleProperties,
    ],
  );

  const onStateChangeRef = useRef(config.onStateChange);
  onStateChangeRef.current = config.onStateChange;
  useEffect(() => {
    onStateChangeRef.current?.(externalState);
  }, [externalState]);

  const updateState = useCallback((patch: Partial<ViewState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  // ── Context-derived default filters ──────────────────────────────────────
  // Apply `config.defaultFilters` as a soft default per category: seed an empty
  // category from the default, and — when the default changes — replace a value
  // we previously auto-applied (and the user never edited) so the default tracks
  // the surrounding context (e.g. the active plan) without ever clobbering a
  // user's explicit choice. `autoAppliedRef` records, per category, the exact
  // value WE last wrote; a category whose live value no longer matches that was
  // touched by the user and is left alone forever after.
  const defaultFilters = config.defaultFilters;
  const autoAppliedRef = useRef<Record<string, string[]>>({});
  useEffect(() => {
    setState((prev) => {
      const next: Record<string, string[]> = { ...prev.filters };
      const applied = autoAppliedRef.current;
      let changed = false;

      // Union of categories that currently have an auto-applied value and those
      // the new default wants — so a category dropped from the default is undone.
      const categories = new Set([
        ...Object.keys(applied),
        ...Object.keys(defaultFilters ?? {}),
      ]);

      for (const categoryId of categories) {
        if (
          reconcileDefaultFilter({
            categoryId,
            wanted: defaultFilters?.[categoryId] ?? [],
            current: prev.filters[categoryId] ?? [],
            next,
            applied,
          })
        ) {
          changed = true;
        }
      }

      if (!changed) return prev;
      return {
        ...prev,
        filters: next,
        page: 1,
        groupPages: {},
        expandedGroups: {},
      };
    });
    // Re-run whenever the context default changes (serialised for stable identity).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(defaultFilters ?? {})]);

  // ── Context-locked filters ───────────────────────────────────────────────
  // Authoritative, non-clearable filter values (e.g. a per-team budget proposal
  // hard-scoped to its team). Unlike `defaultFilters`, the user can never change
  // or clear these: they are force-applied here on mount + whenever they change,
  // guarded in `setFilter`, and preserved by `clearFilters`/`reset`. The ref lets
  // the (stable) callbacks below read the current lock without re-creating.
  const lockedFilters = config.lockedFilters;
  const lockedFiltersRef = useRef(lockedFilters);
  lockedFiltersRef.current = lockedFilters;
  useEffect(() => {
    const locked = lockedFiltersRef.current;
    if (!locked) return;
    setState((prev) => {
      const next: Record<string, string[]> = { ...prev.filters };
      let changed = false;
      for (const [categoryId, value] of Object.entries(locked)) {
        if (
          JSON.stringify(prev.filters[categoryId] ?? []) !==
          JSON.stringify(value)
        ) {
          next[categoryId] = value;
          changed = true;
        }
      }
      if (!changed) return prev;
      return {
        ...prev,
        filters: next,
        page: 1,
        groupPages: {},
        expandedGroups: {},
      };
    });
    // Re-run whenever the lock changes (serialised for stable identity).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(lockedFilters ?? {})]);

  // A shared filter changed (here or on another screen): the filtered set
  // changed, so start from page 1 with groups collapsed, as `setFilter` does.
  const sharedEncoded = shared === null ? "" : JSON.stringify(shared.filters);
  const prevSharedRef = useRef(sharedEncoded);
  useEffect(() => {
    if (prevSharedRef.current !== sharedEncoded) {
      prevSharedRef.current = sharedEncoded;
      updateState({ page: 1, groupPages: {}, expandedGroups: {} });
    }
  }, [sharedEncoded, updateState]);

  // Reset pagination + group windows when the search term changes (the filtered
  // set — and therefore the buckets — changes, so collapse groups too).
  const prevSearchRef = useRef(search);
  useEffect(() => {
    if (prevSearchRef.current !== search) {
      prevSearchRef.current = search;
      updateState({ page: 1, groupPages: {}, expandedGroups: {} });
    }
  }, [search, updateState]);

  // Sort changes the in-group row order but NOT the bucket set, so reset the
  // per-group windows (reload in the new order) while keeping groups open.
  const setSortBy = useCallback(
    (value: S) => updateState({ sortBy: value, page: 1, groupPages: {} }),
    [updateState],
  );
  const setSortDir = useCallback(
    (dir: "asc" | "desc") =>
      updateState({ sortDir: dir, page: 1, groupPages: {} }),
    [updateState],
  );
  // Group/filter changes alter which buckets exist + their counts → collapse all
  // and reset windows so nothing stale lingers.
  const setGroupBy = useCallback(
    (value: G) =>
      updateState({
        groupBy: value,
        page: 1,
        groupPages: {},
        expandedGroups: {},
      }),
    [updateState],
  );
  const setFilter = useCallback((categoryId: string, optionIds: string[]) => {
    // A locked category is authoritative — ignore any attempt to change it.
    if (lockedFiltersRef.current && categoryId in lockedFiltersRef.current)
      return;
    // An area-shared category is the provider's; the page reset follows from
    // the shared-filter effect above.
    const sharedApi = sharedRef.current;
    if (sharedApi !== null && sharedApi.keys.includes(categoryId)) {
      sharedApi.setFilter(categoryId, optionIds);
      return;
    }
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, [categoryId]: optionIds },
      page: 1,
      groupPages: {},
      expandedGroups: {},
    }));
  }, []);
  const clearFilters = useCallback(() => {
    // Clear-all clears the area's shared filters too (they show in this view's
    // filter control), and never a locked filter.
    sharedRef.current?.clear();
    updateState({
      filters: { ...lockedFiltersRef.current },
      page: 1,
      groupPages: {},
      expandedGroups: {},
    });
  }, [updateState]);
  const setVisibleProperties = useCallback(
    (ids: string[]) => updateState({ visibleProperties: ids }),
    [updateState],
  );
  const setColumnSizing = useCallback(
    (sizing: Record<string, number>) => updateState({ columnSizing: sizing }),
    [updateState],
  );
  const setColumnOrder = useCallback(
    (order: string[]) => updateState({ columnOrder: order }),
    [updateState],
  );
  const setDisplayMode = useCallback(
    (mode: TableDisplayMode) => updateState({ displayMode: mode }),
    [updateState],
  );
  const setPage = useCallback(
    (page: number) => updateState({ page }),
    [updateState],
  );
  const setPageSize = useCallback(
    (pageSize: number) => updateState({ pageSize, page: 1 }),
    [updateState],
  );
  const toggleGroup = useCallback(
    (groupKey: string) =>
      setState((prev) => ({
        ...prev,
        expandedGroups: {
          ...prev.expandedGroups,
          [groupKey]: !prev.expandedGroups[groupKey],
        },
      })),
    [],
  );
  const isGroupExpanded = useCallback(
    (groupKey: string, opts?: { defaultExpanded?: boolean }) => {
      const explicit = state.expandedGroups[groupKey];
      if (explicit !== undefined) return explicit;
      return opts?.defaultExpanded ?? true;
    },
    [state.expandedGroups],
  );
  const getGroupPage = useCallback(
    (groupKey: string) => state.groupPages[groupKey] ?? 1,
    [state.groupPages],
  );
  const setGroupPage = useCallback(
    (groupKey: string, page: number) =>
      setState((prev) => ({
        ...prev,
        groupPages: { ...prev.groupPages, [groupKey]: page },
      })),
    [],
  );
  const reset = useCallback(() => {
    // Reset to defaults but keep the context lock — it is not the user's to
    // clear. The area's shared filters are cleared with the rest.
    sharedRef.current?.clear();
    setState({ ...defaults, filters: { ...lockedFiltersRef.current } });
  }, [defaults]);
  const applySavedView = useCallback(
    (preferences: Record<string, unknown>) => {
      const merged = { ...defaults, ...preferences } as ViewState;
      // A saved view's area-shared categories go to the provider (so the
      // whole area follows it); the rest stay on this view.
      const sharedApi = sharedRef.current;
      if (sharedApi !== null) {
        const fromView = pickSharedFilters(merged.filters, sharedApi.keys);
        for (const key of sharedApi.keys)
          sharedApi.setFilter(key, fromView[key] ?? []);
        merged.filters = mergeSharedFilters(merged.filters, {}, sharedApi.keys);
      }
      // A saved view can carry another team's filter — the lock overrides it.
      const locked = lockedFiltersRef.current;
      if (locked) merged.filters = { ...merged.filters, ...locked };
      setState(merged);
    },
    [defaults],
  );

  const isModified = useMemo(() => {
    for (const key of Object.keys(defaults) as Array<keyof ViewState>) {
      if (TRANSIENT_KEYS.has(key)) continue;
      if (JSON.stringify(state[key]) !== JSON.stringify(defaults[key]))
        return true;
    }
    return false;
  }, [state, defaults]);

  return {
    state: effectiveState,
    lockedFilters,
    search,
    externalState,
    isModified,
    updateState,
    setSortBy,
    setSortDir,
    setGroupBy,
    setFilter,
    clearFilters,
    setVisibleProperties,
    setColumnSizing,
    setColumnOrder,
    setDisplayMode,
    setPage,
    setPageSize,
    toggleGroup,
    isGroupExpanded,
    getGroupPage,
    setGroupPage,
    reset,
    applySavedView,
  };
}
