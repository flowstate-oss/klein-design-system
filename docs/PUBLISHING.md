# Releases and documentation

Repository: `flowstate-oss/klein-design-system`. Seven MIT packages use `@klein-ui`, coordinated versions and Flowstate copyright. The documentation workspace is private.

## Current state: CI configured, releases disabled

Build, type, contract, test, browser and packed-consumer checks remain enabled. Two repository variables control external releases:

- `ENABLE_NPM_PUBLISH=false`: package publishing is skipped.
  An unset variable also disables its release job. Do not enable `ENABLE_NPM_PUBLISH` or dispatch a package release until the user requests it.

## Documentation site

`docs.yml` deploys the Astro site to <https://flowstate-oss.github.io/klein-design-system/> on every relevant push to main. It is no longer gated by a variable (`ENABLE_DOCS_DEPLOY` is obsolete). The repository's Settings → Pages → Source must be set to **GitHub Actions** once.

## GitHub releases and notes

`release.yml` runs when `package.json` changes on main. If tag `v<version>` does not exist, it creates the tag and a GitHub Release whose notes come from `scripts/release-notes.mjs`. Prerelease versions (`-rc.1`) are marked as prereleases. It never publishes to npm.

Notes group [Conventional Commit](https://www.conventionalcommits.org/) subjects since the previous `v*` tag: `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `build`, `ci`, `chore`. `type!:` or a `BREAKING CHANGE:` footer lists a breaking change. Other subjects fall under "Other changes". Commit style is not enforced.

`node scripts/release-notes.mjs --bump` prints the recommended bump (major/minor/patch) to pass to `npm run release:version`. Preview notes locally with `node scripts/release-notes.mjs`.

## Future initial publication — GitHub Actions only

Never publish locally, including initial package creation. When a release is authorized, configure a suitably scoped npm publishing credential as the `NPM_TOKEN` secret in the GitHub `npm` environment if the packages do not yet have trusted publishers. The workflow passes this optional credential only to publish steps. No credentials belong in source control.

Enable `ENABLE_NPM_PUBLISH` and run `publish.yml` on main. It checks version changes, builds, types, tests, Astro, browser behavior and packed Vite/Next consumers before publishing public packages in dependency order. Already-published versions are skipped for safe retries.

After packages exist, configure npm trusted publishing for each: GitHub organization `flowstate-oss`, repository `klein-design-system`, workflow `publish.yml`, environment `npm`, with direct publishing allowed. Remove the bootstrap `NPM_TOKEN` secret after validating OIDC. See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).

## Subsequent releases

Run `npm run release:version -- 0.1.6` with the intended next version and commit the aligned manifests and lockfile with package changes. Do not reuse published versions.

Once publishing is explicitly enabled, changes to packages, build scripts, manifests or the publish workflow on main trigger the release pipeline. Pull requests never publish. Documentation deployment has a separate `ENABLE_DOCS_DEPLOY` gate and path-filtered workflow. Setting either variable alone does not dispatch a workflow.

The workflows do not commit version changes; only `release.yml` creates tags. Initial publication and trusted-publisher setup are intentionally deferred.
