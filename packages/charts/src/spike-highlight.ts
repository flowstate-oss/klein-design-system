/**
 * Spike-highlight plugin for the line charts — translucent vertical bands
 * painted behind the series at flagged category indices.
 *
 * The agent-insights spend trendline calls out anomalous buckets
 * (`detectSpendAnomalies`); a sentence beneath the chart is not enough to see
 * WHERE a spike landed, so the flagged buckets get a red band drawn straight on
 * the plot. Chart.js 4 has no annotation support built in and
 * `chartjs-plugin-annotation` is not a dependency here, so this is a small
 * inline plugin — no new package.
 *
 * {@link spikeBands} is the pure geometry (pixel spans from category centres);
 * {@link createSpikeHighlightPlugin} is the thin Chart.js wrapper around it.
 */

/** A band to paint, in chart pixels. */
export interface SpikeBand {
  /** Left edge, chart-area pixels. */
  readonly left: number;
  /** Band width in pixels — always positive. */
  readonly width: number;
}

/**
 * Compute the pixel band for each flagged category index.
 *
 * A category axis gives us the CENTRE of each slot, so the band width is the
 * gap between neighbouring centres (the slot width). With a single category
 * there is no neighbour to measure against, so the band falls back to the whole
 * plot width — the entire series is the anomaly.
 *
 * Indices outside the series are ignored rather than throwing, because the
 * anomaly detector runs over the raw value array while the chart may have been
 * capped or re-bucketed by the time it renders.
 *
 * @param indices - Flagged category indices (may be unsorted or out of range).
 * @param centres - Pixel centre of every category slot, in category order.
 * @param plotLeft - Left edge of the plot area, pixels.
 * @param plotRight - Right edge of the plot area, pixels.
 * @returns One clamped band per in-range index, in the order given.
 */
export function spikeBands(
  indices: readonly number[],
  centres: readonly number[],
  plotLeft: number,
  plotRight: number,
): SpikeBand[] {
  if (centres.length === 0 || plotRight <= plotLeft) return [];

  // Slot width from the first neighbouring pair; a lone category spans the plot.
  const slot =
    centres.length > 1
      ? Math.abs(centres[1] - centres[0])
      : plotRight - plotLeft;
  const half = slot / 2;

  const bands: SpikeBand[] = [];
  for (const index of indices) {
    if (!Number.isInteger(index) || index < 0 || index >= centres.length)
      continue;
    const left = Math.max(plotLeft, centres[index] - half);
    const right = Math.min(plotRight, centres[index] + half);
    if (right <= left) continue;
    bands.push({ left, width: right - left });
  }
  return bands;
}

/** Fill used for a spike band — rose, deliberately faint so the line stays readable. */
export const SPIKE_BAND_FILL_LIGHT = "rgba(225, 29, 72, 0.10)";
/** Dark-theme fill — slightly hotter so it survives the darker plot background. */
export const SPIKE_BAND_FILL_DARK = "rgba(251, 113, 133, 0.16)";

/**
 * Build the Chart.js plugin that paints {@link spikeBands} beneath the datasets.
 *
 * Returned as a factory (not a module-level singleton) because the flagged
 * indices change with the period window, and Chart.js plugin objects are
 * compared by identity when React re-renders.
 *
 * @param indices - Category indices to highlight.
 * @param isDark - Whether the dark palette applies.
 * @returns A Chart.js plugin; a no-op when there is nothing to highlight.
 */
export function createSpikeHighlightPlugin(
  indices: readonly number[],
  isDark: boolean,
): {
  id: string;
  beforeDatasetsDraw: (chart: {
    ctx: CanvasRenderingContext2D;
    chartArea: { top: number; bottom: number; left: number; right: number };
    scales: Record<string, { getPixelForValue: (value: number) => number }>;
    data: { labels?: unknown[] };
  }) => void;
} {
  return {
    id: "spikeHighlight",
    beforeDatasetsDraw(chart) {
      if (indices.length === 0) return;
      const scale = chart.scales.x;
      const labels = chart.data.labels;
      if (!scale || !labels || labels.length === 0) return;

      const centres = labels.map((_, i) => scale.getPixelForValue(i));
      const { top, bottom, left, right } = chart.chartArea;
      const bands = spikeBands(indices, centres, left, right);
      if (bands.length === 0) return;

      const { ctx } = chart;
      ctx.save();
      ctx.fillStyle = isDark ? SPIKE_BAND_FILL_DARK : SPIKE_BAND_FILL_LIGHT;
      for (const band of bands) {
        ctx.fillRect(band.left, top, band.width, bottom - top);
      }
      ctx.restore();
    },
  };
}
