import { accessibilityCanaries } from "./data/accessibilityCanaries";
import { colorSchemes } from "./data/colorSchemes";
import { localeCases } from "./data/locales";
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
// contrast check must decide on the text of every section below the hero, and leave none of it.
test.describe("accessibility scan coverage", () => {
  for (const locale of localeCases) {
    test(`the contrast check decides on every section of the ${locale.language.name} page`, async ({
      homePage,
      accessibilityScanner,
    }) => {
      await homePage.open(locale.language.path);
      const sections = [homePage.about(locale).region];

      const report = await accessibilityScanner.scan();
      const decided = report.targetsDecidedBy("color-contrast");
      const undecided = report.targetsUndecidedBy("color-contrast");

      for (const section of sections) {
        expect(await countTargetsWithin(section, decided)).toBeGreaterThan(0);
        expect(await countTargetsWithin(section, undecided)).toBe(0);
      }
    });
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
