# alcarcis.com

[![Quality gate](https://github.com/alcarcis/alcarcis.com/actions/workflows/quality-gate.yml/badge.svg)](https://github.com/alcarcis/alcarcis.com/actions/workflows/quality-gate.yml)

The source of Carlos Alcalá's personal site, in English (`/`) and Spanish (`/es/`), built to be served at alcarcis.com. It is a static [Astro](https://astro.build) site written in TypeScript, and it ships with its own quality gate: static checks, end-to-end and accessibility tests, and Lighthouse budgets that every pull request must pass.

## Run it locally

You need:

- Node.js 26 (`.nvmrc`; `engines` in `package.json` requires 26 or later)
- pnpm 12.22.0 (`packageManager` in `package.json`)
- Network access the first time you run the site (see [Fonts](#fonts-are-downloaded-not-committed))

```sh
pnpm install
pnpm dev        # Astro dev server
```

To try the production build:

```sh
pnpm build      # writes the static site to dist/
pnpm preview    # serves dist/
```

### Fonts are downloaded, not committed

`pnpm dev`, `pnpm build` and `pnpm preview` first run `pnpm fonts`. It downloads Chillax and General Sans from Fontshare and checks each file against a pinned SHA-256. Once a file matches its pin, later runs make no network request.

Why: their licence, the ITF Free Font License 2.0, allows a site to self-host the fonts but forbids distributing them through a public repository. So the font files stay out of git and the build fetches them. [`src/assets/fonts/README.md`](src/assets/fonts/README.md) covers the pins and how to update them.

## The quality gate

The `Quality gate` workflow (`.github/workflows/quality-gate.yml`) runs:

- on every pull request,
- on every push to `main`,
- on demand, from the Actions tab (`workflow_dispatch`).

A new push to the same branch cancels the run still in progress for it.

It has four jobs. The first three run in parallel; the last one collects their results.

| Job                                | What it runs                                                                   | What it catches                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Static checks                      | `pnpm format:check`, `pnpm lint`, `pnpm check`, `pnpm test:unit`               | Unformatted files, lint and type errors, broken scripts and site logic |
| End-to-end and accessibility tests | `pnpm test:e2e` in Chromium, then uploads the Playwright report                | Pages that render or behave wrongly, accessibility violations         |
| Lighthouse budgets                 | `pnpm build`, then `pnpm test:lighthouse`, then uploads the Lighthouse reports | A page that gets slower, less accessible or worse for search engines  |
| Quality gate                       | Nothing of its own: it passes only when the three jobs above all succeed       | Any of the above, in one check                                        |

Branch protection on `main` requires the `Quality gate` check, so that one check stands for the whole pipeline. The job runs even when a job before it fails, and it fails unless every one of them reports `success`; a skipped or cancelled job counts as a failure.

### What each job enforces

**Static checks.** Four fast checks on the source, with no browser:

- `pnpm format:check`: every file matches Prettier's formatting.
- `pnpm lint`: ESLint finds no errors.
- `pnpm check`: `astro check` finds no type errors in the TypeScript and Astro files.
- `pnpm test:unit`: the unit tests in `tests/unit/` pass, run with Node's built-in test runner. They cover the build scripts (fonts, build info, the Lighthouse budget, keeping the live link checks out of the gate) and the logic in `src/lib/` and `src/scripts/`.

**End-to-end and accessibility tests.** `pnpm test:e2e` builds the site, serves it with `astro preview` and runs the Playwright specs in `tests/e2e/` against both pages in desktop Chromium. The specs cover each section of the page, the header and footer, the language switch, the colour theme, SEO tags, the favicon, external links, typography and console errors.

The accessibility specs (`tests/e2e/a11y.spec.ts`) use axe, an engine that checks a rendered page against accessibility rules:

- Zero WCAG 2.0 and 2.1 level A and AA violations on `/` and `/es/`, in both the light and the dark colour scheme.
- The same for the sections nav, both inline on a wide screen and as the open menu on a phone.
- The colour-contrast rule must decide on the text of every section below the hero and on every nav link. axe silently passes text it cannot judge, such as text over a gradient, so the tests fail if any is left undecided.

In CI, Playwright is stricter than on your machine (`playwright.config.ts`): it uses one worker, retries a failed test up to two times to record a trace, and still fails the run if a test passed only on a retry. A `test.only` left in a spec also fails the run.

**Lighthouse budgets.** Lighthouse is Google's page audit. It scores four categories from 0 to 1: performance (how fast the page loads and responds), accessibility, best practices (security and modern-browser hygiene) and SEO (what search engines need). `pnpm test:lighthouse` runs Lighthouse CI (`lhci autorun`) on the built `dist/` folder:

- Pages: `/` and `/es/`.
- Runs: three per page; the median run counts.
- Budget: each of the four categories scores at least 0.95, with Lighthouse's default mobile emulation.

The minimum lives in `scripts/quality-budget.ts`; `lighthouserc.cjs` asserts it and the page displays the same value.

### Reading a failure

Open the failed run from the pull request's checks or from the Actions tab. The `Quality gate` job's log lists each job with its result, so you can see which one to open.

The two test jobs upload their reports as artifacts, even when they fail. They are listed on the run's summary page and kept for 14 days:

| Artifact             | Job                                | Contents                                                                         |
| -------------------- | ---------------------------------- | -------------------------------------------------------------------------------- |
| `playwright-report`  | End-to-end and accessibility tests | Playwright's HTML report, with a trace for each test that failed and was retried |
| `lighthouse-reports` | Lighthouse budgets                 | The `.lighthouseci/` folder: the results of each run and the saved reports       |

To browse a downloaded Playwright report, unzip it into `playwright-report/` and run `pnpm exec playwright show-report`. An axe failure lists each violated rule, its help link and the elements it found.

### Run the gate locally

```sh
pnpm exec playwright install chromium   # once
pnpm verify
```

`pnpm verify` runs the CI checks in order: formatting, lint, type check, unit tests, build, end-to-end tests, Lighthouse.

To reproduce one job:

| Job                                | Command                                                                       |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| Static checks                      | `pnpm format:check && pnpm lint && pnpm check && pnpm test:unit`              |
| End-to-end and accessibility tests | `pnpm test:e2e`, or `CI=1 pnpm test:e2e` to use the CI retries and one worker |
| Lighthouse budgets                 | `pnpm build && pnpm test:lighthouse`                                          |

Outside CI, Playwright reuses any server already listening on port 4321 instead of building and starting its own preview. Stop `pnpm dev` first so the tests run against the production build.

| Script                 | What it does                                               |
| ---------------------- | ---------------------------------------------------------- |
| `pnpm format:check`    | Checks formatting with Prettier (`pnpm format` fixes it)   |
| `pnpm lint`            | Runs ESLint                                                |
| `pnpm check`           | Type-checks the project with `astro check`                 |
| `pnpm test:unit`       | Runs the unit tests with Node's built-in test runner       |
| `pnpm test:e2e`        | Builds, previews and runs the Playwright tests in Chromium |
| `pnpm test:e2e:ui`     | Opens the same tests in Playwright's UI mode               |
| `pnpm test:lighthouse` | Runs Lighthouse CI on `dist/` (run `pnpm build` first)     |
| `pnpm test:live`       | Checks that the site's GitHub links answer with HTTP 200   |
| `pnpm fonts`           | Downloads and verifies the pinned fonts                    |

### What is not in the gate

The gate tests only this repository, so an outage on another site cannot block a merge. Whether the site's GitHub links still answer with HTTP 200 is checked by the separate `Live link check` workflow (`.github/workflows/live-links.yml`):

- **What it runs:** `pnpm test:live`, the request-only specs in `tests/live/` with `playwright.live.config.ts`. No browser, no server.
- **When:** daily, and on demand. Never on pull requests or pushes.
- **Retries:** up to two per link; a link that answers on a retry counts as up.
- **On failure:** it opens a `Live link check failed` issue listing the failed links, or comments on that issue if it is already open. It never blocks a merge.

## Project layout

```text
src/
  pages/          index.astro (English) and es/index.astro (Spanish)
  components/     the page's sections as Astro components
  layouts/        the base HTML layout
  i18n/           UI strings for both languages
  lib/            logic shared by the components
  scripts/        browser scripts: theme toggle, glyph scene, test-run animation
  styles/         design tokens and base CSS
  assets/         fonts, icons and the profile photo
scripts/
  fetch-fonts.ts, fonts/        download and verify the pinned fonts
  build-info.ts, build-info/    read the build's facts (CI variables, git, test count)
  quality-budget.ts             the Lighthouse minimum score
tests/
  e2e/
    *.spec.ts     the end-to-end and accessibility specs
    pages/        page objects
    components/   component objects
    fixtures.ts   Playwright fixtures the specs receive, such as the page object
    data/         data tables the specs loop over (locales, colour schemes, ...)
    support/      helpers such as the axe scanner and console capture
  unit/           unit tests for scripts/, src/lib/ and src/scripts/
```

## Font licences

- **Geist Mono:** SIL Open Font License 1.1. A subset is committed in `src/assets/fonts/geist-mono/` with its `OFL.txt`.
- **Chillax and General Sans:** ITF Free Font License 2.0. Their `FFL.txt` files are committed; the fonts themselves are downloaded at build time.
