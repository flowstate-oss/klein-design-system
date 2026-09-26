/** Compact display formatting only; never rounds stored or calculated money. */
export function formatMoneyK(
  value: number | string,
  decimals = 1,
  currencyCode: string,
): string {
  const num = Number(value);
  let symbol = "$";
  try {
    symbol =
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 0,
      })
        .formatToParts(0)
        .find((p) => p.type === "currency")?.value ?? "$";
  } catch {
    /* Preserve the legacy invalid-code fallback. */
  }
  const abs = Math.abs(num),
    sign = num < 0 ? "-" : "";
  if (abs >= 1000000)
    return `${sign}${symbol}${(abs / 1000000).toFixed(decimals)}m`;
  if (abs >= 1000) return `${sign}${symbol}${(abs / 1000).toFixed(decimals)}k`;
  return `${sign}${symbol}${abs.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
