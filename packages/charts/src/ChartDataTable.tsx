import type { ReactNode } from "react";
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
  return (
    <details>
      <summary>{caption}</summary>
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
    </details>
  );
}
