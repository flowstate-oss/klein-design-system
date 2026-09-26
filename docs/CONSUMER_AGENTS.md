# Klein consumer instructions

Use the installed `@klein-ui/contracts/components.json` before implementing UI. Search purpose and aliases, read usage, behavior and avoid rules, then use the documented public import. The shipped version of this catalogue is authoritative for the installed package.

1. Reuse a component, then compose its documented slots, then extend the canonical library component if a real gap remains. Never create another Button, Field, PageHeader, Tabs, RouteTabs or view template in a consumer.
2. Import only public `@klein-ui/*` exports. No raw buttons/inputs, vendor component engines, deep imports, colour literals, decorative geometry or overrides of component styles in adopted surfaces.
3. A view has one header and one control region before its body. Route navigation uses RouteTabs; local panel selection uses Tabs. Layouts own their gutters and overflow. Do not add another padded grid or toolbar.
4. Keep queries, mutations, routing, permissions, business calculations and saved preferences in application adapters. Components receive values and emit typed intents. Do not infer semantic consequences from a sign or infer errors from message prose.
5. Use native `disabled`, `required`, `readOnly`, `value`, `onChange(event)` for native inputs; use `value`/`onValueChange(next)` for composed selection. No prop synonyms or arbitrary `style`/`className` escapes. Locale and currency come from the application.
6. Run `klein-check <adopted-directory>` and relevant application checks. Missing capability: change the library with an example and a behaviour test; do not add exceptions or weaken checks to pass CI.

Tables are named Table, never DataView. Use @klein-ui/table for rendering, @klein-ui/charts for charts, @klein-ui/forecast for forecast geometry and @klein-ui/eddy for assistant presentation. Existing saved-view storage keys are compatibility data and must not be renamed.

For edge-to-edge pages use EdgeToEdgeLayout → DashboardBand (flush for tables), optionally SplitBand. No outer padding or gaps between bands. Use ViewLayout for list, detail, dashboard, kanban and spreadsheet variants.

The /compat exports preserve existing application APIs during adoption. They are not a source of new components: do not introduce a new compatibility import or copy its className/style escape hatches. Extend a closed public API in the library when needed. Existing adapters may retain Next routing, locale, domain transforms and permissions; the visual renderer must come from Klein.

Each shipped API has typed declarations. The main catalogue documents closed APIs; the migration inventory and compatibility reference document retained application APIs. Experimental means not yet published as a stable release, not a licence to create parallel implementations.

The checker detects explicit syntax/import/style violations. It cannot prove arbitrary JSX is not a duplicate header; component ownership and review remain required. Scope it to migrated surfaces initially, then expand adoption. Do not run it against implementation code in the design-system repository itself.

## Complete organisms and layouts

Use TableCollection for the full DataView pattern, including TableToolbar and its shared state. Table is the small rows/columns-only surface. Never rebuild the filter/sort/properties toolbar in a consumer. Use savedViews/actions slots for data-backed integrations, and state initialState/search/onPersist for application adapters. Read docs/TABLE_COLLECTION.md when changing table composition.

Choose ApplicationLayout (sidebar beside the title/body column), WorkspaceLayout (header above both columns), ProfilePageLayout, DashboardPageLayout, DetailPageLayout, ListViewTemplate or EdgeToEdgeLayout before composing page content. Do not add page gutters around EdgeToEdgeLayout. Reuse MetricStrip/MetricGrid, AnalyticsChart/DashboardChart, CapacityBubbleChart, ForecastActualChart, AllocationTimeline, ForecastTable and EddyPanel by function rather than copying a feature-specific predecessor.

The Astro website publishes static props and copyable examples alongside interactive specimens. Component code, typed examples, generated contracts and behaviour checks change together. All npm imports use @klein-ui.
