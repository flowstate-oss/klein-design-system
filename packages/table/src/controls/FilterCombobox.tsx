"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import {
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  Lock,
} from "lucide-react";
import { Button } from "@klein-ui/react/compat/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@klein-ui/react/compat/popover";
import { useTableLabels } from "../labels.js";
import { toolbarTrigger } from "./toolbar-button-styles.js";
import { FilterCheckbox, FilterOptionRow } from "./FilterOptionRow.js";
import type {
  FilterCategory,
  FilterOption,
  FilterOptionsCategory,
} from "../view-types.js";

/* -------------------------------------------------------------------------- */
/*                              Props                                         */
/* -------------------------------------------------------------------------- */

interface FilterComboboxProps {
  /** Available filter categories with their options */
  categories: FilterCategory[];
  /** Currently selected option IDs keyed by category ID */
  selected: Record<string, string[]>;
  /**
   * Categories LOCKED to a fixed value, keyed by category id. A locked category
   * renders read-only: only its locked option(s) are shown, they cannot be
   * toggled off, and it is excluded from "Clear all". Used to hard-scope a view
   * (e.g. a per-team budget proposal pinned to its own team). See
   * `UseViewStateConfig.lockedFilters`.
   */
  lockedFilters?: Record<string, string[]>;
  /** Called when selection changes for a category */
  onChange: (categoryId: string, optionIds: string[]) => void;
  /** Called to clear all active filters */
  onClearAll: () => void;
}

/* -------------------------------------------------------------------------- */
/*                         Flattened search result                            */
/* -------------------------------------------------------------------------- */

interface FlatSearchResult {
  category: FilterCategory;
  option: FilterOption;
}

/* -------------------------------------------------------------------------- */
/*                              Component                                     */
/* -------------------------------------------------------------------------- */

/**
 * A nested category-based filter control with drill-down navigation and
 * global search. Designed for high-density toolbar use alongside sort/group
 * controls in Table.
 *
 * Level 1 shows filter categories. Clicking a category drills into its
 * options. A global search flattens all categories and shows matching
 * options with breadcrumb paths.
 */
