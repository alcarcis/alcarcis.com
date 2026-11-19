import type { Page } from "@playwright/test";

export const themeStorageKey = "theme";

/** Makes every localStorage access throw, as browsers do when site data is blocked. */
export async function blockLocalStorage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("The operation is insecure.", "SecurityError");
      },
    });
  });
}

/**
 * Clears the localStorage of the page's site the way the browser's "clear site data" does.
 * Chromium then sends every open tab of the site a storage event with a null key, which a
 * localStorage.clear() call cannot do: it skips the tab that calls it. Chromium only (CDP).
 */
export async function clearSiteStorage(page: Page): Promise<void> {
  const session = await page.context().newCDPSession(page);
  await session.send("Storage.clearDataForOrigin", {
    origin: new URL(page.url()).origin,
    storageTypes: "local_storage",
  });
  await session.detach();
}

export async function storedTheme(page: Page): Promise<string | null> {
  return page.evaluate(
    (key) => window.localStorage.getItem(key),
    themeStorageKey,
  );
}
