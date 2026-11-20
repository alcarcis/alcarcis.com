import { localeCases } from "./data/locales";
import { expect, test } from "./fixtures";
import {
  codeFaces,
  linesPerOccurrence,
  monoFamily,
} from "./support/typography";

/** A term a line must never split, and the widths where it used to fall on a line break. */
const unbreakableTerm = "pull request";
const wrapWidths = [320, 390, 1024];

for (const locale of localeCases) {
  for (const width of wrapWidths) {
    test.describe(`${locale.language.name} line breaks ${width}px wide`, () => {
      test.use({ viewport: { width, height: 800 }, reducedMotion: "reduce" });

      test(`keeps "${unbreakableTerm}" on one line in the hero note and the certificate`, async ({
        homePage,
      }) => {
        await homePage.open(locale.language.path);
        const places = [
          homePage.hero(locale).reportLink,
          homePage.contact(locale).certificate.region,
        ];

        for (const place of places) {
          const lines = await linesPerOccurrence(place, unbreakableTerm);
          expect(lines.length).toBeGreaterThan(0);
          expect(lines).toEqual(lines.map(() => 1));
        }
      });
    });
  }
}

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
