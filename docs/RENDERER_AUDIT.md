# Renderer ownership audit

26 September 2026, Flowstate `project-fabric` (`09886eaf4`, with the migration working tree). The machine-readable [inventory](migration-inventory.json) records consumer files importing Klein. It is an ownership index, not a count of every UI element in the application.

## Canonical presentation

| Application pattern | Library boundary |
| --- | --- |
| Workspace, area and settings navigation frame | ApplicationLayout; application supplies navigation, title and drawer slots |
| List, dashboard, details and subject pages | ViewLayout, ListViewTemplate, DashboardPageLayout, DetailPageLayout, ProfilePageLayout |
| Edge-to-edge content | EdgeToEdgeLayout, DashboardBand, SplitBand; the band owns its inner gutter |
| Original DataView composition | TableCollection, ViewProvider, TableToolbar, SharedFiltersProvider, renderer, board and timeline; application adapters retain saved preferences and URL state |
| Custom forecast table | ForecastMatrix and its frame, expandable rows, values and allocation editor; hierarchy, money and FTE calculations stay in adapters |
| Metric strips, cards and capacity summaries | MetricStrip, MetricGrid, StandingSummary, CapacityBreakdown |
| Chart.js and route-local graphs | Chart and the documented specialized chart renderers; domain adapters prepare series and stable point identities |
| Hand-built SVG charts and split/ranked bars | ShareBreakdown, ProgressPie, RankedBars, SegmentedBar and Chart; fixed tool identities use the pure token-backed tool-colours module |
| Budget, objective, import and target meters | Progress with semantic tone, projected fill or target marker; adapters own thresholds and localized actual values |
| Organisation diagram | PanZoomCanvas, HierarchyTree, AssignmentCard, HierarchySummaryCard; application owns hierarchy queries, permission checks and drag/drop mutations |
| Resource schedule interval | RangeTrack with prepared proportional geometry; date conversion, drag sessions and saves remain in the application |
| Approval/review sequence | ReviewSequence; adapter owns workflow status meanings and formatted details |
| Before/after allocation preview | ValueTransition |
| Eddy | Launchpad, composer, messages, history, panel, rail and previews; transport, tools and route permissions remain in Flowstate |
| Repeated inline feedback | Notice; adapters provide translated errors and recovery actions |

## Deliberately retained application code

- **Data and decisions:** queries, persistence, auth, route links, localization, currency conversion, financial arithmetic, allocation dates, period grouping and feature access. Moving these into a dumb renderer would make it depend on Flowstate services.
- **Page compositions:** routes choose which canonical layouts, controls and organisms to compose. A business form or a property-cell adapter is not automatically another library component.
- **Feature illustrations:** GhostDashboard, LockedChartPanel and FeatureHoldingPreview contain fixed decorative product sketches, not live-data charts. They remain application onboarding/upgrade content, with their existing aria-hidden treatment. They must not become templates for real chart implementation.
- **Brand, geographical and editorial integrations:** application logo, flags, product-specific icon assets, onboarding artwork and rich-text editor node/toolbar integrations retain their owning application context.
- **Third-party interaction adapters:** date-window editing, external drag/drop bindings and domain context menus remain application integrations around canonical renderers. RangeTrack pointer handles supplement the application's date-editing controls; they do not claim a standalone keyboard date editor.

## Enforcement and limits

New work must use the closed catalogue APIs. Explicit compatibility exports preserve existing consumers; they are documented migration contracts, not permission to make new variants. The adoption guard records pre-existing page-level violations and rejects new occurrences without expanding that baseline. This extraction does not claim that all legacy page markup has been rewritten or that the whole application passes TypeScript: the validation report records the existing diagnostics and the actual regression checks.

When a retained composition becomes reusable, name it by function, prepare its display model in the application, and add the canonical renderer, props, example and contract together. Do not copy any extracted implementation back into Flowstate.
