import { colorSchemes } from "./data/colorSchemes";
import { profileUrls } from "./data/externalLinks";
import { englishPage, localeCases } from "./data/locales";
import { logoInks, maxBlinkMilliseconds, minTargetPixels } from "./data/logo";
import { expect, test } from "./fixtures";

for (const locale of localeCases) {
  test.describe(`${locale.language.name} page header`, () => {
    test.beforeEach(async ({ homePage }) => {
      await homePage.open(locale.language.path);
    });

    test("names the owner in one link back to the top of the page", async ({
      homePage,
    }) => {
      const { ownerLink } = homePage.header(locale.header);

      await expect(ownerLink).toHaveAttribute("href", "#top");
      await expect(ownerLink).toContainText(locale.heading);
    });

    test("shows only the mark while the hero names the owner", async ({
      homePage,
    }) => {
      const header = homePage.header(locale.header);

      await expect(header.mark).toBeVisible();
      await expect(header.ownerName).toBeHidden();
    });

    test("names the owner beside the mark once the hero's name scrolls away, and stops at the top again", async ({
      homePage,
    }) => {
      const header = homePage.header(locale.header);

      await homePage.hero(locale).scrollHeadingOutOfView();
      await expect(header.ownerName).toBeVisible();
      await expect(header.ownerName).toHaveCSS("opacity", "1");

      await homePage.scrollToTop();
      await expect(header.ownerName).toBeHidden();
    });

    test("keeps the owner link at least 40 px each way with only the mark showing", async ({
      homePage,
    }) => {
      const box = await homePage.header(locale.header).ownerLink.boundingBox();

      expect(box?.width).toBeGreaterThanOrEqual(minTargetPixels);
      expect(box?.height).toBeGreaterThanOrEqual(minTargetPixels);
    });

    test("links to the LinkedIn and GitHub profiles", async ({ homePage }) => {
      const header = homePage.header(locale.header);

      await expect(header.linkedInLink).toHaveAttribute(
        "href",
        profileUrls.linkedIn,
      );
      await expect(header.gitHubLink).toHaveAttribute(
        "href",
        profileUrls.gitHub,
      );
    });

    test("holds the language switch and the theme toggle", async ({
      homePage,
    }) => {
      const header = homePage.header(locale.header);

      await expect(
        header.banner.getByRole("navigation", {
          name: locale.languageSwitchName,
          exact: true,
        }),
      ).toBeVisible();
      await expect(header.themeToggle.button).toBeVisible();
    });
  });
}

for (const scheme of colorSchemes) {
  test.describe(`header mark in the ${scheme} theme`, () => {
    test.use({ colorScheme: scheme });

    test("draws two copper slashes and a pass-green cursor, hidden from assistive technology", async ({
      homePage,
    }) => {
      await homePage.open(englishPage.language.path);
      const header = homePage.header(englishPage.header);

      await expect(header.mark).toBeVisible();
      await expect(header.mark).toHaveAttribute("aria-hidden", "true");
      await expect(header.markSlashes).toHaveCount(2);
      for (const slash of await header.markSlashes.all()) {
        await expect(slash).toHaveCSS("stroke", logoInks[scheme].slashes);
      }
      await expect(header.markCursor).toHaveCSS(
        "stroke",
        logoInks[scheme].cursor,
      );
    });
  });
}

test.describe("header mark cursor", () => {
  test("blinks a few times, then stays solid within five seconds", async ({
    homePage,
  }) => {
    await homePage.open(englishPage.language.path);
    const header = homePage.header(englishPage.header);

    const blink = await header.cursorBlink();
    expect(blink.cycles, "blink cycles").toBeGreaterThan(1);
    expect(blink.endTime, "last blink ends").toBeLessThanOrEqual(
      maxBlinkMilliseconds,
    );
    await header.finishCursorBlink();
    await expect(header.markCursor).toHaveCSS("opacity", "1");
  });

  test.describe("under reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("never blinks", async ({ homePage }) => {
      await homePage.open(englishPage.language.path);
      const header = homePage.header(englishPage.header);

      expect((await header.cursorBlink()).animations).toBe(0);
      await expect(header.markCursor).toHaveCSS("opacity", "1");
    });
  });
});
