import { localeCases } from "./data/locales";
import { expect, test } from "./fixtures";

for (const locale of localeCases) {
  test.describe(`${locale.language.name} Open source section`, () => {
    test.beforeEach(async ({ homePage }) => {
      await homePage.open(locale.language.path);
    });

    test("is a region named by its title, opened by its test case code", async ({
      homePage,
    }) => {
      await homePage.openSource(locale).head.expectShown();
    });

    test("reads each repository's name, description, link and usage summary in order, without the printed numbers or the terminal", async ({
      homePage,
    }) => {
      await homePage.openSource(locale).expectReadingOrder();
    });

    test("prints the repository numbers in order on screen", async ({
      homePage,
    }) => {
      const openSource = homePage.openSource(locale);

      await expect(openSource.rowNumbers).toHaveText(
        openSource.expectedRowNumbers,
      );
      for (const rowNumber of await openSource.rowNumbers.all()) {
        await expect(rowNumber).toBeVisible();
      }
    });

    test("prints each README's usage in its repository's terminal", async ({
      homePage,
    }) => {
      for (const { copy, terminal } of homePage.openSource(locale)
        .repositories) {
        await expect(terminal.window).toBeVisible();
        expect(await terminal.visibleText()).toBe(copy.repository.usage);
      }
    });

    test("names each terminal's README source in its bar", async ({
      homePage,
    }) => {
      for (const { copy, terminal } of homePage.openSource(locale)
        .repositories) {
        await expect(terminal.window).toContainText(
          `README · ${copy.usageSource}`,
        );
      }
    });
  });
}
