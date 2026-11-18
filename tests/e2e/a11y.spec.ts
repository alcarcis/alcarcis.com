import { accessibilityCanaries } from "./data/accessibilityCanaries";
import { colorSchemes } from "./data/colorSchemes";
import { localeCases } from "./data/locales";
import { expect, test } from "./fixtures";

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
