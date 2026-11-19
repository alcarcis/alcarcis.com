import { unsizedCanvas } from "./components/GlyphField";
import { emptyLine, fullLine } from "./components/ReadingProgress";
import {
  finalSceneTime,
  glyphRendererUrl,
  runStatus,
  specSource,
  stageNames,
} from "./data/instrument";
import { englishPage, localeCases } from "./data/locales";
import { expect, test } from "./fixtures";
import {
  addRoomBelow,
  missingMutationObserver,
  removeMutationObserver,
  scrollToBottom,
  scrollToTop,
  setDevicePixelRatio,
  setTabHidden,
  windowAndDocumentListeners,
} from "./support/pageState";

/** Longer than any whole run: typing, five stages and the closing pause. */
const wholeRunMs = 15_000;
const stepMs = 100;
/** The first run starts once 40% of the instrument, or three quarters of the viewport, shows. */
const startShare = 0.4;
const startCover = 0.75;
/**
 * Which rule starts the first run, by viewport: on a phone on its side 40% of the instrument
 * comes first; with the keyboard up it never fits, and three quarters of the viewport does.
 */
const startRuleCases = [
  {
    rule: "40% of the instrument",
    viewport: { width: 844, height: 420 },
    firstRule: "share",
  },
  {
    rule: "three quarters of the viewport",
    viewport: { width: 844, height: 240 },
    firstRule: "cover",
  },
] as const;

for (const locale of localeCases) {
  test.describe(`${locale.language.name} instrument run`, () => {
    test.beforeEach(async ({ homePage, frozenClock }) => {
      await homePage.open(locale.language.path);
      await homePage.hero(locale).instrument.startRun(frozenClock);
    });

    test("types the spec once after load, then plays every stage to Passed", async ({
      homePage,
      frozenClock,
    }) => {
      const { instrument } = homePage.hero(locale);
      await expect(instrument.status).toHaveText(runStatus.running);
      await expect(instrument.skip).toBeVisible();

      await frozenClock.runFor(700);
      const typed = (await instrument.typedCode.textContent()) ?? "";
      expect(typed.length).toBeGreaterThan(0);
      expect(typed.length).toBeLessThan(specSource.length);

      await frozenClock.runFor(wholeRunMs);
      await instrument.expectFinalFrame();
      await expect(instrument.skip).toBeHidden();

      await frozenClock.runFor(wholeRunMs);
      await instrument.expectFinalFrame();
    });

    test("the running row and the scene caption move together, one stage at a time", async ({
      homePage,
      frozenClock,
    }) => {
      const { instrument } = homePage.hero(locale);
      const runningOrder: number[] = [];
      let sawTheFix = false;

      for (let elapsed = 0; elapsed < wholeRunMs; elapsed += stepMs) {
        await frozenClock.runFor(stepMs);
        const now = await instrument.snapshot();
        const running = now.stages.indexOf("running");
        if (running < 0) continue;

        expect(now.stages.filter((state) => state === "running")).toHaveLength(
          1,
        );
        expect(now.captionShown).toBe(true);
        expect([
          instrument.captionFor(running),
          instrument.captionFor(running, true),
        ]).toContain(now.caption);
        sawTheFix ||= now.caption === instrument.captionFor(running, true);
        if (runningOrder.at(-1) !== running) runningOrder.push(running);
      }

      expect(runningOrder).toEqual(stageNames.map((_, index) => index));
      expect(sawTheFix).toBe(true);
      await instrument.expectFinalFrame();
    });

    test("Skip shows the finished run at once and hands focus to Rerun", async ({
      homePage,
      frozenClock,
    }) => {
      const { instrument } = homePage.hero(locale);
      await frozenClock.runFor(500);

      await instrument.skip.click();

      await instrument.expectFinalFrame();
      await expect(instrument.skip).toBeHidden();
      await expect(instrument.rerun).toBeFocused();
    });

    test("Rerun replays the run, ends Passed and announces it politely", async ({
      homePage,
      frozenClock,
    }) => {
      const { instrument } = homePage.hero(locale);
      await instrument.skip.click();

      await instrument.rerun.click();
      await expect(instrument.status).toHaveText(runStatus.running);
      await expect(instrument.rerun).toHaveAttribute("aria-disabled", "true");
      await frozenClock.runFor(stepMs);
      await instrument.expectStages(stageNames.map(() => "pending"));

      await frozenClock.runFor(wholeRunMs);
      await instrument.expectFinalFrame();
      await expect(instrument.rerun).toHaveAttribute("aria-disabled", "false");
      await expect(instrument.announcement).toHaveText(
        locale.instrument.passedAnnouncement,
      );
    });
  });

  test.describe(`${locale.language.name} instrument under reduced motion`, () => {
    test.use({ reducedMotion: "reduce" });

    test("shows the final frame at once and never types", async ({
      homePage,
      frozenClock,
    }) => {
      const { instrument } = homePage.hero(locale);
      await homePage.open(locale.language.path);
      await instrument.expectFinalFrame();

      for (let elapsed = 0; elapsed < 3_000; elapsed += stepMs) {
        await frozenClock.runFor(stepMs);
        await expect(instrument.typedCode).toHaveText(specSource);
        await expect(instrument.status).toHaveText(runStatus.passed);
      }
      await expect(instrument.skip).toBeHidden();
    });

    test("Rerun shows Running for a moment, then Passed, without typing", async ({
      homePage,
      frozenClock,
    }) => {
      const { instrument } = homePage.hero(locale);
      await homePage.open(locale.language.path);

      await instrument.rerun.click();
      await expect(instrument.status).toHaveText(runStatus.running);
      await frozenClock.runFor(300);
      await expect(instrument.typedCode).toHaveText(specSource);

      await frozenClock.runFor(500);
      await instrument.expectFinalFrame();
      await expect(instrument.announcement).toHaveText(
        locale.instrument.passedAnnouncement,
      );
    });
  });
}

