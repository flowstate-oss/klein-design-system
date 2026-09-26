"use client";
import type { PointerEventHandler, Ref } from "react";
export type RangeTrackPart = "start" | "end" | "move";
/** Prepared range geometry. Date arithmetic and edits belong to the application. */
export interface RangeTrackProps {
  label: string;
  /** Text displayed inside the interval. */
  valueLabel: string;
  left: number;
  width: number;
  /** Proportional grid columns; values are relative weights, not dates. */
  columns: readonly { id: string; weight: number }[];
  tone?: "accent" | "bad";
  ongoing?: boolean;
  dragging?: boolean;
  trackRef?: Ref<HTMLDivElement>;
  /** Pointer editing is an optional adapter capability. Supply a separate accessible date editor. */
  onPointerDown?: (part: RangeTrackPart) => PointerEventHandler<HTMLElement>;
  startLabel?: string;
  endLabel?: string;
  startValue?: string;
  endValue?: string;
  testIds?: { bar?: string; start?: string; end?: string };
}
/** A proportional interval with gridlines and optional resize handles. */
export function RangeTrack({
  label,
  valueLabel,
  left,
  width,
  columns,
  tone = "accent",
  ongoing = false,
  dragging = false,
  trackRef,
  onPointerDown,
  startLabel,
  endLabel,
  startValue,
  endValue,
  testIds,
}: RangeTrackProps) {
  const position = Number.isFinite(left) ? Math.max(0, Math.min(100, left)) : 0;
  const extent = Number.isFinite(width)
    ? Math.max(0, Math.min(100 - position, width))
    : 0;
  return (
    <div ref={trackRef} className="k-range-track">
      <div className="k-range-track-grid" aria-hidden="true">
        {columns.map((column) => (
          <span
            key={column.id}
            style={{ flex: `${Math.max(0, column.weight) || 1} 0 0%` }}
          />
        ))}
      </div>
      <div
        className="k-range-track-bar"
        data-tone={tone}
        data-editable={!!onPointerDown || undefined}
        data-dragging={dragging || undefined}
        data-ongoing={String(ongoing)}
        data-conflict={String(tone === "bad")}
        data-testid={testIds?.bar}
        style={{ left: `${position}%`, width: `${extent}%` }}
        title={label}
        onPointerDown={onPointerDown?.("move")}
      >
        {onPointerDown && (
          <span
            className="k-range-track-handle"
            data-edge="start"
            aria-label={startLabel}
            title={startValue}
            onPointerDown={onPointerDown("start")}
            data-testid={testIds?.start}
          >
            <span />
          </span>
        )}
        {tone === "bad" && (
          <span className="k-range-track-warning" aria-hidden="true">
            !
          </span>
        )}
        <span className="k-range-track-label">{valueLabel}</span>
        {onPointerDown && (
          <span
            className="k-range-track-handle"
            data-edge="end"
            aria-label={endLabel}
            title={endValue}
            onPointerDown={onPointerDown("end")}
            data-testid={testIds?.end}
          >
            <span />
          </span>
        )}
      </div>
    </div>
  );
}
