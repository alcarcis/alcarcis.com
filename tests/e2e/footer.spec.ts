import { localeCases } from "./data/locales";
import { expect, test } from "./fixtures";
import { headCommitDay, todayUtc } from "./support/buildFacts";

const yearOf = (day: string): string => day.slice(0, 4);

for (const locale of localeCases) {
  test.describe(`${locale.language.name} footer`, () => {
    test.beforeEach(async ({ homePage }) => {
      await homePage.open(locale.language.path);
    });

    test("is the page's one content info landmark, outside its main content", async ({
      homePage,
    }) => {
      const footer = homePage.footer(locale);

      // A footer inside the main content or a section is not content info, so the landmark
      // exists only outside them.
      await expect(footer.landmark).toHaveCount(1);
      await expect(footer.landmark).toBeVisible();
    });

    test("reads the copyright, the privacy note, then the logo credits and their links", async ({
      homePage,
    }) => {
      await homePage.footer(locale).expectReadingOrder();
    });

    test("dates the copyright to the year the page was built", async ({
      homePage,
    }) => {
      const year = await homePage.footer(locale).copyrightYear();

      expect(
        year >= yearOf(headCommitDay()),
        "The copyright year must not predate the commit the page was built from",
      ).toBe(true);
      expect(
        year <= yearOf(todayUtc()),
        "The copyright year must not be in the future",
      ).toBe(true);
    });

    test("credits the Jenkins project with a link to jenkins.io, and each licence the logos ask to name", async ({
      homePage,
    }) => {
      const footer = homePage.footer(locale);

      for (const { name, url } of footer.expectedCreditLinks) {
        await expect(
          footer.credits.getByRole("link", { name, exact: true }),
        ).toHaveAttribute("href", url);
      }
    });
  });
}
