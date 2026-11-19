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

export async function storedTheme(page: Page): Promise<string | null> {
  return page.evaluate(
    (key) => window.localStorage.getItem(key),
    themeStorageKey,
  );
}
