"use client";
import type {
  ReactNode,
  HTMLAttributes,
  ThHTMLAttributes,
  TdHTMLAttributes,
} from "react";
export type ForecastTone = "neutral" | "good" | "watch" | "bad" | "accent";
/** Period cells contain display-ready values. All totals, FTE averaging and permission checks belong to the adapter. */
export interface ForecastTableProps {
  label: string;
  periods: readonly { id: string; label: string }[];
  rows: readonly {
    id: string;
    label: ReactNode;
    cells: readonly ReactNode[];
    total?: ReactNode;
    level?: number;
  }[];
  totalLabel?: string;
  refreshing?: boolean;
  footer?: ReactNode;
}
export function ForecastTable({
  label,
  periods,
  rows,
  totalLabel = "Total",
  refreshing,
  footer,
}: ForecastTableProps) {
  return (
    <ForecastViewport>
      <ForecastTableFrame refreshing={refreshing} aria-label={label}>
        <ForecastHeader>
          <ForecastRow>
            <ForecastHeaderCell position="label">{label}</ForecastHeaderCell>
            {periods.map((period) => (
              <ForecastHeaderCell key={period.id}>
                {period.label}
              </ForecastHeaderCell>
            ))}
            <ForecastHeaderCell position="total">
              {totalLabel}
            </ForecastHeaderCell>
          </ForecastRow>
        </ForecastHeader>
        <ForecastBody>
          {rows.map((row) => (
            <ForecastRow key={row.id}>
              <ForecastCell position="label" level={row.level}>
                {row.label}
              </ForecastCell>
              {row.cells.map((cell, index) => (
                <ForecastCell key={periods[index]?.id ?? index}>
                  {cell}
                </ForecastCell>
              ))}
              <ForecastCell position="total">{row.total}</ForecastCell>
            </ForecastRow>
          ))}
        </ForecastBody>
        {footer && <ForecastFooter>{footer}</ForecastFooter>}
      </ForecastTableFrame>
    </ForecastViewport>
  );
}
/** The viewport owns both scroll axes; labels and totals remain pinned. */
export function ForecastViewport({ children }: { children: ReactNode }) {
  return <div className="k-forecast-viewport">{children}</div>;
}
export function ForecastTableFrame({
  refreshing,
  ...props
}: Omit<HTMLAttributes<HTMLTableElement>, "style" | "className"> & {
  refreshing?: boolean;
}) {
  return (
    <table
      {...props}
      className="k-forecast-table"
      aria-busy={refreshing || undefined}
    />
  );
}
export function ForecastHeader(
  props: Omit<HTMLAttributes<HTMLTableSectionElement>, "style" | "className">,
) {
  return <thead {...props} />;
}
export function ForecastBody(
  props: Omit<HTMLAttributes<HTMLTableSectionElement>, "style" | "className">,
) {
  return <tbody {...props} />;
}
export function ForecastFooter(
  props: Omit<HTMLAttributes<HTMLTableSectionElement>, "style" | "className">,
) {
  return <tfoot {...props} />;
}
export function ForecastRow(
  props: Omit<HTMLAttributes<HTMLTableRowElement>, "style" | "className">,
) {
  return <tr {...props} />;
}
/** Geometry and semantic highlights are closed props, not CSS from the caller. */
export type ForecastCellProps = Omit<
  TdHTMLAttributes<HTMLTableCellElement>,
  "style" | "className"
> & {
  position?: "label" | "period" | "total";
  level?: number;
  tone?: ForecastTone;
};
export function ForecastCell({
  position = "period",
  level = 0,
  tone = "neutral",
  ...props
}: ForecastCellProps) {
  return (
    <td
      {...props}
      data-position={position}
      data-tone={tone}
      style={
        position === "label"
          ? { paddingInlineStart: 16 + Math.max(0, level) * 24 }
          : undefined
      }
    />
  );
}
export function ForecastHeaderCell({
  position = "period",
  level = 0,
  tone = "neutral",
  ...props
}: Omit<ThHTMLAttributes<HTMLTableCellElement>, "style" | "className"> &
  Pick<ForecastCellProps, "position" | "level" | "tone">) {
  return (
    <th
      {...props}
      scope="col"
      data-position={position}
      data-tone={tone}
      style={
        position === "label"
          ? { paddingInlineStart: 16 + Math.max(0, level) * 24 }
          : undefined
      }
    />
  );
}
/** Formatted variance; arithmetic and consequence are supplied by the application. */
export interface ForecastVarianceProps {
  label: string;
  description?: string;
  tone: ForecastTone;
}
export function ForecastVariance({
  label,
  description,
  tone,
}: ForecastVarianceProps) {
  return (
    <span className="k-forecast-variance" data-tone={tone} title={description}>
      {label}
    </span>
  );
}
/** Non-numeric direction marker, accompanied by a supplied accessible label. */
export interface ForecastDeltaProps {
  direction: "increase" | "decrease";
  tone: ForecastTone;
  label: string;
}
export function ForecastDelta({ direction, tone, label }: ForecastDeltaProps) {
  return (
    <span className="k-forecast-delta" data-tone={tone} aria-label={label}>
      {direction === "increase" ? "↑" : "↓"}
    </span>
  );
}

export {ForecastMatrix,ForecastMatrixFrame,ForecastExpandableRow,ForecastValue} from './matrix.js';
export type {ForecastMatrixProps,ForecastMatrixRow,ForecastMatrixFrameProps,ForecastExpandableRowProps,ForecastValueProps,ForecastPeriod} from './matrix.js';
