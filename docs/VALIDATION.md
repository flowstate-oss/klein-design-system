# Validation — 26 September 2026

The Astro / complete-table extraction was checked locally against Flowstate's `project-fabric` branch.

| Check | Result |
| --- | --- |
| Generated tokens, catalogue, props and migration reference | Match source |
| Package build and TypeScript | Pass |
| Standalone copyable examples | 70 independently typechecked |
| Astro type checking | 0 errors; informational hints remain in migrated source |
| Library behaviour tests | 63 pass |
| Browser checks | 21 pass: static docs without JavaScript, keyboard tabs, accessibility, search, full table filters/sort/properties, charts, Eddy, forecast and mobile page layouts |
| Static Astro site | 235 pages built |
| GitHub Pages repository base | `/klein-design-system` build verified; internal documentation links use the prefix |
| Packed consumer smoke | Vite and Next production consumers; every tarball includes MIT LICENSE and README |
| Flowstate regression selection | 790 tests pass across 89 files |
| Flowstate adoption guard | 5,025 existing occurrences; no new violations |
| Flowstate CI TypeScript | Existing 356 errors remain; no new diagnostics versus the pre-change baseline |
| Workflows | YAML parses; manifests verify seven aligned public MIT packages |

The complete table collection and provider tests cover application persistence callbacks, presentation-only column sizing, locked filters, shared filters and newly configured columns. Flowstate table/view tests also cover restored saved preferences, default views, grouping, selection, exports and navigation.

The npm scope is `@klein-ui`. Flowstate uses refreshed local tarballs so installs do not depend on a sibling checkout. The library inventory records 201 directly migrated consumer modules. Feature queries, mutations, permissions, routing and business calculations remain in Flowstate.

The library is pushed to `flowstate-oss/klein-design-system` and the Astro site is live at https://flowstate-oss.github.io/klein-design-system/. GitHub contracts and Pages workflows passed at commit `eb1e3c0`; the next extraction is validated locally above. The npm workflow passed verification but failed initial publication with E404 because initial package authorization/trusted publishers are not yet configured. No npm packages have been published.

The current layout/organism batch also passes 54 focused application regressions across 9 files (forecast and area navigation), in addition to the earlier broad regression selection. Application CI TypeScript still has the same 356 existing diagnostics, with no new errors. Existing unrelated errors prevent claiming a fully green application type check.

The chart batch passes 84 targeted application regressions after updating Chart.js test mocks to the library boundary (79 initially passed; 5 canvas-mock failures corrected and the affected 45-test selection rerun successfully). The headcount bridge tests continue to verify cost permissions, settled rosters, aligned secondary values, RGB alpha handling and dates west of UTC. The library tests verify stable plot/keyboard identities, target exclusion from stacks and accessible share explanations.

The 0.1.4 batch passes 190 route-chart regression tests (189 initially passed; the headcount test boundary was corrected and all 22 tests in that file passed), 44 visual/property/table regressions (a duplicate accessible legend value required a scoped assertion update), and 39 Eddy/explorer regressions. The 21 browser checks additionally cover interval bounds and secondary units, diagram keyboard navigation, Eddy submission and reduced motion. Pan/zoom arithmetic includes 19 independent geometric tests.

No route or shared component imports the legacy chart-base renderer directly. Hierarchy-card and remaining forecast-cell presentation are still being audited; business calculations and data integrations deliberately remain application-owned.
