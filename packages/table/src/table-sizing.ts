/**
 * Pure column-sizing maths for the semantic-table Table.
 *
 * The page declares a CSS `grid-template-columns`-style track per property
 * column (`TableConfig.propertiesGridTemplate`). The semantic `<table>` can't
 * consume a CSS grid template directly, so we parse each track into a
 * {@link TrackSize} (px `min`, px `base`, and an `fr` `grow` weight) and resolve
 * concrete `<col>` pixel widths against the live container width — reproducing
 * CSS-grid `minmax(min, Nfr)` fluid fill so the table looks pixel-identical to
 * the previous per-row grid while remaining a real table (resizable, scrollable).
 *
 * Everything here is pure and DOM-free so it can be unit-tested in isolation.
 */

/** One root-em in CSS pixels. Tracks expressed in `rem` resolve against this. */
const REM_PX = 16;

/** Resolved sizing for a single column track, all widths in CSS pixels. */
export interface TrackSize {
  /** The smallest width the track may shrink to (the `minmax(min, …)` floor). */
  min: number;
  /** The track's natural/default width before fluid distribution. */
  base: number;
  /**
   * Flexible-grow weight from an `fr` max (`minmax(_, Nfr)` → `N`). `0` for a
   * fixed or content-sized (`auto`) track, which never absorbs free space.
   */
  grow: number;
}

/**
 * Parse a single CSS length token (`120px`, `8rem`, `0`) into CSS pixels.
 * Returns `null` for anything that is not a concrete length (`1fr`, `auto`).
 */
function parseLengthPx(token: string): number | null {
  const t = token.trim();
  const px = /^(\d+(?:\.\d+)?)px$/.exec(t);
  if (px) return Number(px[1]);
  const rem = /^(\d+(?:\.\d+)?)rem$/.exec(t);
  if (rem) return Number(rem[1]) * REM_PX;
  if (/^0(?:px|rem)?$/.test(t)) return 0;
  return null;
}

/**
 * Split a CSS `grid-template-columns` value into one entry per track.
 *
 * Naïve `value.split(' ')` would shatter `minmax(180px, 1.6fr)` or
 * `[name1 name2]` into multiple pieces. This walker tracks paren / bracket depth
 * and only splits on whitespace at depth 0, mirroring the CSS Grid spec's
 * "track-list" — one track per top-level group.
 *
 * @param template - Raw `grid-template-columns` string.
 * @returns Array of track tokens in source order.
 */
export function tokeniseGridTemplate(template: string): string[] {
  const tokens: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of template) {
    if (ch === "(" || ch === "[") {
      depth += 1;
      current += ch;
      continue;
    }
    if (ch === ")" || ch === "]") {
      depth = Math.max(0, depth - 1);
      current += ch;
      continue;
    }
    if (depth === 0 && /\s/.test(ch)) {
      if (current.length > 0) {
        tokens.push(current);
        current = "";
      }
      continue;
    }
    current += ch;
  }
  if (current.length > 0) tokens.push(current);
  return tokens;
}

/**
 * Parse one tokenised track into a {@link TrackSize}.
 *
 * - `minmax(<min>, <max>)` → `min` is the floor; `max` decides growth:
 *   `Nfr` ⇒ flexible (`grow: N`, `base: min`); `auto` ⇒ content-sized
 *   (`grow: 0`, `base: min`); a length ⇒ fixed (`grow: 0`, `base: max`).
 * - bare `<length>` (`120px`, `8rem`) ⇒ fixed at that width.
 * - bare `Nfr` ⇒ purely flexible (`min: 0`, `grow: N`).
 * - `auto` / `min-content` / `max-content` ⇒ content-sized (`grow: 0`).
 */
