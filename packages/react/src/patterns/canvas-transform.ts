/**
 * Where the canvas is looking: the arithmetic behind dragging, zooming and Fit,
 * kept away from the DOM so it can be checked without a browser.
 *
 * One rule governs the whole thing: whatever sits under the pointer stays under
 * the pointer while you zoom. Everything else — the clamp, Fit, the wheel's
 * feel — hangs off that. The layer is drawn with
 * `transform: translate(x, y) scale(s)` and `transform-origin: 0 0`, so a point
 * `p` in the content lands on screen at `t + p × s`; reversing that is how a
 * cursor position becomes a content position.
 *
 * No library: the canvas is one transformed div and these functions.
 */

/** A place on the canvas, in the viewport's own pixels. */
export interface Point {
  x: number;
  y: number;
}

/** How big something is, unscaled. */
export interface Size {
  width: number;
  height: number;
}

/** Where something sits inside the structure, and how big it is — unscaled. */
export interface Box extends Size {
  x: number;
  y: number;
}

/** Where the layer sits and how far it is zoomed. */
export interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
}

/** Zoomed out far enough to take in a large structure, and no further. */
export const MIN_SCALE = 0.25;
/** Zoomed in far enough to read a card comfortably, and no further. */
export const MAX_SCALE = 2;

/**
 * Fit never zooms past life size. A structure of one group would otherwise
 * blow up to fill the screen, which reads as a mistake rather than a fit.
 */
export const FIT_MAX_SCALE = 1;

/**
 * The smallest a card may be drawn and still be read: a group's name and its
 * headcount stay legible at 0.6×, and stop being legible below it.
 *
 * Fit stops here rather than shrinking to whatever it takes to get everything
 * on screen. Ninety-five groups across four levels do not fit on any screen at
 * a readable size, and squeezing them in produces a grey band nobody can use —
 * so Fit shows the top-left of the structure at a size that can be read, and
 * the rest is a drag away.
 */
export const FIT_MIN_SCALE = 0.6;

/** The breathing room Fit leaves around the structure, in viewport pixels. */
export const FIT_PADDING = 24;

/** Life size, top-left — where Reset puts you. */
export const IDENTITY_TRANSFORM: CanvasTransform = { x: 0, y: 0, scale: 1 };

/** How hard a wheel notch pulls the zoom. */
const WHEEL_SENSITIVITY = 0.0015;

/**
 * How hard a trackpad pinch pulls it. A pinch arrives as a wheel event with
 * `ctrlKey` set and a much smaller delta, so it needs its own multiplier or it
 * would barely move.
 */
const PINCH_SENSITIVITY = 0.01;

/** Hold a zoom inside the range the canvas is readable at. */
export function clampScale(scale: number): number {
  if (!Number.isFinite(scale)) return 1;
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

/** Drag the structure by a pointer movement. Panning never changes the zoom. */
export function panBy(
  transform: CanvasTransform,
  dx: number,
  dy: number,
): CanvasTransform {
  return { x: transform.x + dx, y: transform.y + dy, scale: transform.scale };
}

/**
 * Zoom by `factor` about `cursor`, leaving the content under the cursor exactly
 * where it was.
 *
 * The content point beneath the cursor is `(cursor − t) / s`; for it to land
 * back on the cursor at the new scale, `t' = cursor − (cursor − t) × s'/s`. At
 * the clamp `s' === s`, the ratio is 1 and the transform comes back untouched —
 * so pushing the wheel at full zoom does nothing at all rather than drifting.
 */
export function zoomAt(
  transform: CanvasTransform,
  cursor: Point,
  factor: number,
): CanvasTransform {
  if (!Number.isFinite(factor) || factor <= 0) return transform;
  const scale = clampScale(transform.scale * factor);
  const ratio = scale / transform.scale;
  return {
    x: cursor.x - (cursor.x - transform.x) * ratio,
    y: cursor.y - (cursor.y - transform.y) * ratio,
    scale,
  };
}

/**
 * The view that shows as much of the structure as can still be read: scaled to
 * fit inside the viewport with `padding` to spare, never past life size and
 * never below {@link FIT_MIN_SCALE}.
 *
 * A structure that fits at a readable size is centred. One that does not —
 * ninety-five groups four levels deep — is held at the readable minimum and
 * has to start somewhere, and the place to start is the top of the
 * organisation: the view lands with the FIRST top-level card one padding in
 * from the left, its subtree running off both edges, and the rest a drag away.
 * Each axis decides for itself, so a wide, shallow structure still sits
 * centred vertically.
 *
 * The first card is passed in rather than looked up: the connectors centre a
 * group over its subtree, so the top of a 14,616px-wide area sits 6,000px into
 * the layer, and only the DOM knows where. This function stays pure.
 *
 * @param content - The laid-out size of the structure, unscaled.
 * @param viewport - The window it has to sit in.
 * @param firstRoot - Where the first top-level card sits inside the structure,
 *   unscaled; `null` when nothing has been drawn yet, which lands on the
 *   structure's own left edge instead.
 * @param padding - The breathing room to leave around it.
 * @returns Where to put the layer and how far to zoom it.
 */
export function fitTo(
  content: Size,
  viewport: Size,
  firstRoot: Box | null,
  padding: number = FIT_PADDING,
): CanvasTransform {
  if (content.width <= 0 || content.height <= 0) return IDENTITY_TRANSFORM;
  if (viewport.width <= 0 || viewport.height <= 0) return IDENTITY_TRANSFORM;

  const byWidth = (viewport.width - padding * 2) / content.width;
  const byHeight = (viewport.height - padding * 2) / content.height;
  const scale = clampScale(
    Math.min(
      FIT_MAX_SCALE,
      Math.max(FIT_MIN_SCALE, Math.min(byWidth, byHeight)),
    ),
  );

  const width = content.width * scale;
  const height = content.height * scale;
  // Put the card's own left edge at the padding: on screen it lands at
  // `x + firstRoot.x × scale`, so `x = padding − firstRoot.x × scale`.
  const landing = firstRoot === null ? padding : padding - firstRoot.x * scale;

  return {
    x: width > viewport.width ? landing : (viewport.width - width) / 2,
    y: height > viewport.height ? padding : (viewport.height - height) / 2,
    scale,
  };
}

/** How far apart two pointers are — the length a pinch is measured by. */
export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** The point a two-finger pinch zooms about. */
export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * Turn a wheel notch into a zoom factor. Exponential, so a notch feels the same
 * whether you are at 0.3× or 1.8×, and scrolling up (a negative delta) zooms in.
 */
export function wheelZoomFactor(deltaY: number, pinch: boolean): number {
  if (!Number.isFinite(deltaY)) return 1;
  return Math.exp(-deltaY * (pinch ? PINCH_SENSITIVITY : WHEEL_SENSITIVITY));
}
