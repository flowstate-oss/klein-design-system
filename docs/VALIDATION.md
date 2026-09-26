# Validation — 26 September 2026

The Astro / complete-table extraction was checked locally against Flowstate's `project-fabric` branch.

| Check | Result |
| --- | --- |
| Generated tokens, catalogue, props and migration reference | Match source |
| Package build and TypeScript | Pass |
| Standalone copyable examples | 50 independently typechecked |
| Astro type checking | 0 errors; informational hints remain in migrated source |
| Library behaviour tests | 31 pass |
| Browser checks | 15 pass: static docs without JavaScript, keyboard tabs, accessibility, search, full table filters/sort/properties, charts, Eddy, forecast and mobile page layouts |
| Static Astro site | 206 pages built |
| GitHub Pages repository base | `/klein-design-system` build verified; all 59 root-page internal links use the prefix |
| Packed consumer smoke | Vite and Next production consumers; every tarball includes MIT LICENSE and README |
| Flowstate regression selection | 790 tests pass across 89 files |
| Flowstate adoption guard | 5,095 existing occurrences; no new violations |
| Flowstate CI TypeScript | Existing 356 errors remain; no new diagnostics versus the pre-change baseline |
| Workflows | YAML parses; manifests verify seven aligned public MIT packages |

The complete table collection and provider tests cover application persistence callbacks, presentation-only column sizing, locked filters, shared filters and newly configured columns. Flowstate table/view tests also cover restored saved preferences, default views, grouping, selection, exports and navigation.

The npm scope is `@klein-ui`. Flowstate uses refreshed local tarballs so installs do not depend on a sibling checkout. The library inventory records 150 directly migrated consumer modules. Feature queries, mutations, permissions, routing and business calculations remain in Flowstate.

The remote is configured as `git@github.com:flowstate-oss/klein-design-system.git`. No npm package or site was published during this local validation, and the workflows have not run on GitHub. Initial npm package creation/trusted-publisher registration and GitHub Pages enablement are described in PUBLISHING.md. Existing unrelated Flowstate type errors prevent claiming a fully green application type check.
