# Releases and documentation

Repository: `flowstate-oss/klein-design-system`. All seven packages are public under `@klein-ui`, versioned together, copyright Flowstate, MIT licensed. The documentation workspace is private.

## One-time setup

1. Create the seven public npm packages (tokens, react, table, charts, forecast, eddy, contracts). The initial publication requires an authorized maintainer's npm login. Build and check locally, then publish in that dependency order with `npm publish --workspace @klein-ui/NAME --access public`. No credentials belong in this repository.
2. In each package's npm Trusted Publisher settings choose GitHub Actions: organization `flowstate-oss`, repository `klein-design-system`, workflow `publish.yml`, environment `npm`. Allow direct `npm publish` (not only staged publishing).
3. Create the GitHub `npm` environment. Configure GitHub Pages to use GitHub Actions. The docs workflow supports both the repository base path and a custom domain through configure-pages.

Trusted publishing uses OIDC (`id-token: write`) on GitHub-hosted runners, Node 24 and npm 11. No permanent npm secret is needed after initial package setup. See [npm's trusted publishing instructions](https://docs.npmjs.com/trusted-publishers/).

## Every release

Run `npm run release:version -- 0.1.5` with the intended new version, and commit the resulting manifests and lockfile with package changes. Keep all package versions aligned. Never reuse a published version for changed code.

On main, package/build/manifest changes trigger publish.yml. It runs generation consistency, build, types, tests, dependency boundaries, Astro build, browser tests and packed Vite/Next consumer tests before publishing. Packages publish in dependency order. Already-published versions are skipped, allowing a partially failed release to be retried with workflow_dispatch. CI checks that package changes include a version change. Documentation-only changes deploy the site without publishing npm packages.

The workflow does not commit version changes, create tags or publish from pull requests. A main-branch push is the release action. Package publication is immutable; fix a bad release with a new version.

GitHub Pages and the `npm` GitHub environment are configured. The live site is https://flowstate-oss.github.io/klein-design-system/. Initial npm package creation and trusted-publisher registration remain pending maintainer authentication; the hosted publish attempt returned E404 on the first package.
