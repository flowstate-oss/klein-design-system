const PERIOD_LABEL_LOCALES = ["en-GB", "en-US", "pt-PT"] as const;
function normaliseMonthToken(token: string): string {
  return token.toLowerCase().replace(/\.$/, "");
}

function buildMonthOrder(): Record<string, number> {
  const formatters = PERIOD_LABEL_LOCALES.flatMap((locale) =>
    (["short", "long"] as const).map(
      (month) => new Intl.DateTimeFormat(locale, { month }),
    ),
  );
  const order: Record<string, number> = {};
  for (const format of formatters) {
    for (let month = 0; month < 12; month++) {
      // Day 15 avoids any timezone rollover across a month boundary.
      order[
        normaliseMonthToken(format.format(new Date(Date.UTC(2026, month, 15))))
      ] = month;
    }
  }
  return order;
}

const MONTH_ORDER: Record<string, number> = buildMonthOrder();

/**
 * Compare two period strings in "Mon YYYY" format chronologically.
 *
 * The analytics engine formats periods as "Jan 2025", "Feb 2025", etc.
 * Default string sort produces alphabetical order (Apr, Aug, Dec, ...),
 * so this comparator must be used instead.
 *
 * @param a - First period string (e.g. "Jan 2025")
 * @param b - Second period string (e.g. "Mar 2025")
 * @returns Negative if a < b, positive if a > b, zero if equal
 *
 * @example
 * ["Mar 2025", "Jan 2025", "Feb 2025"].sort(comparePeriods)
 * // ["Jan 2025", "Feb 2025", "Mar 2025"]
 */
export function comparePeriods(a: string, b: string): number {
  const pa = parsePeriod(a);
  const pb = parsePeriod(b);
  if (pa.year !== pb.year) return pa.year - pb.year;
  return pa.month - pb.month;
}

/**
 * Split a period label into a sortable year + zero-based month.
 *
 * Two shapes reach here, because the labels are produced by `Intl` in the
 * viewer's own locale:
 *   - `"Jan 26"` / `"Sept 26"` — en-GB, en-US (month NAME, space, year)
 *   - `"01/26"`                — pt-PT (numeric month/year, no space)
 * The numeric form used to fall through the space-split entirely, leaving
 * `NaN` on both sides, so Portuguese charts sorted their months arbitrarily.
 */
function parsePeriod(label: string): { year: number; month: number } {
  const numeric = /^(\d{1,2})[/-](\d{2,4})$/.exec(label.trim());
  if (numeric) {
    return {
      year: parseInt(numeric[2], 10),
      month: parseInt(numeric[1], 10) - 1,
    };
  }
  const [monthToken, yearToken] = label.split(" ");
  const year = parseInt(yearToken, 10);
  return {
    // An unparseable year sorts last, for the same reason an unknown month does.
    year: Number.isNaN(year) ? Number.MAX_SAFE_INTEGER : year,
    month: monthIndex(monthToken),
  };
}

/**
 * Resolve a month token to its zero-based index.
 *
 * An unrecognised token sorts to the END of the axis rather than to January.
 * A month we cannot place is a bug either way, but at the end it is visible
 * at the edge of the chart instead of hiding as a plausible mid-axis spike —
 * which is how "Sept" went unnoticed.
 */
function monthIndex(token: string): number {
  return (
    MONTH_ORDER[normaliseMonthToken(token ?? "")] ?? Number.MAX_SAFE_INTEGER
  );
}
