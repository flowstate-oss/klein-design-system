"use client";
import { useState, type ReactNode } from "react";
/** Accessible equivalent of a chart's values. Canvas hover is never the only data access. */
export function ChartDataTable({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: readonly string[];
  rows: readonly { id: string; values: readonly ReactNode[] }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <details onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>{caption}</summary>
      {open && (
        <table>
          <caption>{caption}</caption>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={index} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {row.values.map((value, index) =>
                  index === 0 ? (
                    <th key={index} scope="row">
                      {value}
                    </th>
                  ) : (
                    <td key={index}>{value}</td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </details>
  );
}
