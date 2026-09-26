"use client";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type Ref,
  type ReactNode,
} from "react";
import {
  IDENTITY_TRANSFORM,
  distance,
  fitTo,
  midpoint,
  panBy,
  wheelZoomFactor,
  zoomAt,
  type Box,
  type CanvasTransform,
  type Point,
} from "./patterns/canvas-transform.js";

function firstRootBox(
  layer: HTMLElement,
  getFocusTarget?: (layer: HTMLElement) => HTMLElement | null,
): Box | null {
  const card = getFocusTarget?.(layer);
  if (!(card instanceof HTMLElement)) return null;

  let x = 0;
  let y = 0;
  let node: HTMLElement | null = card;
  while (node !== null && node !== layer) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent instanceof HTMLElement ? node.offsetParent : null;
  }
  return { x, y, width: card.offsetWidth, height: card.offsetHeight };
}

export interface PanZoomCanvasHandle {
  fit: () => void;
  reset: () => void;
}
export interface PanZoomCanvasProps {
  /** Accessible name of the navigable diagram. */
  label: string;
  /** Diagram content; controls should stop pointer propagation to avoid panning. */
  children: ReactNode;
  /** Fit once when content first becomes ready. */
  ready?: boolean;
  /** Optional content anchor used when a large diagram cannot fit legibly. */
  getFocusTarget?: (layer: HTMLElement) => HTMLElement | null;
  /** Drives external Fit and Reset controls. */
  ref?: Ref<PanZoomCanvasHandle>;
  /** Optional testing hooks, without layout overrides. */
  testIds?: { viewport?: string; layer?: string };
}
/** Pannable, zoomable diagram surface. Arrow keys pan, +/- zoom and Home resets. */
export function PanZoomCanvas({
  label,
  children,
  ready = true,
  getFocusTarget,
  ref,
  testIds,
}: PanZoomCanvasProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const layerRef = useRef<HTMLDivElement | null>(null);
  const [transform, setTransform] =
    useState<CanvasTransform>(IDENTITY_TRANSFORM);

  /** Fingers or the mouse button currently down on the background. */
  const pointers = useRef(new Map<number, Point>());
  /** How far apart the two fingers were the last time a pinch was measured. */
  const pinchSpan = useRef<number | null>(null);

  /** Where a client point sits inside the canvas. */
  const toCanvas = useCallback((clientX: number, clientY: number): Point => {
    const element = viewportRef.current;
    if (element === null) return { x: clientX, y: clientY };
    const rect = element.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const fit = useCallback(() => {
    const viewport = viewportRef.current;
    const layer = layerRef.current;
    if (viewport === null || layer === null) return;
    // `offsetWidth` is the laid-out size, unaffected by the transform already
    // applied — measuring the bounding rect instead would compound the zoom.
    setTransform(
      fitTo(
        { width: layer.offsetWidth, height: layer.offsetHeight },
        { width: viewport.clientWidth, height: viewport.clientHeight },
        firstRootBox(layer, getFocusTarget),
      ),
    );
  }, [getFocusTarget]);

  const reset = useCallback(() => setTransform(IDENTITY_TRANSFORM), []);

  useImperativeHandle(ref, () => ({ fit, reset }), [fit, reset]);

  // Open on the whole structure rather than on its top-left corner. Once only:
  // after that the view is the reader's, and Fit is a button they press.
  const fitted = useRef(false);
  useLayoutEffect(() => {
    if (fitted.current || !ready) return;
    fitted.current = true;
    fit();
  }, [fit, ready]);

  // React listens for wheel events passively at the root, which cannot stop the
  // page scrolling behind the canvas — so the canvas binds its own.
  useEffect(() => {
    const element = viewportRef.current;
    if (element === null) return undefined;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const cursor = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      setTransform((current) =>
        zoomAt(current, cursor, wheelZoomFactor(event.deltaY, event.ctrlKey)),
      );
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      // Left button and touches only; a right-click belongs to the browser.
      if (event.pointerType === "mouse" && event.button !== 0) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      pointers.current.set(
        event.pointerId,
        toCanvas(event.clientX, event.clientY),
      );
      if (pointers.current.size === 2) {
        const [first, second] = [...pointers.current.values()];
        pinchSpan.current = distance(first, second);
      }
    },
    [toCanvas],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const previous = pointers.current.get(event.pointerId);
      if (previous === undefined) return;
      const next = toCanvas(event.clientX, event.clientY);
      pointers.current.set(event.pointerId, next);

      if (pointers.current.size >= 2) {
        const [first, second] = [...pointers.current.values()];
        const span = distance(first, second);
        const previousSpan = pinchSpan.current;
        pinchSpan.current = span;
        if (previousSpan === null || previousSpan === 0 || span === 0) return;
        const centre = midpoint(first, second);
        setTransform((current) => zoomAt(current, centre, span / previousSpan));
        return;
      }

      setTransform((current) =>
        panBy(current, next.x - previous.x, next.y - previous.y),
      );
    },
    [toCanvas],
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      pointers.current.delete(event.pointerId);
      if (pointers.current.size < 2) pinchSpan.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [],
  );

  return (
    <div
      ref={viewportRef}
      role="region"
      aria-label={label}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        const directions: Record<string, [number, number]> = {
          ArrowLeft: [40, 0],
          ArrowRight: [-40, 0],
          ArrowUp: [0, 40],
          ArrowDown: [0, -40],
        };
        if (directions[event.key]) {
          event.preventDefault();
          const [x, y] = directions[event.key];
          setTransform((current) => panBy(current, x, y));
        } else if (event.key === "Home") {
          event.preventDefault();
          reset();
        } else if (event.key === "+" || event.key === "-") {
          event.preventDefault();
          const centre = {
            x: event.currentTarget.clientWidth / 2,
            y: event.currentTarget.clientHeight / 2,
          };
          const factor = event.key === "+" ? 1.2 : 1 / 1.2;
          setTransform((current) => zoomAt(current, centre, factor));
        }
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="k-pan-zoom"
      data-testid={testIds?.viewport}
    >
      <div
        ref={layerRef}
        className="k-pan-zoom-layer"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
        data-testid={testIds?.layer}
      >
        {children}
      </div>
    </div>
  );
}
