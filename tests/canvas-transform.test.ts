/**
 * The canvas arithmetic: what you point at stays where it is.
 *
 * Every expected figure below is worked by hand in the comment above it, from
 * `t' = cursor − (cursor − t) × s'/s` and `screen = t + p × s`, so a wrong
 * implementation cannot satisfy them by restating itself.
 */

import { describe, it, expect } from 'vitest';
import {
  FIT_MIN_SCALE,
  FIT_PADDING,
  IDENTITY_TRANSFORM,
  MAX_SCALE,
  MIN_SCALE,
  clampScale,
  distance,
  fitTo,
  midpoint,
  panBy,
  wheelZoomFactor,
  zoomAt,
  type CanvasTransform,
} from '../packages/react/src/patterns/canvas-transform';

/** Where a content point lands on screen under a transform. */
function screenOf(transform: CanvasTransform, content: { x: number; y: number }) {
  return {
    x: transform.x + content.x * transform.scale,
    y: transform.y + content.y * transform.scale,
  };
}

describe('explorer canvas model', () => {
  describe('panBy', () => {
    it('moves the layer by the drag and leaves the zoom alone', () => {
      expect(panBy({ x: 10, y: -5, scale: 0.5 }, 30, 12)).toEqual({ x: 40, y: 7, scale: 0.5 });
    });
  });

  describe('clampScale', () => {
    it('holds the zoom between a quarter and double', () => {
      expect(clampScale(0.1)).toBe(MIN_SCALE);
      expect(clampScale(5)).toBe(MAX_SCALE);
      expect(clampScale(0.8)).toBe(0.8);
      // A NaN out of a bad wheel delta must not poison the transform.
      expect(clampScale(Number.NaN)).toBe(1);
    });
  });

  describe('zoomAt', () => {
    it('keeps the point under the cursor under the cursor', () => {
      // From life size at the origin, doubling about (100, 50):
      //   s' = 1 × 2 = 2, ratio 2
      //   x' = 100 − (100 − 0) × 2 = −100
      //   y' =  50 − ( 50 − 0) × 2 =  −50
      expect(zoomAt(IDENTITY_TRANSFORM, { x: 100, y: 50 }, 2)).toEqual({
        x: -100,
        y: -50,
        scale: 2,
      });
    });

    it('keeps it there from an already panned and zoomed view', () => {
      const before: CanvasTransform = { x: -40, y: 20, scale: 0.5 };
      const cursor = { x: 200, y: 100 };
      // s' = 0.5 × 1.5 = 0.75, ratio 1.5
      //   x' = 200 − (200 − (−40)) × 1.5 = 200 − 360 = −160
      //   y' = 100 − (100 −   20 ) × 1.5 = 100 − 120 =  −20
      const after = zoomAt(before, cursor, 1.5);
      expect(after).toEqual({ x: -160, y: -20, scale: 0.75 });

      // The content point beneath the cursor was ((200 + 40)/0.5, (100 − 20)/0.5)
      // = (480, 160). It must still be drawn at (200, 100).
      expect(screenOf(after, { x: 480, y: 160 })).toEqual(cursor);
    });

    it('does nothing at all once the zoom is at its limit', () => {
      // Already at 2×: the clamp holds s' = s, the ratio is 1, so no drift.
      const atMax: CanvasTransform = { x: -100, y: -50, scale: MAX_SCALE };
      expect(zoomAt(atMax, { x: 100, y: 50 }, 2)).toEqual(atMax);

      const atMin: CanvasTransform = { x: 12, y: 8, scale: MIN_SCALE };
      expect(zoomAt(atMin, { x: 300, y: 200 }, 0.5)).toEqual(atMin);
    });

    it('refuses a factor that is not a positive number', () => {
      const before: CanvasTransform = { x: 3, y: 4, scale: 1 };
      expect(zoomAt(before, { x: 0, y: 0 }, 0)).toBe(before);
      expect(zoomAt(before, { x: 0, y: 0 }, Number.NaN)).toBe(before);
      expect(zoomAt(before, { x: 0, y: 0 }, -1)).toBe(before);
    });
  });

  describe('fitTo', () => {
    it('scales a structure down to fit and centres it', () => {
      // 1024 × 768 viewport, 24px padding, content 1024 × 512:
      //   by width  = (1024 − 48) / 1024 =  976 / 1024 = 0.953125
      //   by height = ( 768 − 48) /  512 =  720 /  512 = 1.40625   → width wins
      //   x = (1024 − 1024 × 0.953125) / 2 = (1024 − 976) / 2 =  24
      //   y = ( 768 −  512 × 0.953125) / 2 = ( 768 − 488) / 2 = 140
      expect(
        fitTo({ width: 1024, height: 512 }, { width: 1024, height: 768 }, null, FIT_PADDING)
      ).toEqual({ x: 24, y: 140, scale: 0.953125 });
    });

    it('never blows a small structure up past life size', () => {
      // Content 200 × 100 would fit at 4.88×; Fit stops at 1 and centres.
      //   x = (1024 − 200) / 2 = 412
      //   y = ( 768 − 100) / 2 = 334
      expect(
        fitTo({ width: 200, height: 100 }, { width: 1024, height: 768 }, null, FIT_PADDING)
      ).toEqual({ x: 412, y: 334, scale: 1 });
    });

    it('holds a structure too big to fit at a size that can still be read', () => {
      // 6000 × 2000 in a 1200 × 800 viewport. Fitting it would need 0.192× — a
      // grey band. Fit stops at the readable minimum instead, and with nothing
      // drawn yet to land on it starts at the structure's own top-left corner,
      // one padding in.
      //   by width = (1200 − 48) / 6000 = 1152 / 6000 = 0.192 → 0.6
      //   6000 × 0.6 = 3600 > 1200, 2000 × 0.6 = 1200 > 800  → both pinned
      expect(
        fitTo({ width: 6000, height: 2000 }, { width: 1200, height: 800 }, null, FIT_PADDING)
      ).toEqual({ x: FIT_PADDING, y: FIT_PADDING, scale: FIT_MIN_SCALE });
    });

    it('lands on the first top-level card, not on the corner of the drawing', () => {
      // Meridian: 97 groups, and the connectors centre a group over its
      // subtree, so the first area's own card sits 6000px into a 14,616px-wide
      // structure. Landing on the layer's corner opens on that area's leaf
      // teams with the card that names it off at the right-hand edge; landing
      // on the card itself puts the top of the organisation one padding in.
      //   scale = 0.6 (fitting 14,616 into 1215 would need 0.08×)
      //   x = 24 − 6000 × 0.6 = 24 − 3600 = −3576
      //   y = (771 − 497 × 0.6) / 2 = (771 − 298.2) / 2 = 236.4
      expect(
        fitTo(
          { width: 14616, height: 497 },
          { width: 1215, height: 771 },
          { x: 6000, y: 0, width: 256, height: 74 },
          FIT_PADDING
        )
      ).toEqual({ x: -3576, y: 236.4, scale: FIT_MIN_SCALE });
    });

    it('leaves a structure that already fits centred, wherever its first card is', () => {
      // The landing rule only decides where to put a reader who cannot see
      // everything. 1024 × 512 fits at 0.953125×, so it stays centred and the
      // first card's position makes no difference.
      expect(
        fitTo(
          { width: 1024, height: 512 },
          { width: 1024, height: 768 },
          { x: 400, y: 0, width: 256, height: 74 },
          FIT_PADDING
        )
      ).toEqual({ x: 24, y: 140, scale: 0.953125 });
    });

    it('pins only the axis that overflows', () => {
      // Wide and shallow: 6000 × 900 at 0.6 is 3600 × 540. Too wide for 1200,
      // so it sits at the left; 540 fits in 800, so it stays centred.
      //   y = (800 − 540) / 2 = 130
      expect(
        fitTo({ width: 6000, height: 900 }, { width: 1200, height: 800 }, null, FIT_PADDING)
      ).toEqual({ x: FIT_PADDING, y: 130, scale: FIT_MIN_SCALE });

      // Narrow and deep: 800 × 3000 at 0.6 is 480 × 1800. The other way round.
      //   x = (1200 − 480) / 2 = 360
      expect(
        fitTo({ width: 800, height: 3000 }, { width: 1200, height: 800 }, null, FIT_PADDING)
      ).toEqual({ x: 360, y: FIT_PADDING, scale: FIT_MIN_SCALE });
    });

    it('never fits below the readable minimum, however big the structure', () => {
      // 20480 × 5120 needs 0.0476×; the wheel would still take a reader down to
      // 0.25×, but Fit stops at 0.6 — Fit is "show me this", not "show me all
      // of this at any cost".
      expect(
        fitTo({ width: 20480, height: 5120 }, { width: 1024, height: 768 }, null, FIT_PADDING).scale
      ).toBe(FIT_MIN_SCALE);
      expect(FIT_MIN_SCALE).toBeGreaterThan(MIN_SCALE);
    });

    it('stays where it is when there is nothing measured yet', () => {
      // jsdom, a first paint, a hidden tab: an unmeasured layer must not throw
      // or divide by zero.
      expect(fitTo({ width: 0, height: 0 }, { width: 1024, height: 768 }, null)).toEqual(
        IDENTITY_TRANSFORM
      );
      expect(fitTo({ width: 800, height: 400 }, { width: 0, height: 0 }, null)).toEqual(
        IDENTITY_TRANSFORM
      );
    });
  });

  describe('pinch geometry', () => {
    it('measures the span and the point between two fingers', () => {
      // 3–4–5: the fingers are 5px apart, and the middle of (0,0)–(3,4) is (1.5, 2).
      expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
      expect(midpoint({ x: 0, y: 0 }, { x: 3, y: 4 })).toEqual({ x: 1.5, y: 2 });
    });

    it('zooms about the midpoint by how far the fingers spread', () => {
      // Fingers 100px apart open to 150px: factor 1.5 about their midpoint.
      const before: CanvasTransform = { x: 0, y: 0, scale: 1 };
      const centre = midpoint({ x: 100, y: 200 }, { x: 200, y: 200 });
      const factor = distance({ x: 75, y: 200 }, { x: 225, y: 200 }) / 100;
      expect(centre).toEqual({ x: 150, y: 200 });
      expect(factor).toBe(1.5);
      // x' = 150 − (150 − 0) × 1.5 = −75; y' = 200 − 200 × 1.5 = −100
      expect(zoomAt(before, centre, factor)).toEqual({ x: -75, y: -100, scale: 1.5 });
    });
  });

  describe('wheelZoomFactor', () => {
    it('zooms in scrolling up and out scrolling down', () => {
      expect(wheelZoomFactor(-100, false)).toBeGreaterThan(1);
      expect(wheelZoomFactor(100, false)).toBeLessThan(1);
      // A notch out undoes a notch in.
      expect(wheelZoomFactor(-100, false) * wheelZoomFactor(100, false)).toBeCloseTo(1, 12);
    });

    it('answers a pinch more strongly than a wheel of the same size', () => {
      // A trackpad pinch reports deltas an order of magnitude smaller, so it
      // needs the bigger multiplier to move at all.
      expect(wheelZoomFactor(-10, true)).toBeGreaterThan(wheelZoomFactor(-10, false));
    });

    it('ignores a delta that is not a number', () => {
      expect(wheelZoomFactor(Number.NaN, false)).toBe(1);
    });
  });
});
