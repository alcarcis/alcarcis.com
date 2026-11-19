import { profileUrls } from "./data/externalLinks";
import { localeCases } from "./data/locales";
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
