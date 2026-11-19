import { localeCases } from "./data/locales";
import { expect, test } from "./fixtures";

/** The modern formats the photo is served in; browsers without them fall back to JPEG. */
const modernImageType = /^image\/(avif|webp)\b/;

for (const locale of localeCases) {
  test.describe(`${locale.language.name} About section`, () => {
    test.beforeEach(async ({ homePage }) => {
      await homePage.open(locale.language.path);
    });

    test("is a region named by its title, opened by its test case code", async ({
      homePage,
    }) => {
      await homePage.about(locale).head.expectShown();
    });

    test("reads the lead first, then the paragraphs, then the photo", async ({
      homePage,
    }) => {
      await homePage.about(locale).expectReadingOrder();
    });

    test("serves the photo in a modern format with its dimensions declared", async ({
      homePage,
      request,
    }) => {
      const about = homePage.about(locale);

      await expect(about.photo).toHaveAttribute("width", /^[1-9]\d*$/);
      await expect(about.photo).toHaveAttribute("height", /^[1-9]\d*$/);

      const photo = await request.get(await about.loadedPhotoUrl());
      expect(photo.status()).toBe(200);
      expect(photo.headers()["content-type"]).toMatch(modernImageType);
    });
  });
}
