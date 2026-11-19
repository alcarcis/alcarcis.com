import { contactEmailHref, localeCases } from "./data/locales";
import { expect, test } from "./fixtures";

/** Every PDF file opens with this header, whatever the server says about it. */
const pdfSignature = "%PDF-";
/** The PDF media type, with or without parameters such as a charset. */
const pdfMediaType = /^application\/pdf\b/;

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

    test("offers this page's CV as a PDF", async ({ homePage, request }) => {
      const { cvLinks } = homePage.hero(locale);

      await expect(cvLinks).toHaveCount(1);
      await expect(cvLinks).toHaveAttribute("href", locale.hero.cvPath);

      const pdf = await request.get(locale.hero.cvPath);
      expect(pdf.status()).toBe(200);
      expect(pdf.headers()["content-type"]).toMatch(pdfMediaType);

      const body = await pdf.body();
      expect(body.length).toBeGreaterThan(pdfSignature.length);
      expect(body.subarray(0, pdfSignature.length).toString("latin1")).toBe(
        pdfSignature,
      );
    });

    test("preloads the headline and body fonts", async ({ homePage }) => {
      await expect(homePage.seo.fontPreloads).toHaveCount(2);
    });
  });
}
