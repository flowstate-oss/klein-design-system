# Klein

The shared component library for Flowstate: tokens, controls, tables, layouts, charts, forecast and Eddy. Astro provides a searchable website with runnable examples, generated props and agent instructions.

## Run

Requires Node 22.14+ and npm 10+. CI uses Node 24; publishing uses npm 11.

```sh
npm ci
npm run build
npm run dev
```

Open the URL printed by Astro (normally http://localhost:4321). The static site contains foundations, searchable component pages, generated props, implementation rules, full page-layout recipes and an interactive chart option gallery. Documentation remains readable without JavaScript; React islands run the actual package examples.

## Packages

| Package | Owns |
| --- | --- |
| `@klein-ui/tokens` | Klein primitive and semantic tokens, CSS variables and typed JS values |
| `@klein-ui/react` | Controls, headers, route/local tabs, layouts, bands and shell renderers |
| `@klein-ui/table` | Complete TableCollection (formerly DataView), state/shared-filter providers, toolbar, table/board/timeline bodies, selection, sizing and AG Grid boundary |
| `@klein-ui/charts` | Closed Chart API, Chart.js/report renderers, partial periods, reference lines, sparklines, bubble, Gantt, timeline, waterfall, share breakdown and burndown |
| `@klein-ui/forecast` | Period matrix, pinned labels/totals, rows/cells, variance and allocation editor |
| `@klein-ui/eddy` | Composer, messages, conversation scrolling, history, panel, persistent rail, chart preview and icon |
| `@klein-ui/contracts` | Usage contracts, generated props, migration reference, source inventory and consumer checker |

All versions are experimental `0.1.4`. Packages are built locally and consumed by Flowstate as committed tarballs. The remote is `git@github.com:flowstate-oss/klein-design-system.git`. GitHub workflows validate changes, deploy the static site and publish new package versions on main. The documentation is live at https://flowstate-oss.github.io/klein-design-system/. Initial npm publication is awaiting maintainer authentication. See [publishing setup](docs/PUBLISHING.md).

## Consume

Flowstate runs `npm run sync:klein` to build and pack the sibling repository into `vendor/klein`, then updates its lockfile. Production installs use `npm ci` and do not require the sibling checkout.

```tsx
import '@klein-ui/react/styles.css';
import '@klein-ui/forecast/styles.css'; // When using forecast components
import '@klein-ui/eddy/styles.css'; // When using Eddy
import {Button, Field, EdgeToEdgeLayout, DashboardBand} from '@klein-ui/react';
import {TableCollection} from '@klein-ui/table';
import '@klein-ui/table/styles.css';
```

CSS is compiled; consumers do not need a Tailwind scan of library source. Load Geist and Geist Mono in the application. The docs self-host the font files. Flowstate's dark mode is preserved through the optional `@klein-ui/react/dark.css` product extension.

New work uses the main catalogue's closed APIs. `/compat` exports retain existing caller contracts, including legacy styling props, while putting their implementation in this repository. They are migration APIs, not new authoring APIs. Their props and exports are searchable in the migration reference. Extend a closed API here when needed; do not fork a component in a consumer.

Tables are called **Table**, replacing DataView. Existing saved-view keys and column IDs remain stable. Data loading, business calculations, permissions, routing, localization and persistence stay in application adapters. Components receive values and emit typed actions; they own rendering and presentation interaction.

## Verify

```sh
npm run check
npm run build:docs
npx playwright install chromium
npm run test:browser
npm run smoke:pack
```

The checks cover generated artifacts, package builds, types, behavior, application-dependency boundaries, browser interaction/accessibility/layout and packed Vite/Next consumers. See [validation](docs/VALIDATION.md) for the actual run results and limitations.

Link the installed `@klein-ui/contracts/AGENTS.md` from application agent entry points. Flowstate runs a fingerprinted adoption check in CI: existing page/adaptor violations are recorded, and new occurrences fail. Instructions and syntax checks help prevent drift; they cannot prove that every arbitrary layout is canonical.

Read [AGENTS.md](AGENTS.md), [design decisions](docs/DECISIONS.md), [migration status](PLAN.md) and [the source inventory](docs/migration-inventory.json) before changing ownership or APIs.

Copyright © 2026 Flowstate. [MIT licence](LICENSE).
