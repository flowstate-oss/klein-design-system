> Historical planning record. Superseded by README.md and DECISIONS.md: Astro replaces Ladle; the npm scope is @klein-ui.

# Historical planning document

This records the initial plan. Current implementation status is in ../PLAN.md.

# Klein component library and adoption plan

Status: phased implementation underway. Updated 26 September 2026.

The first milestone is implemented in this repository. See README.md for shipped components and docs/VALIDATION.md for checks. Later data-view, chart, forecast and Eddy phases remain planned.

Target repository: `~/Code/klein-design-system`.
Source application: Flowstate `project-fabric`, fast-forwarded from `8b26cd2d4` to `09886eaf4` for this review.
Design reference: `~/Code/klein/readme.md`, `tokens/`, `components/`, and `guidelines/`.
Documentation choice: **Ladle with Vite**, per Will. No new Storybook installation.

## 1. Outcome and architecture

Create one versioned source for Klein tokens, React components, layout recipes, charts, forecast presentation, and Eddy presentation. Ship working components, a searchable documentation website, machine-readable usage contracts, and checks installed in consuming repositories. Instructions alone cannot prevent agents from duplicating UI; CI must reject the common forms of drift.

Use atomic design to order development and explain dependencies. Use purpose-based public imports so consumers do not have to decide whether something is a molecule or an organism.

```text
Flowstate data / permissions / routes / persistence / mutations
                         ↓
Application adapters → typed presentation models + callbacks
                         ↓
Klein templates → organisms → molecules → atoms → tokens
                         ↑
Ladle examples + fixtures + tests + generated usage catalogue
```

“Dumb” means independent of application services and business rules. Components may manage focus, hover, keyboard navigation, measurement and ephemeral interaction state. Persisted state, network activity and financial calculations belong to the application. Components with meaningful externally observable state offer a controlled interface.

## 2. Findings from the current branch

| Area           | Existing source                                                                                                                 | Extraction decision                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Foundations    | `src/app/globals.css`; Klein `tokens/*.css`                                                                                     | Consolidate into canonical tokens; app CSS becomes an integration layer.                                                                                                            |
| Buttons        | `src/components/ui/button.tsx`                                                                                                  | Consolidate duplicate variants (`default`/`primary-ink`, `outline`/`secondary`, `link`/`text`); replace visual overrides with an explicit contract.                                 |
| Layout         | `src/components/view/{ViewLayout,ViewSection,ViewControlPanel,ViewContext}.tsx`                                                 | Preserve the five established layouts and one-toolbar ordering; split controlled presentation from preference storage and app widgets.                                              |
| Navigation     | `navigation/area-shell/AreaShellFrame.tsx`, primary navigation, `ui/{tabs,floating-tabs,scrollable-tabs}.tsx`                   | Separate route navigation from local panels. Do not force them into one ambiguous tabs API.                                                                                         |
| Data views     | `data-view/{DataView,DataViewTable,useDataViewTable}.tsx`, cells and `view-controls/`                                           | Build the public data-view system from the presentational table and controls; do not adopt the deprecated all-in-one wrapper as the new architecture.                               |
| Charts         | `ui/chart-base.tsx`, `insights/DashboardChart.tsx`, report `ChartRenderer.tsx`, `lib/chart-{config,palette}.ts`                 | Retain Chart.js behind typed Klein renderers. Remove `any`, arbitrary options/plugins and application theme dependencies from the public contract.                                  |
| Custom visuals | `ai-terminal/AiSparkline.tsx`, `data-view/cells/`, `comparison/SkillBubbleChart.tsx`, `projects/ProjectGanttChart.tsx`          | Inventory individually. Extract rendering where useful; retain domain transformations in adapters. Gantt/org-chart engines are a later explicit scope, not ordinary chart variants. |
| Forecast       | `src/app/(authenticated)/plan/[planId]/finance/forecast/_components/CostForecastTable.tsx` and neighbouring cells/rows/hooks    | Separate the matrix renderer from queries, viewer permissions, entity drawers, budget scope and mutations before moving it.                                                         |
| Eddy           | `assistant/{ChatMessage,ChatInput,ChatConversation,ChatList,AssistantPanel,AssistantHost,ChartPreview}.tsx`; `ui/eddy-icon.tsx` | Extract composer, messages, history, panel and chart preview presentation. Keep transport, routing and dashboard creation in Flowstate.                                             |
| Catalogue      | `scripts/build-design-system-registry.ts`, `components/design-system/`                                                          | Useful inventory seed, not the public contract. Current extraction uses name/regex heuristics and import-name counts; verify canonical identity and API through TypeScript symbols. |
| Guardrails     | `scripts/check-klein-design-system.ts`, `.claude/rules/`                                                                        | Current checker mostly rejects styling patterns within a selected scope; it does not enforce canonical imports or prevent duplicate implementations.                                |
| Examples       | `.storybook/`, `src/stories/` and colocated stories                                                                             | Migrate useful fixtures and examples to Ladle. Remove app/provider dependencies instead of recreating an app runtime in the library.                                                |

