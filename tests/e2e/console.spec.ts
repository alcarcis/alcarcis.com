import { colorSchemes } from "./data/colorSchemes";
import { consoleCanaries } from "./data/consoleCanaries";
import { localeCases } from "./data/locales";
import { expect, test } from "./fixtures";

for (const colorScheme of colorSchemes) {
  test.describe(`${colorScheme} colour scheme`, () => {
    test.use({ colorScheme });

    for (const locale of localeCases) {
      test(`${locale.language.name} page at ${locale.language.path} loads without console errors, failed assertions or uncaught exceptions`, async ({
        homePage,
        consoleErrors,
      }) => {
        await homePage.open(locale.language.path, {
          waitUntil: "networkidle",
        });

        expect(consoleErrors.report()).toHaveNoConsoleErrors();
      });
    }
  });
}

test.describe("console error collector", () => {
  for (const canary of consoleCanaries) {
    test(`reports ${canary.description}`, async ({ page, consoleErrors }) => {
      await page.setContent(canary.document);

      expect(consoleErrors.report().errors).toEqual([
        expect.objectContaining(canary.expected),
      ]);
    });
  }
});
