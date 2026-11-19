import { anchors, emailAddress, reportShown } from "./data/contact";
import { contactEmailHref, localeCases } from "./data/locales";
import { expect, test } from "./fixtures";
import { clipboardRefusals } from "./support/clipboard";

for (const locale of localeCases) {
  test.describe(`${locale.language.name} Contact section`, () => {
    test.beforeEach(async ({ homePage }) => {
      await homePage.open(locale.language.path);
    });

    test("is a region named by its title, opened by its test case code", async ({
      homePage,
    }) => {
      await homePage.contact(locale).head.expectShown();
    });

    test("reads the address, its copy button, the profile and CV rows, then the report on how this site is tested", async ({
      homePage,
    }) => {
      await homePage.contact(locale).expectReadingOrder();
    });

    test("shows the address as the link itself, which opens an email, and the copy button names it", async ({
      homePage,
    }) => {
      const contact = homePage.contact(locale);

      await expect(contact.emailLink).toBeVisible();
      await expect(contact.emailLink).toHaveAttribute("href", contactEmailHref);
      await expect(contact.copyButton).toHaveAccessibleDescription(
        emailAddress,
      );
    });

    test("keeps the English anchors of every page for itself and its report", async ({
      homePage,
    }) => {
      const contact = homePage.contact(locale);

      await expect(contact.region).toHaveId(anchors.contact);
      await expect(contact.report.region).toHaveId(anchors.report);
    });
  });

  test.describe(`${locale.language.name} Contact copy button`, () => {
    test("copies the address, says so, then shows its label again", async ({
      homePage,
      clipboard,
      frozenClock,
    }) => {
      await clipboard.grant();
      await homePage.open(locale.language.path);
      const contact = homePage.contact(locale);

      await contact.copyAddress();

      expect(await clipboard.read()).toBe(emailAddress);
      await contact.expectReported("copied");
      await frozenClock.runFor(reportShown.copied.stillAtMs);
      await contact.expectReported("copied");
      await frozenClock.runFor(
        reportShown.copied.goneByMs - reportShown.copied.stillAtMs,
      );
      await contact.expectAtRest();
    });

    for (const refusal of clipboardRefusals) {
      test(`when the clipboard ${refusal.description}, selects the address and says how to copy it`, async ({
        homePage,
        clipboard,
        frozenClock,
      }) => {
        await refusal.apply(clipboard);
        await homePage.open(locale.language.path);
        const contact = homePage.contact(locale);

        await contact.copyAddress();

        expect(await contact.selectedText()).toBe(emailAddress);
        await contact.expectReported("selected");
        await frozenClock.runFor(reportShown.selected.stillAtMs);
        await contact.expectReported("selected");
        await frozenClock.runFor(
          reportShown.selected.goneByMs - reportShown.selected.stillAtMs,
        );
        await contact.expectAtRest();
      });
    }
  });
}
