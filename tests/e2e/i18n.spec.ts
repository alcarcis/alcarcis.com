import {
  alternateLinks,
  englishPage,
  languageOptions,
  localeCases,
  spanishPage,
  type LocaleCase,
} from "./data/locales";
import { expect, test } from "./fixtures";
import type { HomePage } from "./pages/HomePage";

async function expectCurrentLanguage(
  homePage: HomePage,
  locale: LocaleCase,
): Promise<void> {
  const languageSwitch = homePage.languageSwitch(locale.languageSwitchName);
  await expect(homePage.document).toHaveAttribute("lang", locale.language.lang);
  await expect(
    languageSwitch.option(locale.language.accessibleName),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    languageSwitch.option(locale.switchTarget.accessibleName),
  ).not.toHaveAttribute("aria-current");
}

for (const locale of localeCases) {
  test.describe(`${locale.language.name} page at ${locale.language.path}`, () => {
    test.beforeEach(async ({ homePage }) => {
      await homePage.open(locale.language.path);
    });

    test("declares its language and shows the name as the main heading", async ({
      homePage,
    }) => {
      await expect(homePage.document).toHaveAttribute(
        "lang",
        locale.language.lang,
      );
      await expect(homePage.mainHeading).toHaveText(locale.heading);
      await expect(homePage.textInMain(locale.displayLine)).toBeVisible();
    });

    test("titles the page in its language", async ({ page }) => {
      await expect(page).toHaveTitle(locale.title);
    });

    test("names its skip link in its language and points it at the main content", async ({
      homePage,
    }) => {
      await expect(homePage.main).toHaveId("main");
      await expect(homePage.skipLink(locale.skipLinkName)).toHaveAttribute(
        "href",
        "#main",
      );
    });

    test("marks its own language as the current option of the switch", async ({
      homePage,
    }) => {
      await expectCurrentLanguage(homePage, locale);
    });

    test("shows every language option as its code, names it in that language and links to its page", async ({
      homePage,
    }) => {
      const languageSwitch = homePage.languageSwitch(locale.languageSwitchName);

      for (const option of languageOptions) {
        const link = languageSwitch.option(option.accessibleName);
        await expect(
          languageSwitch.visibleLabel(option.accessibleName),
        ).toHaveText(option.code);
        await expect(link).toHaveAttribute("href", option.path);
        await expect(link).toHaveAttribute("hreflang", option.lang);
        await expect(link).toHaveAttribute("lang", option.lang);
      }
    });

    test("points search engines at its canonical URL and every language alternate", async ({
      homePage,
    }) => {
      await expect(homePage.seo.canonical).toHaveAttribute(
        "href",
        locale.canonicalUrl,
      );
      await expect(homePage.seo.alternates).toHaveCount(alternateLinks.length);

      for (const alternate of alternateLinks) {
        await expect(
          homePage.seo.alternate(alternate.hreflang),
        ).toHaveAttribute("href", alternate.href);
      }
    });
  });
}

test("the language switch takes a visitor from English to Spanish and back", async ({
  homePage,
  page,
}) => {
  await test.step("open the English page", async () => {
    await homePage.open(englishPage.language.path);
  });

  await test.step("switch to Spanish", async () => {
    await homePage
      .languageSwitch(englishPage.languageSwitchName)
      .switchTo(spanishPage.language.accessibleName);
    await expect(page).toHaveURL(spanishPage.language.path);
    await expectCurrentLanguage(homePage, spanishPage);
  });

  await test.step("switch back to English", async () => {
    await homePage
      .languageSwitch(spanishPage.languageSwitchName)
      .switchTo(englishPage.language.accessibleName);
    await expect(page).toHaveURL(englishPage.language.path);
    await expectCurrentLanguage(homePage, englishPage);
  });
});