export function parseTrack(token: string): TrackSize {
  const trimmed = token.trim();

  const minmax = /^minmax\(\s*([^,]+?)\s*,\s*(.+?)\s*\)$/.exec(trimmed);
  if (minmax) {
    const min = parseLengthPx(minmax[1]) ?? 0;
    const maxTok = minmax[2].trim();
    const fr = /^(\d+(?:\.\d+)?)fr$/.exec(maxTok);
    if (fr) return { min, base: min, grow: Number(fr[1]) };
    if (
      maxTok === "auto" ||
      maxTok === "min-content" ||
      maxTok === "max-content"
    ) {
      return { min, base: min, grow: 0 };
    }
    const fixedMax = parseLengthPx(maxTok);
    return { min, base: fixedMax ?? min, grow: 0 };
  }

  const fr = /^(\d+(?:\.\d+)?)fr$/.exec(trimmed);
  if (fr) return { min: 0, base: 0, grow: Number(fr[1]) };

  if (
    trimmed === "auto" ||
    trimmed === "min-content" ||
    trimmed === "max-content"
  ) {
    return { min: 0, base: 0, grow: 0 };
  }

  const fixed = parseLengthPx(trimmed);
  if (fixed != null) return { min: fixed, base: fixed, grow: 0 };

  // Unparseable token — treat as a flexible column with no floor so it still
  // participates in fluid fill rather than vanishing.
  return { min: 0, base: 0, grow: 1 };
}

/** Default sizing for a property column with no declared track — a content-
 *  friendly width so pages without a `propertiesGridTemplate` don't truncate
 *  text columns. Pages can still tune exact widths via `propertiesGridTemplate`. */
export const DEFAULT_PROPERTY_TRACK: TrackSize = {
  min: 144,
  base: 144,
  grow: 0,
};

/** DEFAULT-WIDTH floor for a property column — the minimum a column is sized to
 *  BEFORE the user resizes it, so short-content columns (a status pill, a small
 *  number) don't render cramped. A gentle global minimum: a page that declares a
 *  wider track `min` (e.g. `minmax(160px, …)`, or the no-template default of
 *  144px) keeps that larger floor. */
export const PROPERTY_BASE_MIN_PX = 96;
/** Cap for a content-fitted property column, so one very long value can't blow
 *  a column out to absurd widths (it truncates instead). Never undercuts a
 *  page's declared track `min` (see `contentFitBase`). */
export const PROPERTY_MAX_PX = 420;
/** Padding/buffer added to a measured content width to get the column width. */
export const MEASURE_PAD_PX = 28;

/**
 * Decide what a property cell's measurement contributes to content-fit sizing,
 * from three geometry readings of the cell's full-width wrapper element.
 *
 * The wrapper is a block-level flex `div` that always fills the `<td>`, so its
 * own `scrollWidth` is NOT the content width — for an under-filled cell it
 * equals the column's current width, and feeding that back into sizing is a
 * feedback loop (each pass re-reads the width it just set, plus padding — the
 * column-width "vibration" bug). The caller therefore also supplies the width
 * of the wrapper's laid-out contents (a `Range.getBoundingClientRect()` union,
 * which shrink-wrapped flex children make layout-independent), and this
 * function keeps only measurements that are genuinely about the content:
 *
 * - content overflows the wrapper (either direction — right-aligned cells
 *   overflow LEFT, which `scrollWidth` alone misses) → the content rect width;
 * - content is strictly narrower than the wrapper → the content rect width;
 * - content exactly fills the wrapper (a stretching `w-full` child, a
 *   self-truncating child, or jsdom's zero geometry) → `null`: unmeasurable,
 *   the column falls back to its declared track / header measurement.
 *
 * The 1px tolerance absorbs fractional-pixel rounding at any zoom level.
 *
 * @param geometry - `scrollWidth`/`clientWidth` of the wrapper plus the width
 *   of the union rect of its contents, all in CSS pixels.
 * @returns The content width to feed into {@link contentFitBase}, or `null`
 *   when the reading says nothing about intrinsic content width.
 */
