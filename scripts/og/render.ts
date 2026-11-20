// Renders the share images (public/og/<locale>.png) and the touch icon
// (public/apple-touch-icon.png) with the Playwright Chromium the test suite already installs.
// Run `pnpm og` after changing the name, the display line, the logo or this template; the
// PNGs are committed, so a build never needs a browser.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Browser } from "@playwright/test";
import {
  shareImageSize,
  shareImageStages,
  shareImages,
  touchIcon,
} from "../../src/lib/seo.ts";
import { owner } from "../../src/site.ts";
import { shareCardHtml, touchIconHtml, type FontSources } from "./template.ts";

const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url));
const fromRoot = (path: string): string => join(repositoryRoot, path);

async function fontDataUrl(path: string): Promise<string> {
  const bytes = await readFile(fromRoot(path));
  return `data:font/woff2;base64,${bytes.toString("base64")}`;
}

async function screenshot(
  browser: Browser,
  html: string,
  size: { width: number; height: number },
  target: string,
): Promise<void> {
  const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 });
  try {
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    const missing = await page.evaluate(
      () =>
        [...document.fonts].filter((font) => font.status !== "loaded").length,
    );
    if (missing > 0) {
      throw new Error(`${missing} font face(s) did not load for ${target}.`);
    }
    const png = await page.screenshot({ type: "png", animations: "disabled" });
    const path = fromRoot(target);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, png);
    console.log(`[og] ${target} (${png.byteLength} bytes)`);
  } finally {
    await page.close();
  }
}

const mark = (await readFile(fromRoot("public/favicon.svg"), "utf8")).trim();
const fonts: FontSources = {
  display: await fontDataUrl("src/assets/fonts/chillax/Chillax-Variable.woff2"),
  mono: await fontDataUrl(
    "src/assets/fonts/geist-mono/GeistMono-Variable.woff2",
  ),
};

const browser = await chromium.launch();
try {
  for (const [lang, image] of Object.entries(shareImages)) {
    const html = shareCardHtml(
      {
        lang,
        name: owner.name,
        tagline: image.tagline,
        stages: shareImageStages,
        domain: "alcarcis.com",
        mark,
        ...shareImageSize,
      },
      fonts,
    );
    await screenshot(browser, html, shareImageSize, join("public", image.path));
  }
  await screenshot(
    browser,
    touchIconHtml(mark, touchIcon.size),
    { width: touchIcon.size, height: touchIcon.size },
    join("public", touchIcon.path),
  );
} finally {
  await browser.close();
}
