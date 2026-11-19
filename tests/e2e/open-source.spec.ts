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

for (const locale of localeCases) {
  test.describe(`${locale.language.name} Open source section without JavaScript`, () => {
    test.use({ javaScriptEnabled: false });

    test("prints each README's usage in its repository's terminal", async ({
      homePage,
    }) => {
      await homePage.open(locale.language.path);

      for (const { copy, terminal } of homePage.openSource(locale)
        .repositories) {
        await expect(terminal.window).toBeVisible();
        expect(await terminal.visibleText()).toBe(copy.repository.usage);
      }
    });
  });
}

/**
 * The desktop layouts, where the lines neither wrap nor scroll: the narrowest viewport that gets
 * one (60em), the narrowest terminal (from 68.75em the terminal shares its row in three columns),
 * and a wide screen.
 */
const desktopViewports = [
  { layout: "narrowest desktop", viewport: { width: 960, height: 900 } },
  { layout: "three-column", viewport: { width: 1100, height: 900 } },
  { layout: "wide desktop", viewport: { width: 1440, height: 900 } },
] as const;

for (const { layout, viewport } of desktopViewports) {
  for (const locale of localeCases) {
    test.describe(`${locale.language.name} Open source terminals on the ${layout} layout`, () => {
      // Every line shows from the start, so the measure does not depend on typing.
      test.use({ viewport, reducedMotion: "reduce" });

      test("fit every line of their usage, so none is clipped", async ({
        homePage,
      }) => {
        await homePage.open(locale.language.path);

        for (const { copy, terminal } of homePage.openSource(locale)
          .repositories) {
          expect(
            await terminal.clippedWidth(),
            `${copy.repository.name} lines past the edge, in px`,
          ).toBe(0);
        }
      });
    });
  }
}