export function resolveMeasuredContentWidth(geometry: {
  scrollWidth: number;
  clientWidth: number;
  contentRectWidth: number;
}): number | null {
  const { scrollWidth, clientWidth, contentRectWidth } = geometry;
  const w = Math.ceil(contentRectWidth);
  if (w <= 0) return null;
  const overflows = scrollWidth > clientWidth + 1 || w > clientWidth + 1;
  if (overflows) return w;
  if (w < clientWidth - 1) return w;
  return null;
}

/**
 * Resolve a property column's content-fit `base` width from its (possibly
 * absent) measured content width and its declared track floor.
 *
 * Unmeasured columns rest at the declared floor; measured ones get the content
 * width plus breathing room ({@link MEASURE_PAD_PX}), never below the floor and
 * capped at {@link PROPERTY_MAX_PX}. Because the measured input is intrinsic
 * content width (see {@link resolveMeasuredContentWidth}), this function is
 * idempotent across measure→layout→measure passes: re-measuring an already
 * laid-out table yields the same base.
 *
 * @param measured - Intrinsic content width in px, or `undefined` when the
 *   column has no usable measurement.
 * @param trackMin - The declared track's `min` (from `propertiesGridTemplate`).
 * @returns The column's `base` width in px.
 */
export function contentFitBase(
  measured: number | undefined,
  trackMin: number,
): number {
  const declaredFloor = Math.max(trackMin, PROPERTY_BASE_MIN_PX);
  return measured
    ? Math.max(
        declaredFloor,
        Math.min(PROPERTY_MAX_PX, Math.round(measured) + MEASURE_PAD_PX),
      )
    : declaredFloor;
}

/** A column participating in fluid-width resolution. */
export interface SizingColumn {
  id: string;
  size: TrackSize;
}

/**
 * Resolve concrete pixel widths for every column with a CSS-flexbox-style
 * **grow + shrink** solver, so the table sizes intelligently to its content and
 * adapts to the available width instead of hard-coding pixels.
 *
 * Each column starts at its content-fit `base` (the measured natural width) —
 * or, if the user has dragged it, its EXACT pin. From there:
 *
 * - **Wide container (content fits, room to spare):** the surplus is handed to
 *   the **grow** columns (`grow > 0`) by `fr` weight, on top of their content
 *   width — so the title/identity column (and any `fr` data column) spreads to
 *   fill and the table never leaves a grey gap.
 *
 * - **Narrow container (content overflows):** columns **shrink** from their
 *   content width toward their per-column `min` (a readable floor), in
 *   proportion to how much slack each has (`base − min`). This is the
 *   responsive behaviour — columns give up their slack to fit the screen and
 *   only then, once everything is at its `min`, does the table exceed the
 *   container and the wrapper scrolls. A column never shrinks below `min`, so
 *   content stays readable (it truncates, never squishes to nothing).
 *
 * Pins: a non-fill column the user dragged is **exact** (it neither grows nor
 * shrinks — it holds where it was parked). The **fill column** (`fillId`, the
 * title) is special: its pin is a **floor, not a cap**, so it always reclaims
 * remaining slack (no gap) yet honours a deliberate widen (the table scrolls),
 * and it absorbs the sub-pixel rounding remainder so the table sits EXACTLY on
 * the container width.
 *
 * @param args.containerWidth - The scroll container's content width in px.
 * @param args.columns - Visible columns, in render order, with parsed sizes.
 * @param args.columnSizing - Persisted user pixel widths keyed by column id.
 * @param args.fillId - Id of the elastic fill column (pin = floor, not exact).
 * @returns A map of column id → resolved pixel width.
 */