This is a representative extraction audit, not a claim that every chart or component has been reviewed. Phase 0 produces the complete disposition manifest.

### Conflicts to resolve explicitly

Klein defines a white product ground, square corners, no shadows, custom square-stroke glyphs and a six-series palette. Flowstate also has dark mode, Lucide icons, legacy rounded styles, and a separate twelve-colour chart palette. `ChatMessage` still includes rounded styles, coloured glyphs and entrance animation; its error state is inferred from a text substring. These are migration issues, not patterns to carry over automatically.

Written instructions also disagree: the view-system rule deprecates `DataView` and older period controls, while other rules still recommend them; `CLAUDE.md` names an older visual system and test stack. New agent documentation must replace or redirect stale guidance in consumers.

Proposed default: Klein is authoritative for visual foundations; documented product extensions cover what the reference does not define. The reference explicitly lacks tabs, dialogs and data views, so these must be specified using real product behaviour. Existing dark-mode consumers need a compatibility decision before adoption; do not silently remove their theme support. Icon coverage needs an explicit approved migration inventory. These decisions do not block the library plan or light-theme foundation work.

## 3. Foundations and colour contract

Maintain primitive values once, semantic aliases for use, and component-level tokens only where needed. Generate namespaced CSS variables and a typed JavaScript token map from the same source. Renderers, including canvas charts, consume the same semantic values.

| Role                        | Klein source value                                               | Usage                                                                         |
| --------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Accent                      | `#002FA7` (Klein 600)                                            | Focus, links, accent action, focused chart series                             |
| Page / band / fill          | `#FFFFFF` / `#F6F7F9` / `#ECEEF2`                                | Page, structural bands, control fill                                          |
| Border / hairline           | `#D7DBE2` / `#ECEEF2`                                            | Boundaries and row separators                                                 |
| Primary / body / muted text | `#0B0D12` / `#4B505A` / `#8A8F9A`                                | Map by role; validate contrast at actual size and ground before use           |
| Good / watch / bad          | `#0F6B4F` / `#9A6B00` / `#A8102B`                                | Consequence, never inferred from a number’s sign                              |
| Selected                    | `#EEF2FC`                                                        | Selected surface                                                              |
| Chart series                | `#002FA7`, `#3E7CA6`, `#7E99DF`, `#0F6B4F`, `#9A6B00`, `#A8102B` | Stable series identity; focus uses series 01; inactive series use border tone |

Keep the full Klein 50–950 ramp, but do not expose arbitrary colour selection on every component. For more than six chart series, define grouping/focus/pattern behaviour instead of inventing hues. Labels and line styles must communicate meaning without colour alone.

Other foundations:

