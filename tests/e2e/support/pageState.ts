import type { Locator, Page } from "@playwright/test";

/** Pretends the tab went to the background (or came back), as the Page Visibility API reports. */
export async function setTabHidden(page: Page, hidden: boolean): Promise<void> {
  await page.evaluate((isHidden) => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => isHidden,
    });
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => (isHidden ? "hidden" : "visible"),
    });
    document.dispatchEvent(new Event("visibilitychange"));
  }, hidden);
}

/**
 * Adds room below the page so the hero can scroll out of view, as the sections that follow it
 * will. Test-only: the hero is the page's only section for now.
 */
export async function addRoomBelow(page: Page, pixels: number): Promise<void> {
  await page.evaluate((height) => {
    const room = document.createElement("div");
    room.style.blockSize = `${height}px`;
    document.body.append(room);
  }, pixels);
}

export async function scrollToBottom(page: Page): Promise<void> {
  await page.evaluate(() =>
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "instant",
    }),
  );
}

/**
 * Changes the device pixel ratio and keeps the viewport's CSS size, as moving the window to a
 * denser screen does: no resize event, and `(resolution)` media queries change. Chromium only:
 * it goes through the DevTools protocol, whose ratio override does not evaluate media queries
 * again by itself. A change of emulated media type does, so the screen type is set and cleared.
 */
export async function setDevicePixelRatio(
  page: Page,
  ratio: number,
): Promise<void> {
  const viewport = page.viewportSize();
  if (!viewport)
    throw new Error("A device pixel ratio needs a fixed viewport.");
  const session = await page.context().newCDPSession(page);
  await session.send("Emulation.setDeviceMetricsOverride", {
    ...viewport,
    deviceScaleFactor: ratio,
    mobile: false,
  });
  for (const media of ["screen", ""]) {
    await session.send("Emulation.setEmulatedMedia", { media });
  }
}

/** What a page without MutationObserver throws when a script builds one. */
export const missingMutationObserver = "MutationObserver is not available";

/** Removes MutationObserver before the page's scripts run, as a browser without it would. */
export async function removeMutationObserver(page: Page): Promise<void> {
  await page.addInitScript((message) => {
    Object.defineProperty(window, "MutationObserver", {
      configurable: true,
      value: class {
        constructor() {
          throw new Error(message);
        }
      },
    });
  }, missingMutationObserver);
}

/**
 * The types of the event listeners registered on window and on document, sorted. Chromium
 * only: it reads them through the DevTools protocol.
 */
export async function windowAndDocumentListeners(
  page: Page,
): Promise<string[]> {
  const session = await page.context().newCDPSession(page);
  try {
    const types: string[] = [];
    for (const target of ["window", "document"]) {
      const { result } = await session.send("Runtime.evaluate", {
        expression: target,
      });
      if (!result.objectId) throw new Error(`No remote object for ${target}.`);
      const { listeners } = await session.send(
        "DOMDebugger.getEventListeners",
        { objectId: result.objectId },
      );
      types.push(...listeners.map(({ type }) => `${target} ${type}`));
    }
    return types.sort();
  } finally {
    await session.detach();
  }
}

export async function scrollToTop(page: Page): Promise<void> {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
}

/** Where an element sits in the viewport, in CSS pixels; it fails when the element is not rendered. */
export async function boxOf(
  locator: Locator,
): Promise<{ x: number; y: number; width: number; height: number }> {
  const box = await locator.boundingBox();
  if (!box) throw new Error(`${locator} is not rendered.`);
  return box;
}

/**
 * Counts, from before the page's scripts run, the IntersectionObservers set to watch an element
 * matching `selector`. Read the count with `viewWatchers`.
 */
export async function countViewWatchers(
  page: Page,
  selector: string,
): Promise<void> {
  await page.addInitScript((watched) => {
    const Native = window.IntersectionObserver;
    const counted = new WeakSet<IntersectionObserver>();
    const tally = { count: 0 };
    Object.defineProperty(window, "__viewWatchers", { value: tally });
    window.IntersectionObserver = class extends Native {
      override observe(target: Element): void {
        if (!counted.has(this) && target.matches(watched)) {
          counted.add(this);
          tally.count++;
        }
        super.observe(target);
      }
    };
  }, selector);
}

/** How many observers `countViewWatchers` has seen watch its element so far. */
export async function viewWatchers(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      (window as unknown as { __viewWatchers: { count: number } })
        .__viewWatchers.count,
  );
}

/**
 * Resizes the viewport and waits until the page has handled the resize event. A request for the
 * current size fires no resize event, so it returns at once.
 */
export async function resizeViewport(
  page: Page,
  size: { width: number; height: number },
): Promise<void> {
  const current = page.viewportSize();
  if (current?.width === size.width && current.height === size.height) return;
  const handled = page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        addEventListener("resize", () => resolve(), { once: true }),
      ),
  );
  await page.setViewportSize(size);
  await handled;
}
