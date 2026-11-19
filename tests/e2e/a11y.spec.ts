import { accessibilityCanaries } from "./data/accessibilityCanaries";
import { colorSchemes } from "./data/colorSchemes";
import { localeCases } from "./data/locales";
import { navLayouts } from "./data/sectionsNav";
import { expect, test } from "./fixtures";
import { countTargetsWithin } from "./support/accessibility";

for (const colorScheme of colorSchemes) {
  test.describe(`${colorScheme} colour scheme`, () => {
    test.use({ colorScheme });

    for (const locale of localeCases) {
      test(`${locale.language.name} page at ${locale.language.path} has no WCAG 2.1 A or AA violations`, async ({
        homePage,
        accessibilityScanner,
      }) => {
        await homePage.open(locale.language.path);
        await expect(homePage.document).toHaveCSS("color-scheme", colorScheme);

        const report = await accessibilityScanner.scan();

        expect(report).toHaveNoViolations();
      });
    }
  });
}

// A scan reports no violations for text it could not judge: contrast over a background gradient
// or image is left for manual review, and an element the browser skips is never reached. The
// contrast check must decide on the text of every landmark below the hero, and leave none of it.
test.describe("accessibility scan coverage", () => {
  for (const colorScheme of colorSchemes) {
    test.describe(`${colorScheme} colour scheme`, () => {
      test.use({ colorScheme });

      for (const locale of localeCases) {
        test(`the contrast check decides on every section and the footer of the ${locale.language.name} page`, async ({
          homePage,
          accessibilityScanner,
        }) => {
          await homePage.open(locale.language.path);
          await expect(homePage.document).toHaveCSS(
            "color-scheme",
            colorScheme,
          );
          const landmarks = homePage.landmarksBelowHero(locale);

          const report = await accessibilityScanner.scan();
          const decided = report.targetsDecidedBy("color-contrast");
          const undecided = report.targetsUndecidedBy("color-contrast");

          for (const landmark of landmarks) {
            expect(await countTargetsWithin(landmark, decided)).toBeGreaterThan(
              0,
            );
            expect(await countTargetsWithin(landmark, undecided)).toBe(0);
          }
        });
      }
    });
  }
});

// The header's sections nav is checked in both of its layouts: inline on a wide screen, and as
// the open menu on a phone, where it also holds the profile links.
const sectionsNavLayouts = [
  { layout: "inline", viewport: navLayouts.inline, openMenu: false },
  { layout: "open phone menu", viewport: navLayouts.phone, openMenu: true },
] as const;

test.describe("accessibility scan of the sections nav", () => {
  for (const colorScheme of colorSchemes) {
    for (const { layout, viewport, openMenu } of sectionsNavLayouts) {
      test.describe(`${colorScheme} colour scheme, ${layout}`, () => {
        test.use({ colorScheme, viewport });

        for (const locale of localeCases) {
          test(`the ${locale.language.name} page has no violations and the contrast check decides on every nav link`, async ({
            homePage,
            accessibilityScanner,
          }) => {
            await homePage.open(locale.language.path);
            await expect(homePage.document).toHaveCSS(
              "color-scheme",
              colorScheme,
            );
            const nav = homePage.sectionsNav(locale);
            if (openMenu) await nav.openMenu();

            const report = await accessibilityScanner.scan();
            const decided = report.targetsDecidedBy("color-contrast");
            const undecided = report.targetsUndecidedBy("color-contrast");

            expect(report).toHaveNoViolations();
            const links = await nav.landmark.getByRole("link").all();
            expect(links.length).toBeGreaterThan(0);
            for (const link of links) {
              expect(await countTargetsWithin(link, decided)).toBeGreaterThan(
                0,
              );
            }
            expect(await countTargetsWithin(nav.landmark, undecided)).toBe(0);
          });
        }
      });
    }
  }
});

test.describe("accessibility scanner", () => {
  for (const canary of accessibilityCanaries) {
    test(`reports ${canary.description}`, async ({
      page,
      accessibilityScanner,
    }) => {
      await page.setContent(canary.document);

      const report = await accessibilityScanner.scan();

      expect(report.ruleIds).toEqual([canary.ruleId]);
    });
  }
});
