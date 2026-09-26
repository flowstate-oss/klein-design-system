"use client";
import { Fragment, type ReactNode } from "react";
import {
  ForecastViewport,
  ForecastTableFrame,
  ForecastHeader,
  ForecastHeaderCell,
  ForecastRow,
  ForecastBody,
  ForecastFooter,
  ForecastCell,
  type ForecastTone,
} from "./index.js";
/** A stable period identity and a ready-to-render heading. */
export interface ForecastPeriod {
  id: string;
  label: ReactNode;
  tone?: ForecastTone;
}
/** Shared frame used by both the complete matrix and lazy application row adapters. */
export interface ForecastMatrixFrameProps {
  label: string;
  rowHeading: ReactNode;
  periods: readonly ForecastPeriod[];
  totalLabel?: ReactNode;
  refreshing?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}
export function ForecastMatrixFrame({
  label,
  rowHeading,
  periods,
  totalLabel = "Total",
  refreshing,
  children,
  footer,
}: ForecastMatrixFrameProps) {
  return (
    <ForecastViewport>
      <ForecastTableFrame aria-label={label} refreshing={refreshing}>
        <ForecastHeader>
          <ForecastRow>
            <ForecastHeaderCell position="label">
              {rowHeading}
            </ForecastHeaderCell>
            {periods.map((period) => (
              <ForecastHeaderCell key={period.id} tone={period.tone}>
                {period.label}
              </ForecastHeaderCell>
            ))}
            <ForecastHeaderCell position="total">
              {totalLabel}
            </ForecastHeaderCell>
          </ForecastRow>
        </ForecastHeader>
        <ForecastBody>{children}</ForecastBody>
        {footer && <ForecastFooter>{footer}</ForecastFooter>}
      </ForecastTableFrame>
    </ForecastViewport>
  );
}
/** A controlled, accessible expanding forecast row. Children are period and total cells. */
export interface ForecastExpandableRowProps {
  id: string;
  label: string;
  level?: number;
  tone?: ForecastTone;
  hasChildren?: boolean;
  expanded?: boolean;
  loading?: boolean;
  refreshing?: boolean;
  count?: number;
  countDescription?: string;
  onExpandedChange?: (id: string, expanded: boolean) => void;
  onRowClick?: (id: string) => void;
  children: ReactNode;
}
export function ForecastExpandableRow({
  id,
  label,
  level,
  tone,
  hasChildren,
  expanded = false,
  loading,
  refreshing,
  count,
  countDescription,
  onExpandedChange,
  onRowClick,
  children,
}: ForecastExpandableRowProps) {
  return (
    <ForecastRow>
      <ForecastCell position="label" level={level} tone={tone}>
        <div className="k-forecast-row-label">
          {hasChildren ? (
            <button
              type="button"
              aria-label={`${expanded ? "Collapse" : "Expand"} ${label}`}
              aria-expanded={expanded}
              aria-busy={loading || refreshing || undefined}
              disabled={loading}
              onClick={(event) => {
                event.stopPropagation();
                onExpandedChange?.(id, !expanded);
              }}
            >
              {loading || refreshing ? "…" : expanded ? "⌄" : "›"}
            </button>
          ) : (
            <span className="k-forecast-row-spacer" />
          )}
          {onRowClick ? (
            <button
              type="button"
              className="k-forecast-row-link"
              onClick={() => onRowClick(id)}
            >
              {label}
            </button>
          ) : (
            <span>{label}</span>
          )}
          {count !== undefined && count > 0 && (
            <span title={countDescription}>({count})</span>
          )}
        </div>
      </ForecastCell>
      {children}
    </ForecastRow>
  );
}
/** Primary and secondary display values, with supplied deltas and permission-filtered content. */
export interface ForecastValueProps {
  primary: ReactNode;
  secondary?: ReactNode;
  primaryTitle?: string;
  pending?: boolean;
  onEdit?: () => void;
  editLabel?: string;
}
export function ForecastValue({
  primary,
  secondary,
  primaryTitle,
  pending,
  onEdit,
  editLabel,
}: ForecastValueProps) {
  return (
    <div className="k-forecast-value" aria-busy={pending || undefined}>
      {onEdit ? (
        <button
          type="button"
          aria-label={editLabel}
          title={primaryTitle}
          onClick={onEdit}
        >
          {primary}
        </button>
      ) : (
        <div title={primaryTitle}>{primary}</div>
      )}
      {secondary != null && <div data-secondary="">{secondary}</div>}
    </div>
  );
}
/** Hierarchical display model. All totals, variances and permissions are resolved by the data layer. */
export interface ForecastMatrixRow {
  id: string;
  label: string;
  count?: number;
  tone?: ForecastTone;
  cells: Readonly<
    Record<
      string,
      {
        primary: ReactNode;
        secondary?: ReactNode;
        tone?: ForecastTone;
        editable?: boolean;
        pending?: boolean;
      }
    >
  >;
  total?: ReactNode;
  hasChildren?: boolean;
  loading?: boolean;
  error?: string;
  children?: readonly ForecastMatrixRow[];
}
export interface ForecastMatrixProps {
  label: string;
  rowHeading: string;
  periods: readonly ForecastPeriod[];
  rows: readonly ForecastMatrixRow[];
  expandedIds: ReadonlySet<string>;
  onExpandedChange: (id: string, expanded: boolean) => void;
  onRowClick?: (id: string) => void;
  onCellEdit?: (rowId: string, periodId: string) => void;
  refreshing?: boolean;
  loading?: boolean;
  error?: string;
  emptyLabel?: string;
  loadingLabel?: string;
  totalLabel?: string;
  footer?: ReactNode;
}
/** Complete forecast organism with controlled hierarchy, lazy child states and edit intents. */
export function ForecastMatrix({
  label,
  rowHeading,
  periods,
  rows,
  expandedIds,
  onExpandedChange,
  onRowClick,
  onCellEdit,
  refreshing,
  loading,
  error,
  emptyLabel = "No forecast data",
  loadingLabel = "Loading forecast…",
  totalLabel,
  footer,
}: ForecastMatrixProps) {
  if (error) return <p role="alert">{error}</p>;
  if (loading && !rows.length) return <p role="status">{loadingLabel}</p>;
  if (!rows.length) return <p role="status">{emptyLabel}</p>;
  function renderRows(
    items: readonly ForecastMatrixRow[],
    level = 0,
  ): ReactNode {
    return items.map((row) => {
      const expanded = expandedIds.has(row.id);
      return (
        <Fragment key={row.id}>
          <ForecastExpandableRow
            id={row.id}
            label={row.label}
            level={level}
            tone={row.tone}
            count={row.count}
            hasChildren={row.hasChildren ?? Boolean(row.children?.length)}
            expanded={expanded}
            loading={row.loading}
            onExpandedChange={onExpandedChange}
            onRowClick={onRowClick}
          >
            {periods.map((period) => {
              const cell = row.cells[period.id];
              return (
                <ForecastCell key={period.id} tone={cell?.tone}>
                  <ForecastValue
                    primary={cell?.primary ?? "—"}
                    secondary={cell?.secondary}
                    pending={cell?.pending}
                    onEdit={
                      cell?.editable && onCellEdit
                        ? () => onCellEdit(row.id, period.id)
                        : undefined
                    }
                    editLabel={`Edit ${row.label}, ${String(period.label)}`}
                  />
                </ForecastCell>
              );
            })}
            <ForecastCell position="total">{row.total}</ForecastCell>
          </ForecastExpandableRow>
          {expanded &&
            (row.error ? (
              <ForecastRow>
                <ForecastCell colSpan={periods.length + 2}>
                  <span role="alert">{row.error}</span>
                </ForecastCell>
              </ForecastRow>
            ) : row.loading ? (
              <ForecastRow>
                <ForecastCell colSpan={periods.length + 2}>
                  <span role="status">{loadingLabel}</span>
                </ForecastCell>
              </ForecastRow>
            ) : (
              renderRows(row.children ?? [], level + 1)
            ))}
        </Fragment>
      );
    });
  }
  return (
    <ForecastMatrixFrame
      label={label}
      rowHeading={rowHeading}
      periods={periods}
      totalLabel={totalLabel}
      refreshing={refreshing}
      footer={footer}
    >
      {renderRows(rows)}
    </ForecastMatrixFrame>
  );
}