- Geist interface type; Geist Mono for measured values, dates and IDs. Keep logo outlines as assets; do not require the trial logo font at runtime.
- Preserve the source spacing increments: 2, 4, 5, 7, 10, 12, 16, 20, 22, 24, 26, 28, 34, 48, 56, 72px. Give geometry semantic names such as `field-gap`, `control-height-md`, `page-gutter`, not a newly invented 4px ladder.
- Controls: 32/40/48px; mobile targets at least 44px. Radius zero; 1px borders; no decorative shadows. Focus: 2px Klein outline with 2px offset.
- Functional colour/border transitions only, approximately 90–140ms; respect reduced motion. Define layer ordering centrally. Loading placeholders do not shimmer.

Product layout tokens are a documented extension: retain full-width app surfaces, 24px outer gutters where applicable, and the existing view-shell 16px internals. The reference’s 56px specimen gutter is not a command to pad every product page by 56px. The shell owns its gutters; consumers cannot double-wrap it.

## 4. Atomic development inventory

| Layer                | Initial public components and patterns                                                                                                                            | Contract                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Foundations          | Colour, type, spacing, borders, motion, focus, layering, approved icons, brand assets                                                                             | One generated token source                                                                              |
| Atoms                | `Button`, `IconButton`, `Link`, `Icon`, `Text`, `Heading`, `NumericValue`, `Input`, `Textarea`, `Checkbox`, `Radio`, `Switch`, `Separator`, `Skeleton`            | Native semantics, accessible states, closed visual variants                                             |
| Molecules            | `Field`, `Select`, `MultiSelect`, `SearchField`, `DateRangePicker`, `PeriodControl`, `StatusTag`, `Tooltip`, `Menu`, `Pagination`, numeric/status/sparkline cells | Reuse atoms; labels, validation and keyboard behaviour are built in                                     |
| Layout primitives    | `Stack`, `Inline`, `Grid`, `Divider`, `ScrollArea`, `SplitPane`                                                                                                   | Token-based spacing and explicit sizing; used inside approved templates, not to reconstruct page shells |
| Organisms            | `PageHeader`, `RouteTabs`, `Tabs`, `ViewControlPanel`, `ViewSection`, `DashboardBand`, data view, `Dialog`, `Drawer`, `EmptyState`, chart renderers               | Fixed slots, stable state/event contracts, no application data access                                   |
| Specialist organisms | `ForecastDataView`, `EddyComposer`, `EddyMessage`, `EddyConversation`, `EddyHistory`, `EddyPanel`, `EddyChartPreview`                                             | Typed view models; domain work supplied by consumers                                                    |
| Templates            | List/index, dashboard, report band + data view, tree/detail, entity detail, form, Eddy side panel/full page                                                       | Complete composition including header, navigation, controls, scrolling and responsive rules             |
| Pages                | Real Flowstate routes                                                                                                                                             | Remain in Flowstate; prove that the templates support production needs                                  |

The existing view variants `single`, `2:1`, `3:3`, `2:2`, `tree:detail` are the starting layout contract. Full-bleed dashboard bands and chart grids remain distinct documented recipes. Do not wrap all charts in decorative cards.

Route tabs render links supplied by the application, including active state and `aria-current`. Local tabs manage panels and keyboard selection. Drawer tabs use the approved local-tab presentation. The router and navigation registry stay in Flowstate.

## 5. Repository and distribution

Proposed npm workspace structure; package scope is provisional:

```text
klein-design-system/
  AGENTS.md
  README.md
  packages/
    tokens/                 # @klein-ui/tokens: source, generated CSS and typed values
    react/                  # @klein-ui/react: atoms, forms, layouts, views, data-view
    charts/                 # @klein-ui/charts: Chart.js adapters and custom renderers
    forecast/               # @klein-ui/forecast: period matrix and edit presentation
    eddy/                   # @klein-ui/eddy: chat presentation
    contracts/              # catalogue schema, generated docs, lint/check tooling
  apps/docs/                # Ladle/Vite, MDX guidance, search/catalogue page
  fixtures/                 # deterministic synthetic examples
  docs/decisions/           # extensions, API decisions, migration policy
  migrations/               # codemods and old-to-new mappings
```

