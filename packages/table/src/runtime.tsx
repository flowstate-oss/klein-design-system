"use client";
import { createContext, useContext, type ReactNode } from "react";
export interface TableRuntime {
  navigate: (href: string) => void;
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
}
const defaults: TableRuntime = {
  navigate: (href) => window.location.assign(href),
  formatDate: (date, options) =>
    new Intl.DateTimeFormat("en-GB", options).format(date),
};
const Context = createContext<TableRuntime>(defaults);
/** Application navigation and locale formatting adapters. */
export function TableRuntimeProvider({
  value,
  children,
}: {
  value: Partial<TableRuntime>;
  children: ReactNode;
}) {
  return (
    <Context.Provider value={{ ...defaults, ...value }}>
      {children}
    </Context.Provider>
  );
}
export function useTableRuntime() {
  return useContext(Context);
}