test.describe("instrument run budget", () => {
  test("pauses while the instrument is scrolled out of view", async ({
    homePage,
    page,
    frozenClock,
  }) => {
    const { instrument } = homePage.hero(englishPage);
    await homePage.open(englishPage.language.path);
    await instrument.startRun(frozenClock);
    await frozenClock.runFor(700);
    const typedBefore = await instrument.typedCode.textContent();

    await addRoomBelow(page, 3_000);
    await scrollToBottom(page);
    await instrument.expectRunState("paused");
    await frozenClock.runFor(wholeRunMs);
    await scrollToTop(page);
    await instrument.expectRunState("playing");

    await expect(instrument.status).toHaveText(runStatus.running);
    await expect(instrument.typedCode).toHaveText(typedBefore ?? "");
    await frozenClock.runFor(wholeRunMs);
    await instrument.expectFinalFrame();
  });

  test("pauses while the tab is hidden", async ({
    homePage,
    page,
    frozenClock,
  }) => {
    const { instrument } = homePage.hero(englishPage);
    await homePage.open(englishPage.language.path);
    await instrument.startRun(frozenClock);
    await frozenClock.runFor(700);
    const typedBefore = await instrument.typedCode.textContent();

    await setTabHidden(page, true);
    await instrument.expectRunState("paused");
    await frozenClock.runFor(wholeRunMs);
    await setTabHidden(page, false);

    await instrument.expectRunState("playing");
    await expect(instrument.status).toHaveText(runStatus.running);
    await expect(instrument.typedCode).toHaveText(typedBefore ?? "");
  });

  test("loads the glyph renderer only once the page is idle, and it draws without console errors", async ({
    homePage,
    page,
    frozenClock,
    consoleErrors,
  }) => {
    const { instrument } = homePage.hero(englishPage);
    const rendererRequests: string[] = [];
    page.on("request", (request) => {
      if (glyphRendererUrl.test(request.url()))
        rendererRequests.push(request.url());
    });

    await homePage.open(englishPage.language.path);
    expect(rendererRequests).toEqual([]);

    await instrument.waitForSceneDrawn(frozenClock);
    expect(rendererRequests).toHaveLength(1);

    await frozenClock.runFor(wholeRunMs);
    await instrument.expectFinalFrame();
    expect(consoleErrors.report()).toHaveNoConsoleErrors();
  });

  test.describe("under reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("the text frame shows until the renderer draws the run's final frame, which it draws first", async ({
      homePage,
      frozenClock,
    }) => {
      const { instrument } = homePage.hero(englishPage);
      await homePage.open(englishPage.language.path);

      // Sized, the scene waits while the renderer boots the grain, before the run draws it.
      await instrument.waitForSceneSized(frozenClock);
      await instrument.settleSceneObservers();
      await expect(instrument.textFrame).toBeVisible();
      await expect(instrument.scene).not.toHaveAttribute("data-drawn");

      await instrument.waitForSceneDrawn(frozenClock);
      await expect(instrument.scene).toHaveAttribute(
        "data-drawn",
        String(finalSceneTime),
      );
    });
  });
});

