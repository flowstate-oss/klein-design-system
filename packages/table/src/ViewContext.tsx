"use client";

/**
 * ViewContext — provides the view state machine (`useViewState`) to a view's
 * `ViewControlPanel` and `ViewLayout` so they share one source of truth.
 *
 *   <ViewProvider config={…}>
 *     <ViewControlPanel … />   // reads/writes via useView()
 *     <ViewLayout … />          // reads via useView()
 *   </ViewProvider>
 *
 * The provider MUST wrap the control panel + layout; the control panel always
 * renders before the layout.
 */

import { createContext, useContext, type ReactNode } from "react";
import {
  useViewState,
  type UseViewStateConfig,
  type ViewStateApi,
} from "./view-state.js";

export const ViewContext = createContext<ViewStateApi<string, string> | null>(
  null,
);

export interface ViewProviderProps<G extends string, S extends string> {
  config: UseViewStateConfig<G, S>;
  children: ReactNode;
}

export function ViewProvider<G extends string, S extends string>({
  config,
  children,
}: ViewProviderProps<G, S>) {
  const api = useViewState(config);
  return (
    <ViewContext.Provider
      value={api as unknown as ViewStateApi<string, string>}
    >
      {children}
    </ViewContext.Provider>
  );
}

/** Read the current view state + handlers. Must be used within a ViewProvider. */
export function useView<
  G extends string = string,
  S extends string = string,
>(): ViewStateApi<G, S> {
  const ctx = useContext(ViewContext);
  if (!ctx) {
    throw new Error("useView() must be used within a <ViewProvider>");
  }
  return ctx as unknown as ViewStateApi<G, S>;
}