export function computeFluidWidths(args: {
  containerWidth: number;
  columns: SizingColumn[];
  columnSizing?: Record<string, number>;
  fillId?: string;
}): Record<string, number> {
  const { containerWidth, columns, columnSizing, fillId } = args;

  const pinnedWidth = (id: string): number | null => {
    const pinned = columnSizing?.[id];
    return typeof pinned === "number" && Number.isFinite(pinned)
      ? pinned
      : null;
  };

  // Per-column working state. A non-fill pin is exact (frozen: no grow/shrink).
  // The fill column always flexes; its pin raises its floor (handled in grow).
  interface Item {
    id: string;
    width: number;
    min: number;
    grow: number;
    frozen: boolean;
    isFill: boolean;
    pinFloor: number | null;
  }
  const items: Item[] = columns.map((c) => {
    const pin = pinnedWidth(c.id);
    const isFill = c.id === fillId;
    const frozen = pin !== null && !isFill;
    // The fill column's pin is a FLOOR (max with its min): it starts at least
    // that wide so a deliberate widen survives both phases (a pin below its
    // content width is simply grown/held past, never opening a gap).
    const pinFloor = isFill && pin !== null ? Math.max(c.size.min, pin) : null;
    return {
      id: c.id,
      width: frozen
        ? Math.max(c.size.min, pin ?? c.size.base)
        : Math.max(c.size.base, pinFloor ?? 0),
      min: c.size.min,
      grow: c.size.grow,
      frozen,
      isFill,
      pinFloor,
    };
  });

  const total = () => items.reduce((acc, it) => acc + it.width, 0);

  // Before the scroll container is measured (`containerWidth` 0), there is no
  // viewport to grow into or shrink to fit — every column renders at its
  // content-fit base (or pin) and the table lays out at its natural width until
  // the ResizeObserver reports a width and a real pass runs.
  if (containerWidth <= 0) {
    const out: Record<string, number> = {};
    for (const it of items) out[it.id] = Math.round(it.width);
    return out;
  }

  if (total() < containerWidth) {
    // ── Grow phase: distribute the surplus to grow columns by fr weight. ──
    const growers = items.filter((it) => it.grow > 0 && !it.frozen);
    const totalGrow = growers.reduce((acc, it) => acc + it.grow, 0);
    const surplus = containerWidth - total();
    if (totalGrow > 0) {
      for (const it of growers) it.width += (it.grow / totalGrow) * surplus;
    }
  } else if (total() > containerWidth) {
    // ── Shrink phase: columns give up slack (base − min) to fit the screen. ──
    // Iterative so a column hitting its min hands its share to the rest.
    let deficit = total() - containerWidth;
    let active = items.filter((it) => !it.frozen && it.width > floorOf(it));
    while (deficit > 0.5 && active.length > 0) {
      const capacity = active.reduce(
        (acc, it) => acc + (it.width - floorOf(it)),
        0,
      );
      if (capacity <= 0.5) break;
      const take = Math.min(deficit, capacity);
      for (const it of active) {
        it.width -= ((it.width - floorOf(it)) / capacity) * take;
      }
      deficit -= take;
      active = active.filter((it) => it.width > floorOf(it) + 0.5);
    }
  }

  const widths: Record<string, number> = {};
  for (const it of items) widths[it.id] = Math.round(it.width);

  // Per-column rounding can leave the total a pixel or two short of the
  // container, opening a hairline gap. Give the fill column the remainder so the
  // table sits EXACTLY on the container width. This only runs when the table
  // fills (remainder > 0); when content overflows (scrolling) the remainder is
  // negative and the table is left at its natural width.
  if (fillId !== undefined && widths[fillId] !== undefined) {
    const sum = Object.values(widths).reduce((acc, w) => acc + w, 0);
    const remainder = containerWidth - sum;
    if (remainder > 0) widths[fillId] += remainder;
  }
  return widths;
}

/** The shrink floor for an item: a pinned fill holds at its pin, everything
 *  else may shrink to its readable `min`. */
function floorOf(it: { min: number; pinFloor: number | null }): number {
  return it.pinFloor ?? it.min;
}