Keep heavy chart/editor dependencies out of button imports. Use explicit public subpath exports, React as a peer dependency, emitted types, and compiled/scoped CSS that consumers can import without scanning library source with Tailwind. Verify bundling and client boundaries with a Vite consumer and a small Next consumer. No `@/` app aliases, Next router, Apollo, Prisma, app translations or app stores inside shipped presentation packages.

Begin with coordinated package versions and a changelog. CI verifies packed artifacts, not only workspace source aliases. Local integration can use packed prerelease tarballs; production consumers pin releases. Publish docs, catalogue, examples and packages from the same release revision. Use semver and adapters for breaking API changes. Registry/hosting choices can be made at repository setup; they do not change component boundaries.

## 6. Uniform API conventions

| Concern               | Convention                                                                                                                                                                                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Sizing                | `size="sm\|md\|lg"`; `density="comfortable\|compact"` only for repeated data surfaces. Icon-only is `IconButton`, not a fourth size.                                                                                                                                                             |
| Visual choice         | `variant` describes presentation; `tone` describes meaning. Each component declares legal combinations; do not add every tone to every control.                                                                                                                                                  |
| Buttons               | Start with `variant="primary\|secondary\|tertiary\|text"`, `tone="neutral\|accent\|danger"` where supported. Map every legacy value explicitly; primary neutral is ink, primary accent is Klein. Secondary uses the reference ink border. Validate destructive treatment as a product extension. |
| Native state          | Use `disabled`, `readOnly`, `required`, `checked`, `name`, `type`, `aria-*`; default button `type="button"`. Do not rename HTML attributes to `isDisabled`.                                                                                                                                      |
| Controlled values     | `value` / `onValueChange(next)`; `checked` / `onCheckedChange(next)`; `open` / `onOpenChange(next)`. Native `onChange(event)` stays a native event.                                                                                                                                              |
| Uncontrolled defaults | `defaultValue`, `defaultChecked`, `defaultOpen` only when supported; never switch control mode silently.                                                                                                                                                                                         |
| Collections           | `rows`, `columns`, stable `getRowId`; `items` for options/navigation; chart `series`. Semantic names take priority over calling everything `data`.                                                                                                                                               |
| View state            | `state` / `onStateChange(next)`; explicit server/client processing mode. Controlled state must not trigger hidden local filtering or pagination.                                                                                                                                                 |
| Async state           | Data organisms use `status="loading\|ready\|empty\|error"`; `refreshing` retains visible data. Buttons use `loading`; chat has its own typed streaming status.                                                                                                                                   |
| Callbacks             | `onRowActivate`, `onPointActivate`, `onCellEdit`, `onSubmit`, `onRetry`; named, typed object payloads for multi-field events. No router objects or mutation functions in props.                                                                                                                  |
| Content               | `children` for content; explicit slots such as `actions`, `leading`, `trailing`, `description`. Avoid prop synonyms.                                                                                                                                                                             |
| Accessibility         | Icon buttons require an accessible name; fields connect label/help/error IDs; pending state is announced appropriately.                                                                                                                                                                          |
| Formatting            | Explicit locale, currency and timezone or supplied formatters/labels. No assumption that Klein’s sterling examples mean all products use GBP.                                                                                                                                                    |

Do not expose arbitrary vendor options, `color: string`, full `style` overrides or unrestricted component replacement props. Provide named capabilities and token-based layout props. If `className` is retained for integration, define its permitted outer-layout use and enforce restrictions in consumers; do not advertise it as a restyling escape hatch.

Use discriminated unions for mutually exclusive modes and legal state combinations. API tests must exercise invalid combinations as well as expected imports. A `KleinProvider` may supply presentation-only defaults; no hidden application services.

## 7. Data views, charts and forecast boundaries

### Data views

