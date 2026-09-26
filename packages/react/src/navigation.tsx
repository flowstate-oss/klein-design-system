"use client";
import type { ReactNode } from "react";
import * as PrimitiveTabs from "@radix-ui/react-tabs";

/** The standard page title and action row. */
export interface PageHeaderProps {
  /** The page's single h1. */
  title: string;
  /** Optional Button or compact action group. */
  actions?: ReactNode;
}
/** Render a page heading without an extra prose or summary band. */
export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <header className="k-page-header">
      <h1>{title}</h1>
      {actions && <div className="k-actions">{actions}</div>}
    </header>
  );
}

/** Route links, never local tab panels. The application owns route resolution. */
export interface RouteTabsProps {
  /** Accessible navigation landmark name. */
  label: string;
  /** Stable IDs and application-produced URLs. */
  items: readonly { id: string; label: string; href: string }[];
  /** Active route ID, supplied by the router adapter. */
  value: string;
}
/** Render genuine links with browser navigation and current-page semantics. */
export function RouteTabs({ label, items, value }: RouteTabsProps) {
  return (
    <nav className="k-route-tabs" aria-label={label}>
      {items.map((item) => (
        <a
          key={item.id}
          href={item.href}
          aria-current={item.id === value ? "page" : undefined}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

/** Local panel selection. Page sub-navigation uses RouteTabs instead. */
export interface TabsProps {
  /** Accessible name for this local tab list. */
  label: string;
  /** Controlled active panel ID. */
  value: string;
  /** Receives the next panel ID. */
  onValueChange: (value: string) => void;
  /** Stable panel IDs, labels and content. */
  items: readonly {
    id: string;
    label: string;
    content: ReactNode;
    disabled?: boolean;
  }[];
}
/** Render keyboard-accessible local panels with manual activation. */
export function Tabs({ label, value, onValueChange, items }: TabsProps) {
  return (
    <PrimitiveTabs.Root
      className="k-tabs"
      value={value}
      onValueChange={onValueChange}
      activationMode="manual"
    >
      <PrimitiveTabs.List className="k-tab-list" aria-label={label}>
        {items.map((item) => (
          <PrimitiveTabs.Trigger
            className="k-tab"
            key={item.id}
            value={item.id}
            disabled={item.disabled}
          >
            {item.label}
          </PrimitiveTabs.Trigger>
        ))}
      </PrimitiveTabs.List>
      {items.map((item) => (
        <PrimitiveTabs.Content
          className="k-tab-panel"
          key={item.id}
          value={item.id}
        >
          {item.content}
        </PrimitiveTabs.Content>
      ))}
    </PrimitiveTabs.Root>
  );
}