test.describe("instrument resilience", () => {
  test("keeps its text frame and plays, skips and reruns the run when the glyph renderer cannot load", async ({
    homePage,
    page,
    frozenClock,
    consoleErrors,
  }) => {
    const { instrument } = homePage.hero(englishPage);
    const blockedRequests: string[] = [];
    await page.route(glyphRendererUrl, async (route) => {
      blockedRequests.push(route.request().url());
      // Cancelled, so the import fails without the browser's own "Failed to load resource" line,
      // which it prints for other network errors and no page code can prevent.
      await route.abort("aborted");
    });

    await homePage.open(englishPage.language.path);
    await instrument.startRun(frozenClock);
    await expect
      .poll(async () => {
        await frozenClock.runFor(stepMs);
        return blockedRequests.length;
      })
      .toBe(1);

    await frozenClock.runFor(wholeRunMs);
    await instrument.expectFinalFrame();
    await expect(instrument.textFrame).toBeVisible();

    await instrument.rerun.click();
    await expect(instrument.status).toHaveText(runStatus.running);
    await frozenClock.runFor(700);
    await instrument.skip.click();
    await instrument.expectFinalFrame();
    await expect(instrument.textFrame).toBeVisible();
    expect(consoleErrors.report()).toHaveNoConsoleErrors();
  });

  test("reports a renderer that fails while mounting, takes down its layers and listeners, and plays the run with the text frame", async ({
    homePage,
    page,
    frozenClock,
    consoleErrors,
  }) => {
    const { instrument } = homePage.hero(englishPage);
    // The renderer mounts the scene and the grain, then fails when it starts watching the theme.
    await removeMutationObserver(page);
    await homePage.open(englishPage.language.path);
    const listenersWithoutRenderer = await windowAndDocumentListeners(page);

    await instrument.startRun(frozenClock);
    await expect
      .poll(async () => {
        await frozenClock.runFor(stepMs);
        return consoleErrors.report().errors.length;
      })
      .toBeGreaterThan(0);

    expect(consoleErrors.report().errors).toEqual([
      expect.objectContaining({
        kind: "uncaught exception",
        text: `Error: ${missingMutationObserver}`,
      }),
    ]);
    expect(await windowAndDocumentListeners(page)).toEqual(
      listenersWithoutRenderer,
    );
    expect(await homePage.glyphField.buffer()).toEqual(unsizedCanvas);
    await frozenClock.runFor(wholeRunMs);
    await instrument.expectFinalFrame();
    await expect(instrument.textFrame).toBeVisible();
  });

  test("redraws the scene at each new device pixel ratio", async ({
    homePage,
    page,
    frozenClock,
  }) => {
    const { instrument } = homePage.hero(englishPage);
    await homePage.open(englishPage.language.path);
    await instrument.waitForSceneDrawn(frozenClock);
    expect(await instrument.sceneCanvasScale()).toEqual({ across: 1, down: 1 });

    // The run draws the scene once the renderer has mounted, so it already watches the ratio;
    // the second change reaches it only if its watcher re-armed itself after the first.
    for (const ratio of [2, 1]) {
      await setDevicePixelRatio(page, ratio);

      await expect
        .poll(async () => {
          await frozenClock.runFor(stepMs);
          return instrument.sceneCanvasScale();
        })
        .toEqual({ across: ratio, down: ratio });
    }
  });

  test("catches up on a pixel ratio change while the renderer is still booting", async ({
    homePage,
    page,
    frozenClock,
  }) => {
    const { instrument } = homePage.hero(englishPage);
    await homePage.open(englishPage.language.path);
    // The playing run keeps timers pending, so each of the renderer's idle slices takes 50 ms.
    await instrument.startRun(frozenClock);
    await instrument.waitForSceneSized(frozenClock);
    expect(await instrument.sceneCanvasScale()).toEqual({ across: 1, down: 1 });

    // Three slices before the renderer watches the pixel ratio.
    await setDevicePixelRatio(page, 2);

    await expect
      .poll(async () => {
        await frozenClock.runFor(stepMs);
        return instrument.sceneCanvasScale();
      })
      .toEqual({ across: 2, down: 2 });
  });

  for (const { rule, viewport, firstRule } of startRuleCases) {
    test.describe(`on a ${viewport.width} × ${viewport.height} viewport`, () => {
      test.use({ viewport });

      test(`waits while too little of the instrument shows, then starts on ${rule}`, async ({
        homePage,
        frozenClock,
      }) => {
        const { instrument } = homePage.hero(englishPage);
        await homePage.open(englishPage.language.path);
        const shown = {
          share: startShare * (await instrument.height()),
          cover: startCover * viewport.height,
        };
        const first = shown[firstRule];
        const other = shown[firstRule === "share" ? "cover" : "share"];
        expect(first).toBeLessThan(other);
        await frozenClock.runFor(stepMs);

        await instrument.scrollToShow(first / 2);
        await instrument.expectRunState("waiting");

        await instrument.scrollToShow(
          (first + Math.min(other, viewport.height)) / 2,
        );
        await instrument.expectRunState("playing");
      });
    });
  }
});

test.describe("reading progress", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the line along the bottom fills as the visitor scrolls down", async ({
    homePage,
    page,
  }) => {
    await homePage.open(englishPage.language.path);
    await expect(homePage.readingProgress.fill).toHaveCSS(
      "transform",
      emptyLine,
    );

    await scrollToBottom(page);

    await expect(homePage.readingProgress.fill).toHaveCSS(
      "transform",
      fullLine,
    );
  });

  test.describe("under reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("the line stays still", async ({ homePage, page }) => {
      await homePage.open(englishPage.language.path);

      await scrollToBottom(page);

      await expect(homePage.readingProgress.fill).toHaveCSS(
        "transform",
        emptyLine,
      );
    });
  });
});
