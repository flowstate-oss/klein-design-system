"use client";
import { createContext, useContext, type ReactNode } from "react";
/** What a view reads from the shared filters. */
export interface SharedFiltersApi {
  /** The area the filters belong to. */
  readonly scope: string;
  /** The filter categories the provider owns. */
  readonly keys: readonly string[];
  /** Current values, keyed by category id; only non-empty categories appear. */
  readonly filters: Readonly<Record<string, string[]>>;
  /** Set one category (an empty list clears it). Ignores a key not in `keys`. */
  readonly setFilter: (key: string, values: string[]) => void;
  /** Clear every shared category. */
  readonly clear: () => void;
}

export const SharedFiltersContext = createContext<SharedFiltersApi | null>(
  null,
);

/**
 * Keep only the provider's own categories, and only non-empty ones.
 *
 * @param filters - Candidate values (from the URL, storage or a saved view).
 * @param keys - The categories the provider owns.
 * @returns The owned, non-empty values.
 */
export function pickSharedFilters(
  filters: Readonly<Record<string, readonly string[]>>,
  keys: readonly string[],
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const key of keys) {
    const values = filters[key];
    if (values !== undefined && values.length > 0) out[key] = [...values];
  }
  return out;
}

/**
 * The filters a view sees: its own per-view values for categories the
 * provider doesn't own, the shared values for those it does, and any locked
 * value over both.
 *
 * @param own - The view's own filters.
 * @param shared - The provider's filters.
 * @param keys - The categories the provider owns.
 * @param locked - The view's locked filters, if any.
 * @returns The merged filters.
 */
export function mergeSharedFilters(
  own: Readonly<Record<string, string[]>>,
  shared: Readonly<Record<string, string[]>>,
  keys: readonly string[],
  locked?: Readonly<Record<string, string[]>>,
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [key, values] of Object.entries(own)) {
    if (!keys.includes(key)) out[key] = values;
  }
  return { ...out, ...shared, ...locked };
}

/** Controlled shared-filter scope. URL/session adapters belong in the application. */
export function SharedFiltersProvider({
  value,
  children,
}: {
  value: SharedFiltersApi;
  children: ReactNode;
}) {
  return (
    <SharedFiltersContext.Provider value={value}>
      {children}
    </SharedFiltersContext.Provider>
  );
}
export function useSharedFilters() {
  return useContext(SharedFiltersContext);
}