“Data view” is the product and documentation term. Semantic HTML tables remain correct implementation details. Keep table-engine types internal where possible; expose a Klein column definition with typed value/cell rendering, alignment, sizing and supported capabilities.

Library owns row rendering, headers, keyboard interactions, grouping presentation, selection controls, empty/error/loading states, column sizing and optional virtualisation. Application owns saved-view CRUD, custom-attribute definitions, URL/local-storage persistence, row navigation, access checks and server queries. Preserve `flowstate:dataview:<viewId>` and the existing preference shape through an adapter or an explicit tested migration; extraction must not reset users’ saved views.

Distinguish selected IDs across pages, visible-row selection, and server-wide selection. Specify sticky header/pinned column behaviour, focus during virtualisation, horizontal overflow and density. Avoid moving the entire existing generic config object into the public API unchanged.

### Charts

Start with line, bar, stacked bar, area, doughnut, scatter and radar capabilities found in the application, plus custom sparkline and inline bars. Inventory every chart import and custom SVG/canvas renderer before deciding what to consolidate. Inspect burndown, forecast-vs-actual, budget pace, skill bubble and report rendering separately. Gantt/org charts receive their own dependency/accessibility review.

Define immutable presentation models: series IDs, labels, typed x-values, nullable y-values, units, partial/provisional markers and optional reference series. Missing is not zero. The application computes fiscal periods, aggregation, cumulative totals, forecasts, FX and semantic consequences. The renderer computes only drawing geometry and formatting.

Use one palette, legend, tooltip, axis format, empty/error state and partial-period convention. Preserve the existing dashed partial tail and reference-line behaviour. Events use stable series/point IDs rather than dataset indices as public identity. Expose no unrestricted Chart.js `options`/`plugins` bag: add typed features centrally when needed.

Every chart has a text summary or accessible data equivalent. Tooltips are not the only source of values. Test resize, flat/single/negative/missing series, huge ranges, partial intervals, no mutation of input, and keyboard access to interactive equivalents.

### Forecast data view

Extract a specialised `ForecastDataView`; do not force the forecast matrix into a generic list and lose period/header/expansion behaviour.

Proposed input model:

```ts
type ForecastCell = {
  rowId: string;
  periodId: string;
  metric: "cost" | "fte";
  displayValue: string;
  sortValue: number | null;
  deltaLabel?: string;
  consequence?: "good" | "watch" | "bad";
  editable: boolean;
  pending: boolean;
};

type ForecastEdit = {
  rowId: string;
  periodId: string;
  metric: "cost" | "fte";
  input: string;
};
```

The full contract also carries periods, hierarchical rows, child-load status, supplied totals, expanded IDs, status and callbacks. Decimal entry stays a string until validated by the application. Stable IDs replace display labels as keys. If a renderer needs numeric chart values, the adapter supplies them explicitly; the component does not recalculate money from display strings.

Move `useCostForecastData`, lazy child fetching, fiscal-window mapping, budget/proposal overlays, FTE averages, rounding, total/delta calculations, authorisation, optimistic updates and persistence into Flowstate adapters. The component emits expansion requests and edit intents; the adapter supplies loaded children, pending/error state and authoritative results. Test renderer behaviour independently and preserve existing financial regression tests at the adapter/service boundary.

### Eddy

Provide `EddyIcon`, composer, message content, processing steps, suggestions, history rows, conversation view, panel and chart-preview presentation. Use typed message roles and explicit message status (`queued`, `streaming`, `complete`, `error`, `cancelled`) rather than detecting error prose. Rich chart messages accept a prepared chart model, not an analytics query.

Library owns markdown presentation, safe supported content, code/data formatting, keyboard behaviour, sensible scroll anchoring and accessible streaming announcements. Do not replay incoming text through a decorative typewriter. Pause automatic scroll when the reader moves back through history.

Flowstate owns chat IDs/scope, subscriptions, polling/reconnect, tool execution, retries, cancellation, route changes, access checks, report creation and add-to-dashboard mutations. Callback visibility is not authorisation; the application/server still validates actions. Test streaming updates, failure/retry, long content, IME composition in the composer and chart messages without network access.

