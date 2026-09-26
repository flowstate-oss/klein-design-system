"use client";
declare const process: { env: { NODE_ENV?: string } };

import { Children, type ReactNode } from "react";

/**
 * SectionBar — a full-bleed, flat, bottom-bordered horizontal band.
 *
 * The canonical chrome for a page's persistent header strip (e.g. a budget
 * request "ticker"): it spans the FULL width of the content area, touching the
 * left and right edges below the secondary nav. It is deliberately NOT a
 * `Card` — flat, no rounded corners, NO shadow, only a single `border-b`. It
 * carries a subtle background tint so it reads as a distinct band above the
 * page body.
 *
 * Layout: an optional `leading` segment (flex-1, e.g. title + status), a row of
 * `children` segments separated by subtle vertical dividers, and an optional
 * `trailing` segment (e.g. actions). The children row ALSO grows (`flex-1`) and
 * distributes its cells evenly across the available width (`[&>*]:flex-1`) so a
 * handful of metric cells spread out instead of crowding to one edge — when a
 * `leading` is present the band splits between the two, and with no `leading` the
 * cells fill the whole band. On narrow screens the band scrolls horizontally
 * rather than wrapping, keeping every segment on one row.
 *
 * To make this band full-bleed inside an otherwise-padded page, render it as a
 * direct child of an UNPADDED page wrapper and put the page's normal padding on
 * a sibling container BELOW the bar.
 *
 * As a KPI strip (the Helm screen template's second band) it holds at most
 * {@link KPI_STRIP_MAX_TILES} tiles. More is a design error, not a layout
 * problem: outside production the bar logs a console error naming the count,
 * but still renders every child — it never silently drops a figure.
 *
 * @module SectionBar
 */

/** Most tiles a KPI strip holds (Helm dashboards spec, "Screen template"). */
export const KPI_STRIP_MAX_TILES = 6;

export interface SectionBarProps {
  /**
   * The leading (left) segment — grows to fill available space. Typically a
   * title + status + meta line. Omit for a band that is only cells + actions.
   */
  leading?: ReactNode;
  /**
   * The middle segments — each is divider-separated from its neighbours. Pass
   * the cells (e.g. `TickerStat`s) as children.
   */
  children?: ReactNode;
  /**
   * The trailing (right) segment — typically actions (a primary button + an
   * overflow menu). Pinned to the right edge.
   */
  trailing?: ReactNode;
  /** Forwarded to the band's `data-testid` for targeted assertions. */
  "data-testid"?: string;
}

/**
 * Render a flat, full-bleed section band. See the module doc for the layout and
 * styling contract (bottom-border only, tinted background, divider-separated
 * segments, horizontal scroll when tight).
 */
export function SectionBar({
  leading,
  children,
  trailing,
  "data-testid": dataTestId,
}: SectionBarProps) {
  const tileCount = Children.toArray(children).length;
  if (
    tileCount > KPI_STRIP_MAX_TILES &&
    process.env.NODE_ENV !== "production"
  ) {
    console.error(
      `SectionBar: ${tileCount} tiles passed; a KPI strip holds at most ${KPI_STRIP_MAX_TILES}. ` +
        "Move the extra figures into the table.",
    );
  }
  return (
    <div
      className="border-border bg-muted/30 flex w-full items-stretch overflow-x-auto border-b"
      data-testid={dataTestId}
    >
      {leading !== undefined ? (
        <div className="flex min-w-[15rem] flex-1 items-stretch">{leading}</div>
      ) : null}

      {children !== undefined ? (
        <div className="divide-border flex flex-1 items-stretch divide-x border-l [&>*]:flex-1">
          {children}
        </div>
      ) : null}

      {trailing !== undefined ? (
        <div className="border-border flex items-center border-l">
          {trailing}
        </div>
      ) : null}
    </div>
  );
}
