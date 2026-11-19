// HTML for the share images and the touch icon. Playwright screenshots these pages, so the
// images use the site's own brand palette and self-hosted fonts.

/** Brand palette, as `src/styles/tokens.css` defines it. */
const brand = {
  graphite: "#141414",
  line: "#2e2a27",
  copper: "#c8875a",
  ivory: "#f4efe9",
  muted: "#a79f97",
  passGreen: "#6fd18c",
} as const;

export interface FontSources {
  /** Chillax, the display face, as a data URL. */
  readonly display: string;
  /** Geist Mono, the terminal face, as a data URL. */
  readonly mono: string;
}

export interface ShareCard {
  readonly lang: string;
  readonly name: string;
  readonly tagline: string;
  readonly stages: readonly string[];
  readonly domain: string;
  /** The favicon's SVG: the CA monogram in copper on graphite. */
  readonly monogram: string;
  readonly width: number;
  readonly height: number;
}

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const fontFaces = (fonts: FontSources): string => `
  @font-face {
    font-family: "Chillax";
    src: url("${fonts.display}") format("woff2");
    font-weight: 200 700;
  }
  @font-face {
    font-family: "Geist Mono";
    src: url("${fonts.mono}") format("woff2");
    font-weight: 100 900;
  }`;

/** The instrument's pass check (src/components/Instrument.astro). */
const check = `<svg class="check" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true"><path d="M4 9.5l3.2 3L14 5.5"/></svg>`;

/** The banner style: graphite ground, the copper monogram, the name, the display line, a passing run. */
export function shareCardHtml(card: ShareCard, fonts: FontSources): string {
  const stages = card.stages
    .map((stage) => `<li>${check}<span>${escapeHtml(stage)}</span></li>`)
    .join("");
  return `<!doctype html>
<html lang="${escapeHtml(card.lang)}">
<head>
<meta charset="utf-8">
<style>
  ${fontFaces(fonts)}
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${card.width}px; height: ${card.height}px; }
  body {
    background: ${brand.graphite};
    color: ${brand.ivory};
    font-family: "Chillax", sans-serif;
    padding: 64px 72px 56px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    border-block-start: 8px solid ${brand.copper};
  }
  header { display: flex; align-items: center; justify-content: space-between; }
  .mark {
    width: 88px; height: 88px;
    border-radius: 17px;
    outline: 2px solid ${brand.line};
  }
  .mark svg { display: block; width: 100%; height: 100%; }
  .domain, .run { font-family: "Geist Mono", monospace; }
  .domain { font-size: 26px; font-weight: 500; color: ${brand.muted}; }
  h1 {
    font-size: 124px; font-weight: 600;
    line-height: 0.98; letter-spacing: -0.03em;
  }
  .tagline {
    margin-block-start: 20px;
    font-size: 58px; font-weight: 500;
    line-height: 1.1; letter-spacing: -0.02em;
    color: ${brand.copper};
  }
  .run {
    display: flex; align-items: center; justify-content: space-between;
    padding-block-start: 28px;
    border-block-start: 2px solid ${brand.line};
    font-size: 24px; font-weight: 500;
  }
  ol { display: flex; gap: 30px; list-style: none; color: ${brand.ivory}; }
  li { display: flex; align-items: center; gap: 8px; }
  .check { width: 26px; height: 26px; color: ${brand.passGreen}; }
  .verdict { color: ${brand.passGreen}; letter-spacing: 0.06em; }
</style>
</head>
<body>
  <header>
    <div class="mark">${card.monogram}</div>
    <p class="domain">${escapeHtml(card.domain)}</p>
  </header>
  <main>
    <h1>${escapeHtml(card.name)}</h1>
    <p class="tagline">${escapeHtml(card.tagline)}</p>
  </main>
  <footer class="run">
    <ol>${stages}</ol>
    <span class="verdict">PASSED</span>
  </footer>
</body>
</html>`;
}

/**
 * The home-screen icon: the favicon's monogram, full bleed on graphite. iOS rounds the corners
 * itself, so the square has none and no transparency.
 */
export function touchIconHtml(monogram: string, size: number): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; }
  html, body { width: ${size}px; height: ${size}px; background: ${brand.graphite}; }
  svg { display: block; width: 100%; height: 100%; }
</style>
</head>
<body>${monogram}</body>
</html>`;
}
