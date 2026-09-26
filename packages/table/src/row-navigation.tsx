"use client";

/**
 * Row → entity page navigation for a Table list (`TableConfig.rowHref`).
 *
 * Kept in its own component so `useRouter` is only called by lists that opt
 * in: every other Table renders exactly as before, with no router
 * dependency.
 */

import type { MouseEvent, ReactNode } from "react";
import { useCallback } from "react";
import { useTableRuntime } from "./runtime.js";

/** The modifier state of a row click that decides same-tab vs new-tab. */
export interface RowClickModifiers {
  metaKey: boolean;
  ctrlKey: boolean;
}

/**
 * Open a row's entity page: a new tab on cmd/ctrl-click (like a link), else
 * the app router in the same tab.
 *
 * @param args.href - The entity page path.
 * @param args.event - The click's modifier keys.
 * @param args.push - Same-tab navigation (the app router's `push`).
 * @param args.openInNewTab - New-tab navigation (`window.open` in the browser).
 */
export function navigateToRow(args: {
  href: string;
  event: RowClickModifiers;
  push: (href: string) => void;
  openInNewTab: (href: string) => void;
}): void {
  const { href, event, push, openInNewTab } = args;
  if (event.metaKey || event.ctrlKey) openInNewTab(href);
  else push(href);
}

/** Opens a URL in a new browser tab without giving it a handle on this one. */
function openUrlInNewTab(href: string): void {
  window.open(href, "_blank", "noopener,noreferrer");
}

/**
 * Supplies a row-navigate callback built from `rowHref` and the app router.
 *
 * @param props.rowHref - The page's `rowHref`.
 * @param props.children - Render prop receiving `(item, event) => void`.
 * @returns Whatever `children` renders.
 */
export function RowHrefNavigation<T>({
  rowHref,
  children,
}: {
  rowHref: (item: T) => string;
  children: (navigate: (item: T, event: MouseEvent) => void) => ReactNode;
}) {
  const runtime = useTableRuntime();
  const navigate = useCallback(
    (item: T, event: MouseEvent) =>
      navigateToRow({
        href: rowHref(item),
        event,
        push: (href) => runtime.navigate(href),
        openInNewTab: openUrlInNewTab,
      }),
    [rowHref, runtime],
  );
  return <>{children(navigate)}</>;
}
