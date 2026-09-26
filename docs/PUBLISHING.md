# Releases and documentation

Repository: `flowstate-oss/klein-design-system`. Seven MIT packages use `@klein-ui`, coordinated versions and Flowstate copyright. The documentation workspace is private.

## Current state: CI configured, releases disabled

Build, type, contract, test, browser and packed-consumer checks remain enabled. Two repository variables control external releases:

- `ENABLE_NPM_PUBLISH=false`: package publishing is skipped.
- `ENABLE_DOCS_DEPLOY=false`: the Astro site builds as an artifact; Pages deployment is skipped.

An unset variable also disables its release job. Do not enable either variable or dispatch a release until the user requests it. The previously deployed documentation remains available; disabling future deployments does not remove that site.

## Future initial publication — GitHub Actions only

Never publish locally, including initial package creation. When a release is authorized, configure a suitably scoped npm publishing credential as the `NPM_TOKEN` secret in the GitHub `npm` environment if the packages do not yet have trusted publishers. The workflow passes this optional credential only to publish steps. No credentials belong in source control.

Enable `ENABLE_NPM_PUBLISH` and run `publish.yml` on main. It checks version changes, builds, types, tests, Astro, browser behavior and packed Vite/Next consumers before publishing public packages in dependency order. Already-published versions are skipped for safe retries.

After packages exist, configure npm trusted publishing for each: GitHub organization `flowstate-oss`, repository `klein-design-system`, workflow `publish.yml`, environment `npm`, with direct publishing allowed. Remove the bootstrap `NPM_TOKEN` secret after validating OIDC. See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).

## Subsequent releases

Run `npm run release:version -- 0.1.6` with the intended next version and commit the aligned manifests and lockfile with package changes. Do not reuse published versions.

Once publishing is explicitly enabled, changes to packages, build scripts, manifests or the publish workflow on main trigger the release pipeline. Pull requests never publish. Documentation deployment has a separate `ENABLE_DOCS_DEPLOY` gate and path-filtered workflow. Setting either variable alone does not dispatch a workflow.

The workflows do not commit version changes or create release tags. Initial publication and trusted-publisher setup are intentionally deferred.
