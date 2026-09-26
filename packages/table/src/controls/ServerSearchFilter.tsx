"use client";

/**
 * A filter category whose options are searched on the server — team,
 * function, cost centre, tool, project: lists with no fixed size (CLAUDE.md
 * §5: server search, 20 results, 300 ms debounce, no client filtering).
 *
 * It is a `FilterCustomCategory`, so it sits in the same Filter popover, the
 * same chips and the same `filters` state as every other category; its value
 * is the list of selected ids, which the page sends to its query. The page
 * supplies the search as a hook, e.g. a generated Apollo query wrapped as
 * `(query) => ({ options, loading })` with `limit: 20`.
 *
 * @module ServerSearchFilter
 */

import { useState } from "react";
import { Search, type LucideIcon } from "lucide-react";
import { useDebounce } from "../use-debounce.js";
import { useTableLabels } from "../labels.js";
import type { FilterCustomCategory, FilterOption } from "../view-types.js";
import { FilterOptionRow } from "./FilterOptionRow.js";

/** The debounce every server-searched list uses (CLAUDE.md §5). */
export const SERVER_SEARCH_DEBOUNCE_MS = 300;

/** How many options a server search asks for (CLAUDE.md §5). */
export const SERVER_SEARCH_LIMIT = 20;

/** What a server-search hook returns for one query. */
export interface ServerSearchResult {
  /** At most {@link SERVER_SEARCH_LIMIT} matches, in the server's order. */
  readonly options: readonly FilterOption[];
  /** True while the query is in flight. */
  readonly loading: boolean;
}

/** A hook that searches one category's options on the server. */
export type ServerSearchHook = (query: string) => ServerSearchResult;

/**
 * Remembers the label of every option the user has seen, so a chip can name a
 * selected id after the search that found it has moved on.
 */
export type OptionLabelCache = Map<string, string>;

/** Props for {@link ServerSearchFilterPanel}. */
export interface ServerSearchFilterPanelProps {
  /** Searches the options (already debounced input goes in). */
  readonly useSearch: ServerSearchHook;
  /** The selected ids. */
  readonly value: readonly string[];
  /** Write the selected ids back. */
  readonly onChange: (next: string[]) => void;
  /** Close the Filter popover. */
  readonly onClose: () => void;
  /** Labels seen so far, filled as results arrive. */
  readonly labels: OptionLabelCache;
  /** Placeholder for the search box, already translated. */
  readonly placeholder: string;
}

/**
 * The drilled-in panel: a search box (debounced 300 ms), the server's
 * matches, with the selected ones on top even when the current search no
 * longer returns them. Same search row and option rows as `FilterCombobox`;
 * nothing is filtered on the client — the list is what the server returned.
 *
 * @param props - See {@link ServerSearchFilterPanelProps}.
 */
export function ServerSearchFilterPanel({
  useSearch,
  value,
  onChange,
  onClose,
  labels,
  placeholder,
}: ServerSearchFilterPanelProps): React.JSX.Element {
  const tc = useTableLabels();
  const [input, setInput] = useState("");
  const query = useDebounce(input, SERVER_SEARCH_DEBOUNCE_MS);
  const { options, loading } = useSearch(query);
  for (const option of options) labels.set(option.id, option.label);

  const selected = new Set(value);
  const pinned: FilterOption[] = value.map((id) => ({
    id,
    label: labels.get(id) ?? id,
  }));
  const rest = options.filter((option) => !selected.has(option.id));

  const toggle = (id: string) =>
    onChange(selected.has(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <div data-testid="server-search-filter">
      <div className="flex items-center border-b px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="placeholder:text-muted-foreground flex h-9 w-full bg-transparent py-2 text-sm outline-none"
        />
      </div>
      <div className="max-h-[300px] overflow-y-auto p-1">
        {[...pinned, ...rest].map((option) => (
          <FilterOptionRow
            key={option.id}
            option={option}
            checked={selected.has(option.id)}
            onToggle={() => toggle(option.id)}
            onSelectAndClose={() => {
              toggle(option.id);
              onClose();
            }}
          />
        ))}
        {pinned.length + rest.length === 0 ? (
          <div className="text-muted-foreground py-6 text-center text-sm">
            {loading ? tc("filter.search.loading") : tc("filter.search.empty")}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** What {@link serverSearchFilterCategory} needs. */
export interface ServerSearchFilterCategoryOptions {
  /** Filter key in the view's `filters` (and the shared filters, if shared). */
  readonly id: string;
  /** Category label, already translated. */
  readonly label: string;
  /** Category icon. */
  readonly icon: LucideIcon;
  /** The server search. */
  readonly useSearch: ServerSearchHook;
  /** Search box placeholder, already translated. */
  readonly placeholder: string;
  /**
   * Label cache, kept by the page across renders (`useRef(new Map())`) so the
   * chips can name what was picked. Seed it with known labels if the page has
   * them (e.g. from a deep link).
   */
  readonly labels: OptionLabelCache;
}

/**
 * Build a Filter category searched on the server.
 *
 * @param options - See {@link ServerSearchFilterCategoryOptions}.
 * @returns A custom filter category for `ViewControlPanel`'s `filterCategories`.
 */
export function serverSearchFilterCategory(
  options: ServerSearchFilterCategoryOptions,
): FilterCustomCategory {
  const { id, label, icon, useSearch, placeholder, labels } = options;
  return {
    kind: "custom",
    id,
    label,
    icon,
    renderPanel: ({ value, onChange, onClose }) => (
      <ServerSearchFilterPanel
        useSearch={useSearch}
        value={value}
        onChange={onChange}
        onClose={onClose}
        labels={labels}
        placeholder={placeholder}
      />
    ),
    summary: (value) => summariseLabels(value, labels),
  };
}

/**
 * A short summary of the selected options: one or two names, or the first
 * name and how many more.
 *
 * @param value - The selected ids.
 * @param labels - Known labels.
 * @returns `null` with nothing selected; otherwise "Platform", "Platform, Data",
 *   or "Platform +2".
 */
export function summariseLabels(
  value: readonly string[],
  labels: ReadonlyMap<string, string>,
): string | null {
  if (value.length === 0) return null;
  const names = value.map((id) => labels.get(id) ?? id);
  if (names.length <= 2) return names.join(", ");
  return `${names[0]} +${names.length - 1}`;
}
