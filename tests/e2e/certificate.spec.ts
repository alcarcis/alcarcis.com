import {
  certificateDecor,
  certificateWidths,
  commitUrl,
  rowsStackBelowPx,
} from "./data/contact";
import { englishPage, localeCases } from "./data/locales";
import { expect, test } from "./fixtures";
import {
  headCommit,
  headCommitDay,
  listedTestCount,
  todayUtc,
} from "./support/buildFacts";

for (const locale of localeCases) {
  const { certificate: copy } = locale.contact;

  test.describe(`${locale.language.name} certificate`, () => {
    test.beforeEach(async ({ homePage }) => {
      await homePage.open(locale.language.path);
    });

    test("states the gate's tolerances in its own row, right after Performance", async ({
      homePage,
    }) => {
      const { certificate } = homePage.contact(locale);
      const [, performance, gate] = copy.facts;
      if (!performance || !gate) throw new Error("The copy lacks the rows.");
      const terms = (
        await certificate.region.getByRole("term").allTextContents()
      ).map((term) => term.trim());

      expect(terms.indexOf(gate.term)).toBe(
        terms.indexOf(performance.term) + 1,
      );
      await expect(certificate.value(gate.term)).toHaveText(gate.fact);
    });

    test(`links the commit hash to the commit on GitHub, read as "<hash> ${copy.commitLinkSuffix}"`, async ({
      homePage,
    }) => {
      const { certificate } = homePage.contact(locale);
      const sha = headCommit().slice(0, 7);

      await expect(certificate.commitLink).toHaveAttribute(
        "href",
        commitUrl(headCommit()),
      );
      await expect(certificate.commitLink).toHaveText(
        `${sha} ${copy.commitLinkSuffix}`,
      );
      await expect(certificate.commitLink).toHaveAccessibleName(
        `${sha} ${copy.commitLinkSuffix}`,
      );
      await expect(certificate.commitLink).not.toHaveAttribute(
        "href",
        /\/checks$/,
      );
    });

    test("keeps its seal, frame, watermark and corners out of the accessibility tree", async ({
      homePage,
    }) => {
      const { certificate } = homePage.contact(locale);

      for (const kind of certificateDecor) {
        const layer = certificate.decor(kind);
        await expect(layer.first(), kind).toBeAttached();
        for (const element of await layer.all()) {
          await expect(element, kind).toHaveAttribute("aria-hidden", "true");
        }
      }
    });

    test("draws its decoration in CSS and inline SVG, with no image and no script", async ({
      homePage,
    }) => {
      const { certificate } = homePage.contact(locale);

      await expect(certificate.decor("seal")).toHaveJSProperty(
        "tagName",
        "svg",
      );
      await expect(certificate.imagesAndScripts()).toHaveCount(0);
    });
  });

  for (const width of certificateWidths) {
    test.describe(`${locale.language.name} certificate ${width}px wide`, () => {
      test.use({ viewport: { width, height: 900 } });

      test.beforeEach(async ({ homePage }) => {
        await homePage.open(locale.language.path);
        await homePage
          .contact(locale)
          .certificate.region.scrollIntoViewIfNeeded();
      });

      test("sets its seal over the frame's corner, clear of the heading and every row", async ({
        homePage,
      }) => {
        const { certificate } = homePage.contact(locale);

        await expect(certificate.decor("seal")).toBeVisible();
        expect(await certificate.textUnderSeal()).toEqual([]);
      });

      test(`stacks each term above its value only when the card is under ${rowsStackBelowPx / 16}rem`, async ({
        homePage,
      }) => {
        const { certificate } = homePage.contact(locale);
        const stacked = (await certificate.width()) < rowsStackBelowPx;

        for (const { term, value } of await certificate.rowLayouts()) {
          if (stacked) {
            expect(value.top).toBeGreaterThanOrEqual(term.bottom - 1);
          } else {
            expect(value.left).toBeGreaterThanOrEqual(term.right);
            expect(Math.abs(value.top - term.top)).toBeLessThan(1);
          }
        }
      });

      test("fits the page without sideways scrolling", async ({ homePage }) => {
        expect(await homePage.sidewaysOverflow()).toBe(0);
      });
    });
  }
}

test.describe("certificate build rows", () => {
  const { certificate: copy } = englishPage.contact;

  test.beforeEach(async ({ homePage }) => {
    await homePage.open(englishPage.language.path);
  });

  test("Commit is the commit this build was made from", async ({
    homePage,
  }) => {
    const { certificate } = homePage.contact(englishPage);

    await expect(certificate.commitLink).toHaveText(
      new RegExp(`^${headCommit().slice(0, 7)}`),
    );
  });

  test("Built is a UTC date between that commit and today", async ({
    homePage,
  }) => {
    const { certificate } = homePage.contact(englishPage);
    const built =
      (await certificate.value(copy.builtTerm).textContent())?.trim() ?? "";

    expect(built).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(built >= headCommitDay(), "Built must not predate its commit").toBe(
      true,
    );
    expect(built <= todayUtc(), "Built must not be in the future").toBe(true);
    await expect(
      certificate.value(copy.builtTerm).locator("time"),
    ).toHaveAttribute("datetime", built);
  });

  test("E2E counts the tests this suite lists", async ({ homePage }) => {
    const { certificate } = homePage.contact(englishPage);

    await expect(certificate.value("E2E")).toHaveText(
      copy.e2eFact(listedTestCount()),
    );
  });
});
