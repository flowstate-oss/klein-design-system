import { tokens } from "@klein-ui/tokens";
export const CHART_PALETTE_LIGHT = Array.from(
  { length: 12 },
  (_, i) => tokens[("series-0" + ((i % 6) + 1)) as keyof typeof tokens],
);
// Same six series identities, lifted for Flowstate's dark surface.
export const CHART_PALETTE_DARK = Array.from(
  { length: 12 },
  (_, index) =>
    tokens[("series-dark-0" + ((index % 6) + 1)) as keyof typeof tokens],
);
