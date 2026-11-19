import { localeCases } from "./data/locales";
import { expect, test } from "./fixtures";
import { boxOf, scrollToTop } from "./support/pageState";

/** Longer than any usage takes to type: each one types in under five seconds. */
const wholeTypingMs = 5_000;

/** The layouts the lines must hold still in: one line per README line, and wrapped on phones. */
const layoutCases = [
  { layout: "desktop", viewport: { width: 1280, height: 720 } },
  { layout: "phone", viewport: { width: 390, height: 844 } },
] as const;

for (const locale of localeCases) {
  for (const { repository } of locale.openSource.repositories) {
    test.describe(`${locale.language.name} ${repository.name} usage typing`, () => {
      test("waits off-screen with its lines hidden, then types them once it comes into view", async ({
        homePage,
        frozenClock,
      }) => {
        await homePage.open(locale.language.path);
        const { terminal } = homePage
          .openSource(locale)
          .repository(repository.name);
        await terminal.expectTypingState("waiting");
        expect(await terminal.visibleText()).toBe("");
        expect(await terminal.allText()).toBe(repository.usage);

        await terminal.scrollIntoView();
        await terminal.waitForFirstKeystrokes(frozenClock);
        await terminal.expectTypingState("typing");
        const typed = await terminal.visibleText();
        expect(repository.usage.startsWith(typed)).toBe(true);
        expect(typed.length).toBeLessThan(repository.usage.length);

        await frozenClock.runFor(wholeTypingMs);
        await terminal.expectTypingState("done");
        expect(await terminal.visibleText()).toBe(repository.usage);
      });

      test("types only once: scrolled away and back, its lines stay", async ({
        homePage,
        page,
        frozenClock,
      }) => {
        await homePage.open(locale.language.path);
        const { terminal } = homePage
          .openSource(locale)
          .repository(repository.name);
        await terminal.scrollIntoView();
        await terminal.waitForFirstKeystrokes(frozenClock);
        await frozenClock.runFor(wholeTypingMs);

        await scrollToTop(page);
        await frozenClock.runFor(wholeTypingMs);
        await terminal.scrollIntoView();
        await frozenClock.runFor(wholeTypingMs);

        await terminal.expectTypingState("done");
        expect(await terminal.visibleText()).toBe(repository.usage);
      });

      test("switching to reduced motion while it types shows every line at once", async ({
        homePage,
        page,
        frozenClock,
      }) => {
        await homePage.open(locale.language.path);
        const { terminal } = homePage
          .openSource(locale)
          .repository(repository.name);
        await terminal.scrollIntoView();
        await terminal.waitForFirstKeystrokes(frozenClock);

        await page.emulateMedia({ reducedMotion: "reduce" });

        await terminal.expectTypingState("done");
        expect(await terminal.visibleText()).toBe(repository.usage);
      });
    });

    test.describe(`${locale.language.name} ${repository.name} usage typing in a tall window`, () => {
      // Tall enough that a terminal wholly in view can still sit in the window's lowest fifth.
      test.use({ viewport: { width: 1280, height: 1400 } });

      test("types once the terminal is wholly in view, even low in the window", async ({
        homePage,
        frozenClock,
      }) => {
        await homePage.open(locale.language.path);
        const { terminal } = homePage
          .openSource(locale)
          .repository(repository.name);

        await terminal.scrollIntoView("end");
        await terminal.waitForFirstKeystrokes(frozenClock);
        await frozenClock.runFor(wholeTypingMs);

        await terminal.expectTypingState("done");
        expect(await terminal.visibleText()).toBe(repository.usage);
      });
    });

    for (const { layout, viewport } of layoutCases) {
      test.describe(`${locale.language.name} ${repository.name} usage typing on a ${layout} layout`, () => {
        test.use({ viewport });

        test("keeps every character in place while it types, so nothing on the page moves", async ({
          homePage,
          frozenClock,
        }) => {
          await homePage.open(locale.language.path);
          const openSource = homePage.openSource(locale);
          const { terminal } = openSource.repository(repository.name);
          const section = openSource.region;
          await terminal.scrollIntoView();
          await terminal.waitForFirstKeystrokes(frozenClock);
          const whileTyping = {
            lines: await boxOf(terminal.lines),
            section: await boxOf(section),
          };

          await frozenClock.runFor(wholeTypingMs);

          await terminal.expectTypingState("done");
          expect(await boxOf(terminal.lines)).toEqual(whileTyping.lines);
          expect(await boxOf(section)).toEqual(whileTyping.section);
        });
      });
    }
  }

  test.describe(`${locale.language.name} usage terminal on screen as the page loads`, () => {
    test("is left as it is, every line shown, with nothing typed", async ({
      homePage,
      frozenClock,
    }) => {
      await homePage.open(locale.language.path);
      const [first] = homePage.openSource(locale).repositories;
      if (!first) throw new Error("The section lists no repository.");
      // A reload keeps the scroll position, so the page loads with the terminal on screen.
      await first.terminal.scrollIntoView();
      await homePage.reload();

      await first.terminal.expectTypingState("still");
      await frozenClock.runFor(wholeTypingMs);
      expect(await first.terminal.visibleText()).toBe(
        first.copy.repository.usage,
      );
    });
  });

  test.describe(`${locale.language.name} usage terminals with reduced motion`, () => {
    test.use({ reducedMotion: "reduce" });

    test("show every line at once and never type, even when they come into view", async ({
      homePage,
      frozenClock,
    }) => {
      await homePage.open(locale.language.path);

      for (const { copy, terminal } of homePage.openSource(locale)
        .repositories) {
        expect(await terminal.visibleText()).toBe(copy.repository.usage);
        await terminal.scrollIntoView();
        await frozenClock.runFor(wholeTypingMs);
        await terminal.expectNoTyping();
        expect(await terminal.visibleText()).toBe(copy.repository.usage);
      }
    });
  });
}
