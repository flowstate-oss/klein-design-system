import { tokens } from "@klein-ui/tokens";
/** Six Klein series plus six documented product identities; every index is distinct. */
export const CHART_PALETTE_LIGHT = Array.from(
  { length: 12 },
  (_, index) =>
    tokens[
      `series-${String(index + 1).padStart(2, "0")}` as keyof typeof tokens
    ],
);
export const CHART_PALETTE_DARK = Array.from(
  { length: 12 },
  (_, index) =>
    tokens[
      `series-dark-${String(index + 1).padStart(2, "0")}` as keyof typeof tokens
    ],
);