## 8. Ladle documentation website

Use a static Ladle site with MDX guidance and interactive stories. Ladle documents [MDX/Markdown support](https://ladle.dev/docs/mdx/) and [args/argTypes controls](https://ladle.dev/docs/controls/). Its [CSF compatibility is partial](https://ladle.dev/docs/addons/), so migrate existing stories deliberately rather than assuming Storybook configuration and addons work unchanged.

Navigation: Start here; Foundations; Components; Layouts and recipes; Data views; Charts; Forecast; Eddy; Migration; Agent instructions. Add a generated searchable catalogue with aliases such as “table” → data view, “header” → PageHeader, and use-case tags. Include full-page recipes at desktop, narrow and touch sizes.

Every stable component uses the same documentation template:

1. Purpose, canonical import, when to use it, and which related component to choose instead.
2. Minimal copyable example plus realistic composed examples, rendered from shared source files.
3. Generated props table: type, required/default, semantics, allowed combinations, controlled behaviour and callback payloads.
4. Variants and state matrix, keyboard/accessibility notes, responsive rules, data ownership, common mistakes and migration aliases.

Generate prop metadata from TypeScript/JSDoc and explicit component metadata; do not assume Ladle controls automatically provide a complete API reference. Complex render props and generics need curated examples. Typecheck every example. A shared `PropsTable` documentation component and a validation step keep docs and exported types aligned.

Stories run with deterministic synthetic fixtures, no application backend, current clock or random IDs. Use the same fixtures for interaction and visual tests. Documentation also ships as Markdown plus a versioned `components.json` catalogue so agents can retrieve guidance without rendering the website.

## 9. Agent contract and enforcement

The following is the proposed consumer instruction, delivered from the library and linked by each application's `AGENTS.md` and other agent entry points:

> Before creating UI, search the installed Klein catalogue by job and read the matching usage contract. Use its documented public import and recipe. Reuse first, compose second, extend the canonical component third. Do not introduce a second button, data view, tab strip, toolbar or page header. A missing capability requires a documented library extension with an example and tests. Keep data access and business calculations in the application. Run the Klein checks and the affected interaction tests before completing the change.

Each registry entry includes stable component ID, public export, package/version, atomic layer, purpose, search aliases, status (`experimental`, `stable`, `deprecated`), allowed variants, slots, required context, state/event contract, examples, replacement paths and forbidden alternatives. Generate types/imports; author usage intent. Do not generate another unreviewed catalogue of every JSX function and call it canonical.

Enforcement must run in both repositories:

| Check                    | Rejected change                                                                                                                                  | Approved boundary                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| Imports and dependencies | Raw Radix/chart/table engine imports; new legacy UI imports; deep internal imports                                                               | Library implementation and narrow migration adapters           |
| Application JSX          | New raw buttons, form controls or data tables; replacement tab/header patterns in migrated surfaces                                              | Registered component implementation; legitimate content markup |
| Styles                   | Raw colour literals, off-system spacing/geometry, decorative shadows/rounding, component internals restyled through selectors or utility classes | Token definitions and documented finite layout values          |
| Data separation          | Network calls, app/router/database imports, generated GraphQL types, app storage inside library                                                  | Flowstate adapters                                             |
| Component completeness   | Public export missing registry entry, docs, examples or required state coverage                                                                  | Experimental work cannot masquerade as stable                  |
| Composition              | Duplicate toolbar, wrong shell order, broken scrolling or missing accessible names                                                               | Template tests, accessibility checks and visual review         |

Implement syntax-aware TypeScript/JSX/CSS checks; extend the existing oxlint setup where practical and use a standalone checker where needed. Resolve aliased imports and re-exports. Avoid regex-only validation and whole-file exemptions. Rules should print the canonical replacement and documentation link.

Baseline existing violations by file/rule/fingerprint; prohibit new violations and require the baseline to shrink as surfaces migrate. Exceptions require a reason, owner, expiry and replacement issue; agents may not add an exception merely to make CI pass. Protect contracts/checks/baseline changes through code ownership and normal review.

No linter can prove that arbitrary JSX is not a newly invented header. Combine restricted building blocks, public API checks, approved templates, screenshot review and ownership. Do not promise that a longer prompt alone guarantees compliance.

## 10. Delivery sequence and exit criteria

| Phase                           | Work                                                                                                                                              | Done when                                                                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0. Inventory and decisions      | Complete source manifest with reuse/refactor/retain/deprecate dispositions; reconcile conflicting guidance; settle theme/icon extension direction | Every priority family has one canonical destination and an explicit adapter boundary                                                               |
| 1. Repository and foundations   | Workspace, tokens, scoped CSS, Ladle, catalogue schema, component template, first consumer checks                                                 | Button + Field + tokens render in Ladle and packed Vite/Next consumers; raw replacement button fails consumer CI                                   |
| 2. Layout and everyday controls | Buttons, fields, menus, tabs, period controls, headers, shells, bands and sections                                                                | One real list and one dashboard use approved recipes with identical toolbar/gutter behaviour; keyboard and viewport checks pass                    |
| 3. Data views                   | Table renderer, cells, selection/sort/group/filter controls; saved-state adapter                                                                  | Representative existing view retains saved preferences, bulk actions, row activation and server pagination                                         |
| 4. Charts                       | Typed Chart.js wrappers, custom sparkline/bar/bubble candidates, common palette and annotations                                                   | Representative report/Helm charts preserve values, missing-data semantics, partial tails and reference lines; engines absent from consumer imports |
| 5. Forecast                     | Split controller/model/renderer, hierarchical period matrix, edit presentation                                                                    | Cost/FTE totals and deltas unchanged; expansion/edit/pending/failure flows verified against existing fixtures and regression suites                |
| 6. Eddy                         | Presentation package, typed message blocks, composer/conversation/chart preview                                                                   | Streaming/error/retry/scroll behaviour verified in isolation and a real connected adapter                                                          |
| 7. Adoption and release         | Migrate by surface, replace compatibility exports, update agent entry points, publish matched docs/packages                                       | Migrated surfaces contain no competing implementations; release/consumer checks enforce the contract                                               |

The first useful milestone is **tokens + Button + Field + PageHeader + route/local tabs + one view template + Ladle + consumer checks**. It proves reuse and enforcement before undertaking the forecast extraction. Layouts are early work, not a final polish phase.

For each adoption slice: capture present behaviour; extract and test the renderer; add an app adapter/compatibility export; migrate representative consumers; run targeted behaviour and visual checks; remove the old implementation only when its remaining usages are accounted for. Publish a release before broad consumer migration. Pinning the prior package release provides a rollback path.

## 11. Validation and remaining decisions

Required release gates: strict typecheck and type-level API examples; dependency-boundary checks; token/catalogue/doc consistency; component interaction tests; accessibility checks plus manual keyboard review for complex surfaces; deterministic browser screenshots; static Ladle build; packed-package smoke tests and import/bundle isolation. Test domain calculations in Flowstate, not by duplicating them in the component library.

Measure success by the number of competing implementations removed, proportion of migrated surfaces passing consumer checks, and ability to implement a new list/dashboard without new styling or primitives. Measure render/scroll performance on an agreed representative large data set before replacing the forecast/data-view implementation; record the existing baseline first.

Open decisions before implementation: theme/icon policy; final package scope and package registry; docs hosting; named maintainers for component contracts. Proposed defaults are Klein-first visual foundations with explicit product extensions, coordinated versions, static documentation hosting and application-owned data adapters. Ladle is confirmed. No time estimate is asserted until the complete extraction inventory is available.

This document records the phased plan. The local repository and first-milestone documentation website now exist; packages are not published and application routes are not migrated.
