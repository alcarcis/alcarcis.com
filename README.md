# alcarcis.com

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

The `Quality gate` workflow (`.github/workflows/quality-gate.yml`) runs on every pull request, on every push to `main`, and on demand.

| Job                                | What it runs                                                       |
| ---------------------------------- | ------------------------------------------------------------------ |
| Static checks                      | `pnpm format:check`, `pnpm lint`, `pnpm check`, `pnpm test:unit`   |
| End-to-end and accessibility tests | `pnpm test:e2e` in Chromium, then uploads the Playwright report    |
| Lighthouse budgets                 | `pnpm build`, then `pnpm test:lighthouse`, then uploads the report |
| Quality gate                       | Passes only when the three jobs above all succeed                  |

Branch protection on `main` requires the `Quality gate` check, so that one check stands for the whole pipeline.

The gate tests only this repository. Whether the site's GitHub links still answer with HTTP 200 is checked by the separate `Live link check` workflow (`.github/workflows/live-links.yml`), daily and on demand; a failure opens or updates a `Live link check failed` issue and never blocks a merge.

### What it enforces

- **Lighthouse:** performance, accessibility, best practices and SEO each score at least 0.95 on `/` and `/es/`, taking the median of three runs, with Lighthouse's default mobile emulation. The minimum lives in `scripts/quality-budget.ts`; `lighthouserc.cjs` asserts it and the page displays the same value.
- **Accessibility:** axe reports zero WCAG 2.0 and 2.1 level A and AA violations on both pages, in both the light and the dark colour scheme.

### Run the gate locally

```sh
pnpm exec playwright install chromium   # once
pnpm verify
```

`pnpm verify` runs the CI checks in order: formatting, lint, type check, unit tests, build, end-to-end tests, Lighthouse.

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
