import { localeCases } from "./data/locales";
import { expect, test } from "./fixtures";
import { codeFaces, monoFamily } from "./support/typography";

for (const locale of localeCases) {
  test.describe(`${locale.language.name} typography`, () => {
    test("sets every piece of code in the page's mono face, not the browser's monospace", async ({
      homePage,
      page,
    }) => {
      await homePage.open(locale.language.path);
      const mono = await monoFamily(page);
      const faces = await codeFaces(page);

      expect(mono).not.toBe("");
      expect(faces.length).toBeGreaterThan(0);
      for (const { element, family } of faces) {
        expect(family, element).toBe(mono);
      }
    });
  });
}