export function FilterCombobox({
  categories,
  selected,
  lockedFilters,
  onChange,
  onClearAll,
}: FilterComboboxProps) {
  const tc = useTableLabels();

  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Lock helpers ── */

  const isCategoryLocked = useCallback(
    (categoryId: string) =>
      Boolean(lockedFilters && categoryId in lockedFilters),
    [lockedFilters],
  );

  /* ── Derived state ── */

  const totalActiveCount = useMemo(
    () => Object.values(selected).reduce((sum, ids) => sum + ids.length, 0),
    [selected],
  );

  const hasActiveFilters = totalActiveCount > 0;

  // Clear-all only acts on user-owned filters; a locked category can't be
  // cleared, so the footer hides when the ONLY active filters are locked.
  const hasClearableFilters = useMemo(
    () =>
      Object.entries(selected).some(
        ([categoryId, ids]) => ids.length > 0 && !isCategoryLocked(categoryId),
      ),
    [selected, isCategoryLocked],
  );

  /** Count of active filters per category */
  const categoryActiveCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of categories) {
      const sel = selected[cat.id];
      counts[cat.id] = sel ? sel.length : 0;
    }
    return counts;
  }, [categories, selected]);

  /** The currently drilled-into category object */
  const currentCategory = useMemo(
    () =>
      activeCategory
        ? (categories.find((c) => c.id === activeCategory) ?? null)
        : null,
    [activeCategory, categories],
  );

  /** Flattened search results across all categories */
  const searchResults = useMemo<FlatSearchResult[]>(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const results: FlatSearchResult[] = [];
    for (const category of categories) {
      // Custom categories have no discrete options to match against. Locked
      // categories are read-only — never surface them as toggleable search hits
      // (that would let the lock be bypassed from the search list).
      if (category.kind === "custom" || isCategoryLocked(category.id)) continue;
      const hits = category.options.filter((o) =>
        o.label.toLowerCase().includes(query),
      );
      for (const option of hits) results.push({ category, option });
    }
    return results;
  }, [searchQuery, categories, isCategoryLocked]);

  const isSearching = searchQuery.trim().length > 0;

  /* ── Handlers ── */

  const handleToggleOption = useCallback(
    (categoryId: string, optionId: string) => {
      // Locked categories are read-only — swallow the toggle.
      if (isCategoryLocked(categoryId)) return;
      const current = selected[categoryId] ?? [];
      const isSelected = current.includes(optionId);
      const next = isSelected
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      onChange(categoryId, next);
    },
    [selected, onChange, isCategoryLocked],
  );

  const handleSelectAndClose = useCallback(
    (categoryId: string, optionId: string) => {
      handleToggleOption(categoryId, optionId);
      setOpen(false);
    },
    [handleToggleOption],
  );

  const handleClearAll = useCallback(() => {
    onClearAll();
    setOpen(false);
  }, [onClearAll]);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setActiveCategory(null);
      setSearchQuery("");
    }
  }, []);

  const handleBack = useCallback(() => {
    setActiveCategory(null);
    setSearchQuery("");
    /* Re-focus search input after navigating back */
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  const handleCategoryClick = useCallback((categoryId: string) => {
    setActiveCategory(categoryId);
    setSearchQuery("");
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  /* ── Sub-renderers ── */

  const isOptionSelected = useCallback(
    (categoryId: string, optionId: string): boolean => {
      const sel = selected[categoryId];
      return sel ? sel.includes(optionId) : false;
    },
    [selected],
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={toolbarTrigger}>
          <Filter className="h-3.5 w-3.5" />
          {tc("filter")}
          {hasActiveFilters && (
            <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
              {totalActiveCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-72 p-0" align="start">
        {/* ── Search input ── */}
        <div className="flex items-center gap-2 border-b px-3">
          {activeCategory && !isSearching ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex shrink-0 items-center text-muted-foreground hover:text-foreground"
              aria-label={tc("back")}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          ) : (
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <input
            ref={inputRef}
            type="text"
            placeholder={tc("search.placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-9 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="max-h-[300px] overflow-y-auto">
          {/* ── Global search results ── */}
          {isSearching && (
            <>
              {searchResults.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  {tc("empty.no-results")}
                </div>
              ) : (
                <div className="p-1">
                  {searchResults.map(({ category, option }) => {
                    const checked = isOptionSelected(category.id, option.id);
                    return (
                      <SearchResultRow
                        key={`${category.id}-${option.id}`}
                        category={category}
                        option={option}
                        checked={checked}
                        onToggle={() =>
                          handleToggleOption(category.id, option.id)
                        }
                        onSelectAndClose={() =>
                          handleSelectAndClose(category.id, option.id)
                        }
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ── Category list (Level 1) ── */}
          {!isSearching && !activeCategory && (
            <div className="p-1">
              {categories.map((category) => {
                const count = categoryActiveCounts[category.id] ?? 0;
                const Icon = category.icon;
                const locked = isCategoryLocked(category.id);
                // Custom categories surface a text summary of their value
                // (e.g. "> $150,000") in place of the numeric count badge.
                const summaryText =
                  category.kind === "custom"
                    ? (category.summary?.(selected[category.id] ?? []) ?? null)
                    : null;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategoryClick(category.id)}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate text-left">
                      {category.label}
                    </span>
                    {/* Locked categories show a lock (read-only scope), not a count. */}
                    {locked ? null : summaryText ? (
                      <span className="max-w-[40%] truncate font-mono text-xs text-muted-foreground">
                        {summaryText}
                      </span>
                    ) : (
                      count > 0 && (
                        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
                          {count}
                        </span>
                      )
                    )}
                    {locked ? (
                      <Lock
                        className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                        aria-label={tc("filter.locked")}
                      />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Custom category panel (Level 2) ── */}
          {!isSearching &&
            activeCategory &&
            currentCategory?.kind === "custom" &&
            currentCategory.renderPanel({
              value: selected[currentCategory.id] ?? [],
              onChange: (next) => onChange(currentCategory.id, next),
              onClose: () => setOpen(false),
            })}

          {/* ── Category options (Level 2) ── */}
          {!isSearching &&
            activeCategory &&
            currentCategory &&
            currentCategory.kind !== "custom" && (
              <CategoryOptions
                category={currentCategory}
                // `null` = not locked; otherwise the locked option ids (the only
                // ones shown, rendered read-only so the scope can't be widened).
                lockedIds={
                  isCategoryLocked(currentCategory.id)
                    ? (lockedFilters?.[currentCategory.id] ?? [])
                    : null
                }
                isOptionSelected={isOptionSelected}
                lockedLabel={tc("filter.locked")}
                emptyLabel={tc("empty.no-results")}
                onToggle={handleToggleOption}
                onSelectAndClose={handleSelectAndClose}
              />
            )}
        </div>

        {/* ── Clear all footer ── */}
        {hasClearableFilters && (
          <div className="border-t p-1">
            <button
              type="button"
              onClick={handleClearAll}
              className="flex w-full items-center justify-center rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {tc("clear.all")}
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/* -------------------------------------------------------------------------- */
/*                           CategoryOptions (Level 2)                        */
/* -------------------------------------------------------------------------- */

interface CategoryOptionsProps {
  /** The (already discriminated) options category being drilled into. */
  category: FilterOptionsCategory;
  /**
   * `null` when the category is not locked. Otherwise the locked option ids: the
   * ONLY options shown, rendered read-only (checked, non-toggleable) so the scope
   * cannot be widened or cleared.
   */
  lockedIds: string[] | null;
  isOptionSelected: (categoryId: string, optionId: string) => boolean;
  lockedLabel: string;
  emptyLabel: string;
  onToggle: (categoryId: string, optionId: string) => void;
  onSelectAndClose: (categoryId: string, optionId: string) => void;
}

/**
 * The drilled-in option list for a standard (non-custom) filter category. When
 * `lockedIds` is non-null the category is context-locked: only those options are
 * shown, each as a read-only {@link FilterOptionRow}.
 */
function CategoryOptions({
  category,
  lockedIds,
  isOptionSelected,
  lockedLabel,
  emptyLabel,
  onToggle,
  onSelectAndClose,
}: CategoryOptionsProps) {
  const locked = lockedIds !== null;
  const visibleOptions = locked
    ? category.options.filter((o) => lockedIds.includes(o.id))
    : category.options;

  return (
    <div className="p-1">
      {visibleOptions.length === 0 ? (
        <div className="px-3 py-6 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </div>
      ) : (
        visibleOptions.map((option) => (
          <FilterOptionRow
            key={option.id}
            option={option}
            checked={isOptionSelected(category.id, option.id)}
            locked={locked}
            lockedLabel={lockedLabel}
            onToggle={() => onToggle(category.id, option.id)}
            onSelectAndClose={() => onSelectAndClose(category.id, option.id)}
          />
        ))
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              SearchResultRow                               */
/* -------------------------------------------------------------------------- */

interface SearchResultRowProps {
  category: FilterCategory;
  option: FilterOption;
  checked: boolean;
  onToggle: () => void;
  onSelectAndClose: () => void;
}

/**
 * A search result row showing `Category > Value` breadcrumb path.
 * Same toggle/close semantics as FilterOptionRow.
 */
function SearchResultRow({
  category,
  option,
  checked,
  onToggle,
  onSelectAndClose,
}: SearchResultRowProps) {
  return (
    <div
      role="option"
      aria-selected={checked}
      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onSelectAndClose();
        }
      }}
    >
      {/* Checkbox area — click toggles without close */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="shrink-0"
        tabIndex={-1}
      >
        <FilterCheckbox checked={checked} />
      </button>

      {/* Label area — click applies and closes */}
      <button
        type="button"
        onClick={onSelectAndClose}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
        tabIndex={-1}
      >
        {option.color && (
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: option.color }}
          />
        )}
        <span className="truncate">
          <span className="text-muted-foreground">{category.label}</span>
          <span className="mx-1 text-muted-foreground">&gt;</span>
          <span>{option.label}</span>
        </span>
      </button>
    </div>
  );
}
