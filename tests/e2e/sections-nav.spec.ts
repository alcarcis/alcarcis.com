import { localeCases } from "./data/locales";
import {
  crowdedBarWidths,
  navLayouts,
  sectionAnchors,
} from "./data/sectionsNav";
import { expect, test } from "./fixtures";

for (const locale of localeCases) {
  const { path } = locale.language;

  test.describe(`${locale.language.name} sections nav, inline`, () => {
    test.use({ viewport: navLayouts.inline });

    test("links to each section by its English anchor, named in the page's language", async ({
      homePage,
    }) => {
      await homePage.open(path);

      await homePage.sectionsNav(locale).expectReadingOrder();
    });

    test("shows every link from 1200 px, with no menu button", async ({
      page,
      homePage,
    }) => {
      await page.setViewportSize(navLayouts.narrowestInline);
      await homePage.open(path);
      const nav = homePage.sectionsNav(locale);

      for (const anchor of sectionAnchors) {
        await expect(nav.link(anchor)).toBeVisible();
      }
      await expect(nav.menuButton).toBeHidden();
    });

    test("marks no section while the hero is in view", async ({ homePage }) => {
      await homePage.open(path);

      await homePage.sectionsNav(locale).expectCurrent(null);
    });

    for (const anchor of sectionAnchors) {
      test(`marks the link to #${anchor} while that section is in view`, async ({
        homePage,
      }) => {
        await homePage.open(`${path}#${anchor}`);

        await homePage.sectionsNav(locale).expectCurrent(anchor);
      });
    }

    test("marks Contact at the end of the page, and none again back at the top", async ({
      homePage,
    }) => {
      await homePage.open(path);
      const nav = homePage.sectionsNav(locale);

      await homePage.scrollToEnd();
      await nav.expectCurrent("contact");
      await homePage.scrollToTop();
      await nav.expectCurrent(null);
    });
  });

  test.describe(`${locale.language.name} sections menu`, () => {
    test.use({ viewport: navLayouts.widestMenu });

    test.beforeEach(async ({ homePage }) => {
      await homePage.open(path);
    });

    test("keeps the links behind a closed menu button below 1200 px", async ({
      homePage,
    }) => {
      const nav = homePage.sectionsNav(locale);

      await expect(nav.menuButton).toBeVisible();
      await nav.expectMenuExpanded(false);
      await expect(nav.list).toBeHidden();
    });

    test("opens on the button with every section link, and no profile links above phones", async ({
      homePage,
    }) => {
      const nav = homePage.sectionsNav(locale);

      await nav.openMenu();

      await nav.expectMenuExpanded(true);
      await nav.expectReadingOrder();
    });

    test("opens from the keyboard, then Escape closes it and returns focus to the button", async ({
      page,
      homePage,
    }) => {
      const nav = homePage.sectionsNav(locale);
      await nav.menuButton.focus();

      await page.keyboard.press("Enter");
      await expect(nav.list).toBeVisible();
      await page.keyboard.press("Tab");
      await expect(nav.link("about")).toBeFocused();
      await page.keyboard.press("Escape");

      await expect(nav.list).toBeHidden();
      await expect(nav.menuButton).toBeFocused();
      await nav.expectMenuExpanded(false);
    });

    test("closes when a link is activated, and the page moves to that section", async ({
      page,
      homePage,
    }) => {
      const nav = homePage.sectionsNav(locale);
      await nav.openMenu();

      await nav.link("work").click();

      await expect(nav.list).toBeHidden();
      await nav.expectMenuExpanded(false);
      await expect(page).toHaveURL(/#work$/);
      await nav.expectCurrent("work");
    });
  });

  test.describe(`${locale.language.name} sections menu on phones`, () => {
    test.use({ viewport: navLayouts.phone });

    test("takes in the profile links, which leave the bar", async ({
      homePage,
    }) => {
      await homePage.open(path);
      const header = homePage.header(locale.header);
      const nav = homePage.sectionsNav(locale);

      await expect(header.linkedInLink).toBeHidden();
      await expect(header.gitHubLink).toBeHidden();
      await nav.openMenu();

      await nav.expectReadingOrder({ withProfileLinks: true });
    });

    test("leaves the profile links in the bar from 480 px", async ({
      page,
      homePage,
    }) => {
      await page.setViewportSize(navLayouts.narrowestWithProfileIcons);
      await homePage.open(path);
      const header = homePage.header(locale.header);
      const nav = homePage.sectionsNav(locale);

      await expect(header.linkedInLink).toBeVisible();
      await expect(header.gitHubLink).toBeVisible();
      await nav.openMenu();

      await nav.expectReadingOrder();
    });
  });

  test.describe(`${locale.language.name} header bar with the sections nav`, () => {
    for (const width of crowdedBarWidths) {
      test(`fits a ${width} px viewport without scrolling sideways`, async ({
        page,
        homePage,
      }) => {
        await page.setViewportSize({ width, height: 800 });
        await homePage.open(path);

        expect(await homePage.sidewaysOverflow()).toBe(0);
      });
    }
  });

  test.describe(`${locale.language.name} sections nav without JavaScript`, () => {
    test.use({ javaScriptEnabled: false });

    test("shows the links inline on wide screens", async ({
      page,
      homePage,
    }) => {
      await page.setViewportSize(navLayouts.inline);
      await homePage.open(path);

      await homePage.sectionsNav(locale).expectReadingOrder();
    });

    test("still opens the menu on phones, with every link", async ({
      page,
      homePage,
    }) => {
      await page.setViewportSize(navLayouts.phone);
      await homePage.open(path);
      const nav = homePage.sectionsNav(locale);

      await nav.openMenu();

      await nav.expectReadingOrder({ withProfileLinks: true });
    });
  });
}
