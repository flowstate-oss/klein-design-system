"use client";
import { createContext, useContext, type ReactNode } from "react";
/** Presentation-only theme; supplied by the consuming application's theme adapter. */
const Theme = createContext<{ theme: string }>({ theme: "light" });
export function ChartThemeProvider({
  theme,
  children,
}: {
  theme: string;
  children: ReactNode;
}) {
  return <Theme.Provider value={{ theme }}>{children}</Theme.Provider>;
}
export function useChartTheme() {
  return useContext(Theme);
}