/**
 * Compute the persisted pin map produced by a single left-to-right column
 * resize — the pure maths behind the table's drag handle.
 *
 * Resizing is **LTR**: dragging a boundary right grows the dragged column, left
 * shrinks it (down to its `min`, truncating its content Excel-style). To keep
 * the table glued to the container width, the equal-and-opposite delta is
 * absorbed by **the furthest-right resizable data column** (the "absorber"),
 * which shrinks/grows inversely. The visible change therefore happens AT and TO
 * THE RIGHT OF the boundary the user grabbed — never on a far-away left column.
 *
 * The absorber is the LAST property column in render order. Two cases fall back
 * to the elastic fill column instead (it yields/reclaims to keep the table full,
 * scrolling once it bottoms out):
 * - dragging the fill (title) column itself — there is no inverse column;
 * - dragging the last property column — there is nothing further right to absorb.
 *
 * Both the dragged column and the absorber are written as EXACT pins, so
 * {@link computeFluidWidths} reproduces this exact layout from the committed
 * pins (the live drag preview and the committed result are identical — nothing
 * jumps on pointer-up).
 *
 * @param args.draggedId - Column being resized.
 * @param args.desiredWidth - Raw target width for the dragged column (start + dx).
 * @param args.startWidths - Resolved widths captured at drag start (snapshot).
 * @param args.pins - The existing persisted `columnSizing` map.
 * @param args.propertyOrder - Visible property column ids, in render order.
 * @param args.minById - Resize floor (`min`) per column id.
 * @param args.fillId - Id of the elastic fill column.
 * @returns The next `columnSizing` pin map to apply/commit.
 */
export function resolveResizePins(args: {
  draggedId: string;
  desiredWidth: number;
  startWidths: Record<string, number>;
  pins: Record<string, number> | undefined;
  propertyOrder: string[];
  minById: Record<string, number>;
  fillId: string;
}): Record<string, number> {
  const {
    draggedId,
    desiredWidth,
    startWidths,
    pins,
    propertyOrder,
    minById,
    fillId,
  } = args;

  const draggedMin = minById[draggedId] ?? 0;
  const newDragged = Math.max(draggedMin, Math.round(desiredWidth));
  const next: Record<string, number> = {
    ...(pins ?? {}),
    [draggedId]: newDragged,
  };

  // Dragging the elastic fill column has no inverse column — the table simply
  // grows/shrinks (the fill's pin acts as a floor in computeFluidWidths).
  if (draggedId === fillId) return next;

  const applied = newDragged - (startWidths[draggedId] ?? newDragged);

  // Absorber = the furthest-right property column, unless the dragged column IS
  // that column (then the fill yields instead — nothing sits further right).
  const lastProperty = propertyOrder[propertyOrder.length - 1];
  if (!lastProperty || lastProperty === draggedId) return next;

  const absorberMin = minById[lastProperty] ?? 0;
  const absorberStart = startWidths[lastProperty] ?? absorberMin;
  next[lastProperty] = Math.max(
    absorberMin,
    Math.round(absorberStart - applied),
  );
  return next;
}

/** Total table width in px — the sum of every resolved column width. The table
 *  is laid out at exactly this width, scrolling horizontally when it exceeds the
 *  container. */
export function totalTableWidth(widths: Record<string, number>): number {
  return Object.values(widths).reduce((acc, w) => acc + w, 0);
}

/**
 * Responsive "slot" level (0–4) for a container width, matching the legacy
 * `DataRowContainer` breakpoints exactly:
 * `<450 → 0`, `<600 → 1`, `<800 → 2`, `<1000 → 3`, `≥1000 → 4`.
 */
export function slotFromWidth(width: number): number {
  if (width < 450) return 0;
  if (width < 600) return 1;
  if (width < 800) return 2;
  if (width < 1000) return 3;
  return 4;
}

/**
 * Whether a property column of the given `priority` survives at the given
 * responsive `slot`, reproducing `data-row.css` exactly: slot 0 hides priority
 * 1–4, slot 1 hides 1–3, slot 2 hides 1–2, slot 3 hides 1, slot 4 shows all.
 * Equivalent to `priority + slot > 4` (so priority ≥ 5 is always visible).
 */
export function priorityVisibleAtSlot(priority: number, slot: number): boolean {
  return priority + slot > 4;
}
