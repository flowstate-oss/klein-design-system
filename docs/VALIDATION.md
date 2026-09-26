# Validation — 26 September 2026

The Astro / complete-table extraction was checked locally against Flowstate's `project-fabric` branch.

| Check | Result |
| --- | --- |
| Generated tokens, catalogue, props and migration reference | Match source |
| Package build and TypeScript | Pass |
| Standalone copyable examples | 79 independently typechecked |
| Astro type checking | 0 errors; informational hints remain in migrated source |
| Library behaviour tests | 76 pass |
| Browser checks | 22 pass: static docs without JavaScript, keyboard tabs, accessibility, search, full table filters/sort/properties, charts, Eddy, forecast and mobile page layouts |
| Static Astro site | 246 pages built |
| GitHub Pages repository base | `/klein-design-system` build verified; internal documentation links use the prefix |
| Packed consumer smoke | Vite and Next production consumers; every tarball includes MIT LICENSE and README |
| Flowstate regression selection | 790 tests pass across 89 files |
| Flowstate adoption guard | 4,821 existing occurrences; no new violations |
| Flowstate CI TypeScript | Existing 356 errors remain; no new diagnostics versus the pre-change baseline |
| Workflows | YAML parses; manifests verify seven aligned public MIT packages |

The complete table collection and provider tests cover application persistence callbacks, presentation-only column sizing, locked filters, shared filters and newly configured columns. Flowstate table/view tests also cover restored saved preferences, default views, grouping, selection, exports and navigation.

The npm scope is `@klein-ui`. Flowstate uses refreshed local tarballs so installs do not depend on a sibling checkout. The library inventory records 255 directly migrated consumer modules. Feature queries, mutations, permissions, routing and business calculations remain in Flowstate.

The library is pushed to `flowstate-oss/klein-design-system` and the Astro site is live at https://flowstate-oss.github.io/klein-design-system/. GitHub contracts and Pages workflows passed at commit `eb1e3c0`; the next extraction is validated locally above. The npm workflow passed verification but failed initial publication with E404 because initial package authorization/trusted publishers are not yet configured. No npm packages have been published.

The current layout/organism batch also passes 54 focused application regressions across 9 files (forecast and area navigation), in addition to the earlier broad regression selection. Application CI TypeScript still has the same 356 existing diagnostics, with no new errors. Existing unrelated errors prevent claiming a fully green application type check.

The chart batch passes 84 targeted application regressions after updating Chart.js test mocks to the library boundary (79 initially passed; 5 canvas-mock failures corrected and the affected 45-test selection rerun successfully). The headcount bridge tests continue to verify cost permissions, settled rosters, aligned secondary values, RGB alpha handling and dates west of UTC. The library tests verify stable plot/keyboard identities, target exclusion from stacks and accessible share explanations.

The 0.1.4 batch passes 190 route-chart regression tests (189 initially passed; the headcount test boundary was corrected and all 22 tests in that file passed), 44 visual/property/table regressions (a duplicate accessible legend value required a scoped assertion update), and 39 Eddy/explorer regressions. The 21 browser checks additionally cover interval bounds and secondary units, diagram keyboard navigation, Eddy submission and reduced motion. Pan/zoom arithmetic includes 19 independent geometric tests.

No route or shared component imports the legacy chart-base renderer directly. Hierarchy cards, schedule ranges, review sequences, ranked and segmented bars, progress variants and forecast-cell presentation now use canonical renderers. The renderer ownership audit records retained product illustrations, brand assets, rich-text integrations and application composition.

The 0.1.5 batch passes 76 library tests across 13 files and 22 browser checks. The app audit selection passed 353 of 354 tests initially; its remaining budget assertion was updated to verify the real Radix progress value, and all 42 budget tests passed. The final affected selection passed 105 tests across 11 files, including hierarchy schedule interactions, budget meters, first import progress, provider ranking and allocation summaries. Earlier selections for this batch include 82 hierarchy/explorer tests, 78 progress/allocation/adoption tests (the remaining mocked-progress test was corrected), and 24 identity/cell/budget tests. These overlap; their counts must not be added into a single total. Final application TypeScript still reports the same 356 baseline errors with zero new normalized diagnostics.
