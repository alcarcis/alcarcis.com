import { localeCases } from "./data/locales";
import { expect, test } from "./fixtures";

for (const locale of localeCases) {
  test.describe(`${locale.language.name} What I work on section`, () => {
    test.beforeEach(async ({ homePage }) => {
      await homePage.open(locale.language.path);
    });

    test("is a region named by its title, opened by its test case code", async ({
      homePage,
    }) => {
      await homePage.work(locale).head.expectShown();
    });

    test("reads each item's title and description in order, without the printed numbers", async ({
      homePage,
    }) => {
      await homePage.work(locale).expectReadingOrder();
    });

    test("prints the item numbers in order on screen", async ({ homePage }) => {
      const work = homePage.work(locale);

      await expect(work.itemNumbers).toHaveText(work.expectedItemNumbers);
      for (const itemNumber of await work.itemNumbers.all()) {
        await expect(itemNumber).toBeVisible();
      }
    });
  });
}
