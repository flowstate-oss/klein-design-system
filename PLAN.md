# Migration status

Updated 26 September 2026. This replaces the initial phased status; the original plan is preserved in docs/ORIGINAL_PLAN.md.

| Family | Implemented boundary |
| --- | --- |
| Foundations | Generated Klein tokens, typography, semantic colors, optional Flowstate dark extension |
| Controls | Shared implementation extracted; closed public APIs and explicit legacy compatibility APIs |
| Layouts | Five ViewLayout variants, edge-to-edge bands, split bands, section bars, entity layouts, stable-width panels, sidebar/title/body/details shell; Settings now reuses the shell |
| Tables | Renamed app adapter and types; shared semantic renderer, sizing, selection, toolbar controls, budget/basis cells, AG Grid wrappers; saved preferences remain in Flowstate |
| Charts | Chart.js wrappers, report renderer, split scales, dashboard legend, partial tails/reference lines, sparkline, bubble, Gantt/timeline, burndown; domain calculations stay in adapters |
| Forecast | Shared matrix geometry, rows/cells, pinned columns, variance/delta and allocation editor; queries, hierarchy, FTE/cost arithmetic and mutations remain in Flowstate |
| Eddy | Composer, message states, conversation scroll, history, panel, rail, preview and icon; connected transport remains in Flowstate |
| Documentation | Astro static catalogue, generated prop tables, runnable examples, custom-chart stories, migration reference and downloadable agent contracts |
| Adoption | Flowstate imports local packed releases; no runtime sibling dependency; agent entry points and CI checks updated |

The source manifest records each directly migrated module and its canonical import. Retained page compositions, rich-text/domain integrations and data adapters are application code, not independent library renderers. Compatibility APIs preserve existing callers; API normalization proceeds through closed exports rather than breaking every caller in this extraction.

All packages remain experimental and unpublished. The destination is flowstate-oss/klein-design-system. GitHub Pages is deployed. Initial npm authentication is required for the first public packages. The explicit renderer boundaries and retained application code are recorded in docs/RENDERER_AUDIT.md.

Validation and known limits are in docs/VALIDATION.md.

## Astro and complete collections

The current catalogue has 79 documented components/organisms with independently typechecked examples. Astro builds 246 static documentation pages, including full migrated API signatures. The original DataView composition now lives in TableCollection with shared state and toolbar controls, and Flowstate consumes that composition through data adapters. Dashboard, detail, workspace and edge-to-edge layouts are documented first-class recipes. Functional organism names include MetricStrip, MetricGrid, StandingSummary, CapacityBreakdown, CapacityBubbleChart, ForecastActualChart, AllocationTimeline and ForecastMatrix. ApplicationLayout now supplies the shared workspace/area viewport frame; ProfilePageLayout supplies subject pages. Publication configuration uses @klein-ui and flowstate-oss/klein-design-system; see docs/PUBLISHING.md.

The custom renderer audit now includes RadarComparison, CumulativeChart, DistributionChart, CapacityBreakdown, WaterfallChart and ShareBreakdown. Shared Chart supports area/stacking, bounded axes, target lines, filter highlighting, formatted values and keyboard selection using stable IDs. All route-local Chart.js renderers now use canonical charts. RelationshipPlot, ForecastAdjustmentChart, ChartPanel, ProgressPie, Notice, EddyLaunchpad and PanZoomCanvas cover the next custom patterns. HierarchyTree, AssignmentCard, HierarchySummaryCard, ReviewSequence, RankedBars, SegmentedBar, BreakdownTable, RangeTrack and ValueTransition now cover the additional custom patterns. ForecastValue owns the stacked forecast-cell presentation. Progress includes target and projected-fill variants. See docs/RENDERER_AUDIT.md for the explicit retained boundaries; the inventory is not a claim that all legacy page markup has been rewritten.
