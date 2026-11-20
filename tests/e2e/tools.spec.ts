import { colorSchemes } from "./data/colorSchemes";
import { localeCases } from "./data/locales";
import { hoverCase, themedLogo } from "./data/tools";
import { expect, test } from "./fixtures";
import { waitForViewChecks } from "./support/pageState";

const svgType = /^image\/svg\+xml\b/;
/** Longer than any delay the page sets after load before it settles. */
const settleMs = 1_000;

for (const locale of localeCases) {
  test.describe(`${locale.language.name} Tools section`, () => {
    test.beforeEach(async ({ homePage }) => {
      await homePage.open(locale.language.path);
    });

    test("is a region named by its title, opened by its test case code", async ({
      homePage,
    }) => {
      await homePage.tools(locale).head.expectShown();
    });

    test("reads each group's title, then its tools, without the logos", async ({
      homePage,
    }) => {
      await homePage.tools(locale).expectReadingOrder();
    });

    test("shows each tool's logo beside it, an SVG served by this site", async ({
      homePage,
      page,
      request,
    }) => {
      const tools = homePage.tools(locale);
      const ownOrigin = new URL(page.url()).origin;
      await tools.scrollIntoView();
      await tools.waitForLogos();

      for (const name of tools.toolNames) {
        await expect(tools.logo(name)).toBeVisible();
        const url = new URL(await tools.logoUrl(name), page.url());
        expect(url.origin, `${name} logo`).toBe(ownOrigin);

        const logo = await request.get(url.href);
        expect(logo.status(), `${name} logo`).toBe(200);
        expect(logo.headers()["content-type"], `${name} logo`).toMatch(svgType);
      }
    });

    test("a single-colour logo takes its brand colour while the pointer rests on its tool", async ({
      homePage,
    }) => {
      const tools = homePage.tools(locale);
      const logo = tools.logo(hoverCase.tool);
      await expect(logo).not.toHaveCSS("color", hoverCase.brandColour);

      await tools.tool(hoverCase.tool).hover();

      await expect(logo).toHaveCSS("color", hoverCase.brandColour);
    });
  });
}

for (const colorScheme of colorSchemes) {
  test.describe(`${colorScheme} colour scheme`, () => {
    test.use({ colorScheme });

    test(`${themedLogo.tool} shows the tile made for a ${colorScheme} ground`, async ({
      homePage,
    }) => {
      const [locale] = localeCases;
      if (!locale) throw new Error("No locale to open.");
      await homePage.open(locale.language.path);
      const tools = homePage.tools(locale);
      await tools.scrollIntoView();

      expect(await tools.logoUrl(themedLogo.tool)).toMatch(
        themedLogo[colorScheme],
      );
    });
  });
}

for (const locale of localeCases) {
  test.describe(`${locale.language.name} Tools logos on a phone`, () => {
    // On a phone the section sits several screens below the top of the page.
    test.use({ viewport: { width: 390, height: 844 } });

    test("cost the page's load nothing: no logo file is requested until the section comes near", async ({
      homePage,
      page,
      frozenClock,
    }) => {
      const tools = homePage.tools(locale);
      tools.recordImageRequests();
      await homePage.open(locale.language.path);
      // Settled, with the section far below: the page has loaded, every timer it set for the
      // next second has run, and the browser has checked what is in view since then.
      await frozenClock.runFor(settleMs);
      await waitForViewChecks(page);

      expect(tools.requestedImageFiles).toEqual([]);

      await tools.scrollIntoView();
      await tools.waitForLogos();
      expect(tools.requestedImageFiles.length).toBeGreaterThan(0);
    });
  });

  test.describe(`${locale.language.name} Tools logos without JavaScript`, () => {
    test.use({ javaScriptEnabled: false });

    test("all show with the page", async ({ homePage }) => {
      await homePage.open(locale.language.path);
      const tools = homePage.tools(locale);

      for (const name of tools.toolNames) {
        await expect(tools.logo(name)).toBeVisible();
        expect(await tools.logoUrl(name), name).not.toBe("");
      }
    });
  });
}
