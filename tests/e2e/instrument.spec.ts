import {
  budget,
  dataTerms,
  stageNames,
  testCountText,
} from "./data/instrument";
import { englishPage, localeCases } from "./data/locales";
import { expect, test } from "./fixtures";
import {
  headCommit,
  headCommitDay,
  listedTestCount,
  todayUtc,
} from "./support/buildFacts";

for (const locale of localeCases) {
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

  test.describe(`${locale.language.name} instrument without JavaScript`, () => {
    test.use({ javaScriptEnabled: false });

    test("shows the final passed frame", async ({ homePage }) => {
      const { instrument } = homePage.hero(locale);
      await homePage.open(locale.language.path);

      await instrument.expectFinalFrame();
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
