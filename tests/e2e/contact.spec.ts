import {
  addressLines,
  anchors,
  emailAddress,
  reportShown,
} from "./data/contact";
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

    test("reads the address, its copy button and the CV link, then the certificate of how this site is tested", async ({
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

    test("keeps the English anchors of every page for itself and its certificate", async ({
      homePage,
    }) => {
      const contact = homePage.contact(locale);

      await expect(contact.region).toHaveId(anchors.contact);
      await expect(contact.certificate.region).toHaveId(anchors.report);
    });

    test("shows the copy button at rest as a copy icon in brackets, named for the address", async ({
      homePage,
    }) => {
      const contact = homePage.contact(locale);

      await expect(contact.copyButton).toHaveAccessibleName(
        locale.contact.copyLabels.idle,
      );
      await expect(contact.copyIcon).toBeVisible();
      await expect(contact.copyIcon).toHaveAttribute("aria-hidden", "true");
      await expect(contact.checkIcon).toBeHidden();
      expect(await contact.isVisuallyHidden(contact.copyLabel)).toBe(true);
    });

    test("offers the CV as a PDF beside copy: a download icon and its words, named to download it", async ({
      homePage,
    }) => {
      const { cvLink, separator } = homePage.contact(locale);
      const { cv } = locale.contact;

      await expect(cvLink).toHaveAttribute("href", cv.url);
      await expect(cvLink).toHaveAttribute("type", "application/pdf");
      await expect(cvLink.getByText(cv.label, { exact: true })).toBeVisible();
      await expect(cvLink.getByText(cv.label, { exact: true })).toHaveCSS(
        "text-decoration-line",
        "underline",
      );
      await expect(cvLink.locator('svg[data-icon="download"]')).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      await expect(separator).toBeVisible();
      await expect(separator).toHaveAttribute("aria-hidden", "true");
    });
  });

  for (const { width, oneLine } of addressLines) {
    test.describe(`${locale.language.name} Contact ${width}px wide`, () => {
      test.use({ viewport: { width, height: 900 } });

      test.beforeEach(async ({ homePage }) => {
        await homePage.open(locale.language.path);
      });

      test(`centres the address line and the certificate below it in one column${oneLine ? "" : ", the actions under the address"}`, async ({
        homePage,
      }) => {
        const { content, email, actions, certificate } = await homePage
          .contact(locale)
          .layout();
        const centred = (centerX: number): void =>
          expect(Math.abs(centerX - content.centerX)).toBeLessThan(2);

        centred(certificate.centerX);
        expect(certificate.top).toBeGreaterThan(
          Math.max(email.bottom, actions.bottom),
        );
        if (oneLine) {
          centred((email.left + actions.right) / 2);
          expect(actions.left).toBeGreaterThan(email.right);
          expect(actions.top).toBeLessThan(email.bottom);
        } else {
          centred(email.centerX);
          centred(actions.centerX);
          expect(actions.top).toBeGreaterThanOrEqual(email.bottom - 1);
        }
      });

      test("keeps both actions at least a full target tall", async ({
        homePage,
      }) => {
        const { copyButton, cvLink } = homePage.contact(locale);
        const targetMin = width < 960 ? 44 : 40;

        for (const action of [copyButton, cvLink]) {
          const box = await action.boundingBox();
          expect(box?.height ?? 0).toBeGreaterThanOrEqual(targetMin);
        }
      });
    });
  }

  for (const width of [390, 1440]) {
    test.describe(`${locale.language.name} Contact address ${width}px wide`, () => {
      test.use({ viewport: { width, height: 900 } });

      test("is set at the size of the hero's second line", async ({
        homePage,
      }) => {
        await homePage.open(locale.language.path);
        const displayLineSize = await homePage
          .hero(locale)
          .displayLine.evaluate((line) =>
            parseFloat(getComputedStyle(line).fontSize),
          );

        expect(await homePage.contact(locale).addressFontSize()).toBe(
          displayLineSize,
        );
      });
    });
  }

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
      // The outcome shows in words: a check and "copied" in pass green, in place of the icon.
      await expect(contact.checkIcon).toBeVisible();
      await expect(contact.copyIcon).toBeHidden();
      await expect(contact.copyLabel).toHaveText(
        locale.contact.copyLabels.copied,
      );
      expect(await contact.isVisuallyHidden(contact.copyLabel)).toBe(false);
      // The colour eases in, so this waits for it to settle on pass green.
      await expect(contact.copyLabel).toHaveCSS(
        "color",
        await contact.passColour(),
      );
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
        // Words only: the visitor is told what to do, with no icon.
        await expect(contact.copyLabel).toHaveText(
          locale.contact.copyLabels.selected,
        );
        expect(await contact.isVisuallyHidden(contact.copyLabel)).toBe(false);
        await expect(contact.copyIcon).toBeHidden();
        await expect(contact.checkIcon).toBeHidden();
        await frozenClock.runFor(reportShown.selected.stillAtMs);
        await contact.expectReported("selected");
        await frozenClock.runFor(
          reportShown.selected.goneByMs - reportShown.selected.stillAtMs,
        );
        await contact.expectAtRest();
      });
    }
  });

  test.describe(`${locale.language.name} Contact without JavaScript`, () => {
    test.use({ javaScriptEnabled: false });

    test("offers no copy button it cannot run, only the address and CV links", async ({
      homePage,
    }) => {
      await homePage.open(locale.language.path);
      const contact = homePage.contact(locale);

      await expect(contact.emailLink).toBeVisible();
      await expect(contact.cvLink).toBeVisible();
      await expect(contact.separator).toBeHidden();
      // The button is in the page and hidden by the stylesheet, not missing from it.
      await expect(
        contact.region.getByRole("button", { includeHidden: true }),
      ).toHaveCount(1);
      await expect(contact.copyButton).toBeHidden();
    });
  });
}
