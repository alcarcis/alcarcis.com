import { contactEmailHref, localeCases } from "./data/locales";
import { expect, test } from "./fixtures";

for (const locale of localeCases) {
  test.describe(`${locale.language.name} hero`, () => {
    test.beforeEach(async ({ homePage }) => {
      await homePage.open(locale.language.path);
    });

    test("introduces the owner by name, promise and disciplines", async ({
      homePage,
    }) => {
      const hero = homePage.hero(locale);

      await expect(hero.heading).toHaveText(locale.heading);
      await expect(hero.displayLine).toBeVisible();
      await expect(hero.sub).toBeVisible();
      await expect(hero.disciplines).toBeVisible();
    });

    test("reads the name and promise first, then the disciplines, then the primary action", async ({
      homePage,
    }) => {
      await homePage.hero(locale).expectReadingOrder();
    });

    test("its primary action opens an email to the owner", async ({
      homePage,
    }) => {
      await expect(homePage.hero(locale).primaryAction).toHaveAttribute(
        "href",
        contactEmailHref,
      );
    });

    test("offers the CV download exactly when this page's PDF is in the build", async ({
      homePage,
      request,
    }) => {
      const { cvLinks } = homePage.hero(locale);
      const pdf = await request.get(locale.hero.cvPath);

      await expect(cvLinks).toHaveCount(pdf.ok() ? 1 : 0);
      for (const link of await cvLinks.all()) {
        await expect(link).toHaveAttribute("href", locale.hero.cvPath);
      }
    });

    test("preloads the headline and body fonts", async ({ homePage }) => {
      await expect(homePage.seo.fontPreloads).toHaveCount(2);
    });
  });
}
