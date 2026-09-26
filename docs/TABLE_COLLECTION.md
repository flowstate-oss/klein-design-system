# Table collection (formerly DataView)

Use `TableCollection` for a complete list surface. `Table` is the small rows/columns-only organism. Both share the semantic `TableRenderer`; they are not interchangeable toolbar contracts.

Composition: `SharedFiltersProvider` (optional area scope) → `ViewProvider` → `TableToolbar` → `ViewLayout` → `TableBody` → table, board or timeline. `TableCollection` assembles this for ordinary pages; `TableCollectionContent` composes below a provider already owned by an application adapter.

## Ownership

| Capability | Library | Application |
| --- | --- | --- |
| Sort/filter/group/property state | `useViewState`, `ViewProvider`, `useView` | Map `externalState` to query inputs |
| Area filters | Controlled `SharedFiltersProvider` | URL and session persistence |
| Toolbar | `TableToolbar`, filter chips and controls | Option catalogues, translated labels, saved-view service slot |
| Saved preferences | Initial state, `applySavedView`, `onPersist` callback | Storage, default/personal/shared saved-view service |
| Rows | Semantic table, board/timeline, selection, resize/reorder, drag interactions | Ready-to-render rows, stable IDs, query pagination |
| Actions | Selection and pending interaction state | Authorization, mutations, confirmation content, export and navigation |

All query-related state is exposed through `onStateChange`. Column sizing/order are presentation-only and never trigger data queries. Changing a shared filter updates every provider in that scope. Locked filters override stored and saved-view values and survive clear/reset.

`TableCollection.state` supplies `search`, `initialState`, and `onPersist(viewId, state)`. Debounce search in the application. Read storage once before constructing the state provider. A different view ID should mount a new provider with `key={viewId}`. Do not inject a new initial state on every render expecting a controlled replacement: use `applySavedView` for that operation.

Saved-view UI is a React node passed to `savedViews`. It renders inside the provider, so it can use `useView()` to read current preferences and call `applySavedView`. It must obtain saved-view records and persist them through the application's data layer. CSV export similarly belongs in the `actions` slot.

`TableLabelsProvider` accepts a translation callback. `TableRuntimeProvider` accepts navigation and date-formatting adapters. Neither provider imports the application's router, GraphQL client or translation framework.

Flowstate's existing adapter preserves `flowstate:dataview:<viewId>`, shared-filter URL/session keys and `__dv_*` column IDs. Public terminology changes to tables; persisted identifiers do not change.

The [static API reference](https://flowstate-oss.github.io/klein-design-system/reference/table/view-types/) contains the full nested configuration types. Never create a second toolbar, property picker or filter state machine in a page.
