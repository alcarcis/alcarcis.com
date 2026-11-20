import {
  budget,
  dataTerms,
  finalFrameLines,
  specSource,
  stageNames,
  testCountText,
} from "./data/instrument";
import { englishPage, localeCases } from "./data/locales";
import { expect, test } from "./fixtures";
import { boxOf } from "./support/pageState";
import {
  headCommit,
  headCommitDay,
  listedTestCount,
  todayUtc,
} from "./support/buildFacts";

/** Where the bar has room for its title, status and run controls on one row, and where not. */
const barLayouts = [
  { layout: "tablet", viewport: { width: 768, height: 900 }, oneRow: true },
  { layout: "phone", viewport: { width: 390, height: 844 }, oneRow: false },
] as const;

for (const locale of localeCases) {
  for (const { layout, viewport, oneRow } of barLayouts) {
    test.describe(`${locale.language.name} instrument bar on a ${layout}`, () => {
      test.use({ viewport, reducedMotion: "reduce" });

      test(`shows the status and Rerun ${oneRow ? "beside" : "below"} the title`, async ({
        homePage,
      }) => {
        const { instrument } = homePage.hero(locale);
        await homePage.open(locale.language.path);
        const title = await boxOf(instrument.barTitle);
        const middle = (box: { y: number; height: number }): number =>
          box.y + box.height / 2;

        for (const control of [instrument.status, instrument.rerun]) {
          const box = await boxOf(control);
          if (oneRow) {
            expect(Math.abs(middle(box) - middle(title))).toBeLessThan(1);
          } else {
            expect(box.y).toBeGreaterThanOrEqual(title.y + title.height);
          }
        }
      });
    });
  }

  test.describe(`${locale.language.name} instrument`, () => {
    test("names its five stages and the spec it runs", async ({ homePage }) => {
      const { instrument } = homePage.hero(locale);
      await homePage.open(locale.language.path);

      await expect(instrument.region).toBeVisible();
      await expect(instrument.sceneLabel).toBeVisible();
      await expect(instrument.stages.getByRole("listitem")).toHaveCount(
        stageNames.length,
      );
      await expect(instrument.specText).toBeAttached();
    });
  });

  // The page's text holds the code twice, typed and as one sentence; only the sentence is for
  // assistive technology. Reduced motion shows the whole code at once, so both are complete.
  test.describe(`${locale.language.name} instrument for assistive technology`, () => {
    test.use({ reducedMotion: "reduce" });

    test("reads the spec once", async ({ homePage }) => {
      const { instrument } = homePage.hero(locale);
      await homePage.open(locale.language.path);

      await expect(instrument.typedCode).toHaveText(specSource);
      expect(await instrument.specReadCount()).toBe(1);
    });
  });

  // 320 px is where content must reflow without loss (WCAG 1.4.10): the code wraps there
  // instead of running out of its window.
  test.describe(`${locale.language.name} instrument at 320 px`, () => {
    test.use({
      viewport: { width: 320, height: 800 },
      reducedMotion: "reduce",
    });

    test("shows every character of the spec inside its window", async ({
      homePage,
    }) => {
      const { instrument } = homePage.hero(locale);
      await homePage.open(locale.language.path);

      await expect(instrument.typedCode).toHaveText(specSource);
      expect(await instrument.codeOverflow()).toBeLessThanOrEqual(0);
    });
  });

  test.describe(`${locale.language.name} instrument without JavaScript`, () => {
    test.use({ javaScriptEnabled: false });

    test("shows the final passed frame", async ({ homePage }) => {
      const { instrument } = homePage.hero(locale);
      await homePage.open(locale.language.path);

      await instrument.expectFinalFrame();
    });

    test("draws the scene's last frame in text: the workflow run, deployed", async ({
      homePage,
    }) => {
      const { instrument } = homePage.hero(locale);
      await homePage.open(locale.language.path);

      await expect(instrument.textFrame).toBeVisible();
      await expect(instrument.textFrameLines).toHaveText(finalFrameLines);
    });
  });
}

test.describe("instrument data rows", () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.open(englishPage.language.path);
  });

  test("COMMIT is the commit this build was made from", async ({
    homePage,
  }) => {
    const { instrument } = homePage.hero(englishPage);

    await expect(instrument.dataValue(dataTerms.commit)).toHaveText(
      headCommit().slice(0, 7),
    );
  });

  test("BUILT is a UTC date between that commit and today", async ({
    homePage,
  }) => {
    const { instrument } = homePage.hero(englishPage);

    const built =
      (await instrument.dataValue(dataTerms.built).textContent()) ?? "";

    expect(built).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(built >= headCommitDay(), "BUILT must not predate its commit").toBe(
      true,
    );
    expect(built <= todayUtc(), "BUILT must not be in the future").toBe(true);
  });

  test("TESTS is the number of tests this suite lists", async ({
    homePage,
  }) => {
    const { instrument } = homePage.hero(englishPage);

    await expect(instrument.dataValue(dataTerms.tests)).toHaveText(
      testCountText(listedTestCount()),
    );
  });

  test("BUDGET states the enforced thresholds", async ({ homePage }) => {
    const { instrument } = homePage.hero(englishPage);

    await expect(instrument.dataValue(dataTerms.budget)).toHaveText(budget);
  });
});
