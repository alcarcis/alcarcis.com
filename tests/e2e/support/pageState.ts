import type { Page } from "@playwright/test";

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

export async function scrollToTop(page: Page): Promise<void> {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
}
