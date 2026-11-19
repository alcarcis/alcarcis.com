import { colorSchemes, oppositeOf } from "./data/colorSchemes";
import { englishPage, localeCases } from "./data/locales";
import { expect, test } from "./fixtures";
import {
  blockLocalStorage,
  clearSiteStorage,
  storedTheme,
} from "./support/storage";

for (const systemScheme of colorSchemes) {
  const otherScheme = oppositeOf(systemScheme);

  test.describe(`with a ${systemScheme} system preference`, () => {
    test.use({ colorScheme: systemScheme });

    test("the first visit follows the system preference", async ({
      homePage,
    }) => {
      await homePage.open(englishPage.language.path);

      await expect(homePage.document).toHaveCSS("color-scheme", systemScheme);
      await expect(
        homePage.header(englishPage.header).themeToggle.offering(otherScheme),
      ).toBeVisible();
    });

    test(`the toggle switches to ${otherScheme} and the choice survives a reload`, async ({
      homePage,
      page,
    }) => {
      const { themeToggle } = homePage.header(englishPage.header);
      await homePage.open(englishPage.language.path);

      await themeToggle.switchTo(otherScheme);
      await expect(homePage.document).toHaveCSS("color-scheme", otherScheme);
      await homePage.reload();

      await expect(homePage.document).toHaveCSS("color-scheme", otherScheme);
      await expect(themeToggle.offering(systemScheme)).toBeVisible();
      expect(await storedTheme(page)).toBe(otherScheme);
    });

    test("switching back to the system theme forgets the choice", async ({
      homePage,
      page,
    }) => {
      const { themeToggle } = homePage.header(englishPage.header);
      await homePage.open(englishPage.language.path);

      await themeToggle.switchTo(otherScheme);
      await themeToggle.switchTo(systemScheme);
      await homePage.reload();

      await expect(homePage.document).toHaveCSS("color-scheme", systemScheme);
      expect(await storedTheme(page)).toBeNull();
    });

    test("with storage blocked the page follows the system preference and the toggle still works", async ({
      homePage,
      page,
      consoleErrors,
    }) => {
      await blockLocalStorage(page);
      const { themeToggle } = homePage.header(englishPage.header);
      await homePage.open(englishPage.language.path);
      await expect(homePage.document).toHaveCSS("color-scheme", systemScheme);

      await themeToggle.switchTo(otherScheme);

      await expect(homePage.document).toHaveCSS("color-scheme", otherScheme);
      expect(consoleErrors.report()).toHaveNoConsoleErrors();
    });

    test(`switching to ${otherScheme} in one tab switches another open tab too`, async ({
      homePage,
      otherTab,
    }) => {
      const { themeToggle } = homePage.header(englishPage.header);
      await homePage.open(englishPage.language.path);
      await otherTab.open(englishPage.language.path);

      await themeToggle.switchTo(otherScheme);

      await expect(otherTab.document).toHaveCSS("color-scheme", otherScheme);
      await expect(
        otherTab.header(englishPage.header).themeToggle.offering(systemScheme),
      ).toBeVisible();
    });

    test("clearing the site's storage returns every open tab to the system theme", async ({
      browserName,
      homePage,
      otherTab,
      page,
    }) => {
      test.skip(
        browserName !== "chromium",
        "Clearing site data goes through a DevTools Protocol session, which only Chromium offers; a localStorage.clear() call cannot stand in, since it skips the tab that calls it.",
      );
      const { themeToggle } = homePage.header(englishPage.header);
      await homePage.open(englishPage.language.path);
      await otherTab.open(englishPage.language.path);
      await themeToggle.switchTo(otherScheme);
      await expect(otherTab.document).toHaveCSS("color-scheme", otherScheme);

      await clearSiteStorage(page);

      await expect(homePage.document).toHaveCSS("color-scheme", systemScheme);
      await expect(otherTab.document).toHaveCSS("color-scheme", systemScheme);
    });

    for (const locale of localeCases) {
      test(`${locale.language.name} page switched to ${otherScheme} has no WCAG 2.1 A or AA violations`, async ({
        homePage,
        accessibilityScanner,
      }) => {
        await homePage.open(locale.language.path);
        await homePage.header(locale.header).themeToggle.switchTo(otherScheme);
        await expect(homePage.document).toHaveCSS("color-scheme", otherScheme);

        const report = await accessibilityScanner.scan();

        expect(report).toHaveNoViolations();
      });
    }

    // Reduced motion holds the instrument's run still, so only the theme or the pointer can
    // start a transition here; the controls' colour transitions run under either preference.
    test.describe("with reduced motion", () => {
      test.use({ reducedMotion: "reduce" });

      test(`the toggle swaps every colour to ${otherScheme} at once, without transitions`, async ({
        homePage,
        transitionRecorder,
      }) => {
        const { themeToggle } = homePage.header(englishPage.header);
        await homePage.open(englishPage.language.path);
        await themeToggle.hover();
        await transitionRecorder.settle();

        const report = await transitionRecorder.during(() =>
          themeToggle.switchTo(otherScheme),
        );

        await expect(homePage.document).toHaveCSS("color-scheme", otherScheme);
        expect(report).not.toStartColourTransitions();
      });

      test(`with no stored choice, a system switch to ${otherScheme} swaps every colour at once, without transitions`, async ({
        homePage,
        transitionRecorder,
      }) => {
        await homePage.open(englishPage.language.path);

        const report = await transitionRecorder.during(() =>
          homePage.switchSystemScheme(otherScheme),
        );

        await expect(homePage.document).toHaveCSS("color-scheme", otherScheme);
        expect(report).not.toStartColourTransitions();
      });

      test("hovering a header control still eases its colours", async ({
        homePage,
        transitionRecorder,
      }) => {
        const { themeToggle } = homePage.header(englishPage.header);
        await homePage.open(englishPage.language.path);

        const report = await transitionRecorder.during(() =>
          themeToggle.hover(),
        );

        expect(report).toStartColourTransitions();
      });
    });
  });
}

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the page offers no theme toggle it cannot run", async ({
    homePage,
  }) => {
    const { themeToggle } = homePage.header(englishPage.header);
    await homePage.open(englishPage.language.path);

    await expect(themeToggle.inMarkup).toHaveCount(1);
    await expect(themeToggle.inMarkup).toBeHidden();
  });
});
