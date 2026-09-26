# Foundation decisions

## Visual authority

The Klein reference in `~/Code/klein` is the source for colour, spacing, type and control geometry. The application branch is the source for real product behaviour. The copied PLAN.md records the reviewed application revision. This milestone uses Klein-first light styling; it does not silently remove dark mode from Flowstate. Adapters preserve application behavior while adopting canonical presentation.

## Documented extensions

- View templates preserve full-width product layouts, 24px outer gutters and 16px view internals, rather than applying the reference specimen's 56px gutter everywhere.
- Tabs/navigation are not defined by the original reference. RouteTabs are genuine links; Tabs use Radix for local panel keyboard/focus semantics with manual activation. Styling is owned by Klein.
- Small icon actions use a required accessible label and the reference glyph set. Additional icons require review; no Lucide dependency is introduced.
- Supporting text uses Body (#4B505A); Muted (#8A8F9A) is retained for inactive controls because it is too light for ordinary small copy on white.
- Inputs expose decimal entry through inputMode and string values. Conversion, validation and currency rules belong to consumers.
- The button API separates presentation from meaning. Only primary supports neutral/accent/danger; secondary/tertiary are neutral and text is accent. Invalid combinations fail TypeScript. Danger hover/active values come from the reference Button implementation.
- The docs self-host Geist and Geist Mono using OFL font packages. Components do not import remote fonts or bundle the reference trial logo font.

## Public API and boundaries

No style/className/asChild escape hatches in the initial public controls. Slots permit composition without changing control geometry. This is not runtime protection against malicious casts or CSS; the contract, consumer checks and review enforce it together.

Library components may own focus and interaction mechanics. Controlled tabs and inputs delegate value changes. Layouts own padding/overflow. The application owns auth, network, persistence, route matching and financial semantics.

## Implementation scope

The packages now include controls, complete table collections, charts, forecast, Eddy and page templates. Metadata marks every component experimental. PLAN.md and the migration inventory describe ownership; do not treat a curated catalogue count as evidence that every application renderer has migrated.

## Documentation and checking

Astro replaces the initial Ladle host at Will’s request. Content, generated prop tables and code examples are built as static HTML; React islands supply interaction. The registry validates public export coverage and requires a typed example. Native HTML props are inherited and not repeated in every generated table. Union signatures describe mode-specific requirements.

Consumer checks reject explicit raw controls, vendor/legacy/deep imports, inline styling, off-palette utilities, raw CSS colour literals, decorative radius/shadow and selectors targeting .k-* internals. They do not prove all visual styles are valid tokens, follow every spread or indirection, or identify every duplicate composition. The catalogue and review cover those gaps; expand syntax checks as adoption uncovers concrete failures.

## Migration release, 26 September 2026

- Public naming is Table. The app folder and types are renamed; persisted `dataview` keys, column IDs and translation IDs remain compatible.
- Existing component APIs are extracted under explicit `/compat` paths to preserve working callers. These exports are forbidden for new features by the consumer checker. Closed APIs wrap the same vendor primitives and have curated contracts.
- Chart.js, AG Grid and Gantt renderers live in library packages. Domain calculations, queries, formatting, route decisions and persistence stay in Flowstate. Legacy chart options remain only on the migration API; the public Chart API is closed.
- Flowstate dark mode is an explicit opt-in product extension (`@klein-ui/react/dark.css`) preserving its existing neutral palette. It overrides semantic roles, not Klein brand primitives. Lucide remains supported by extracted APIs; new root Icon uses the approved glyph set.
- Packages are vendored as npm tarballs while initial @klein-ui registry authentication is pending. The application installs reproducibly without access to a sibling checkout. Nothing has been published.

The six chart identities use explicit `series-dark-01` through `series-dark-06` product-extension tokens on dark surfaces. Their higher lightness keeps marks visible against Flowstate's dark background. Both palettes repeat after six to preserve old twelve-position indexing; the dashboard renderer still caps its legend to the top four plus Other. These are display colors, not a change to metric values.

## Complete collections and functional organism names

TableCollection is the original DataView composition: its provider, toolbar, filters, sorts, properties, renderer, grouping, selection and pagination migrate together. Table is the smaller controlled rows/columns renderer. Shared filters use a controlled provider; routing, persistence and saved-view services are injected by application adapters. The original storage keys remain unchanged.

MetricStrip and MetricGrid replace feature-specific KPI names. DashboardPageLayout, DetailPageLayout and WorkspaceLayout describe the page structure rather than the feature that first needed it. EdgeToEdgeLayout and its bands remain the full-bleed recipe.

All packages use @klein-ui. The repository and MIT copyright belong to Flowstate; npm publication and GitHub Pages deployment are defined in the repository workflows.

ApplicationLayout extracts the actual viewport shell shared by workspace and area navigation. Its top slot supports native title bars; sidebar and content remain below it. WorkspaceLayout is the alternate header-above-navigation arrangement. ProfilePageLayout, StandingSummary and CapacityBreakdown use functional names; their application predecessors supply domain values and labels.

WaterfallChart owns floating ranges and the separately scaled, aligned companion strip; the data adapter computes the ranges and decides whether confidential values may be supplied. ShareBreakdown owns the cost-classification ring/legend geometry and estimated-value patterns; it receives percentages and formatted values. Chart selection emits seriesId/pointId/value and requires point IDs when interactive. Its expanded data table supports the same action by keyboard. Optional axis bounds, orientation and filter emphasis are closed presentation contracts, not vendor option bags.

EddyLaunchpad owns the branded prompt/suggestion surface, including the original motion and reduced-motion behavior. The application supplies permission-filtered, localized groups and handles submission/navigation. PanZoomCanvas owns pan, pinch/wheel zoom and legible Fit geometry; diagram hierarchy queries and filtering remain outside it. ChartPanel provides the consistent flat/panel chart heading composition. ProgressPie shares one renderer across lifecycle and measured-completion adapters; the canonical API accepts a percentage rather than application statuses. Notice supplies static or urgent feedback semantics.
