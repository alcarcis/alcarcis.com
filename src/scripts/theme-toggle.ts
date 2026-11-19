/*
 * Theme toggle. Two states: follow the system preference, or an override of the opposite
 * theme, stored in localStorage (no cookies). The pre-paint script in BaseLayout applies a
 * stored override before the first paint; this script only handles changes.
 */

import { themeStorageKey } from "../lib/theme";

type Theme = "light" | "dark";

const root = document.documentElement;
const colorSchemeMeta = document.querySelector<HTMLMetaElement>(
  'meta[name="color-scheme"]',
);
const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

const isTheme = (value: unknown): value is Theme =>
  value === "light" || value === "dark";

const systemTheme = (): Theme => (systemDark.matches ? "dark" : "light");

function storedTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem(themeStorageKey);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

function storeTheme(theme: Theme | null): void {
  try {
    if (theme === null) window.localStorage.removeItem(themeStorageKey);
    else window.localStorage.setItem(themeStorageKey, theme);
  } catch {
    // Storage can be blocked; the choice then lasts as long as the page.
  }
}

function applyTheme(theme: Theme | null): void {
  if (theme === null) delete root.dataset["theme"];
  else root.dataset["theme"] = theme;
  colorSchemeMeta?.setAttribute("content", theme ?? "light dark");
}

function renderedTheme(): Theme {
  const pinned = root.dataset["theme"];
  return isTheme(pinned) ? pinned : systemTheme();
}

for (const toggle of document.querySelectorAll("[data-theme-toggle]")) {
  toggle.addEventListener("click", () => {
    const target: Theme = renderedTheme() === "dark" ? "light" : "dark";
    // Picking the system's own theme undoes the override instead of pinning it, so the page
    // keeps following the system from then on.
    const override = target === systemTheme() ? null : target;
    storeTheme(override);
    applyTheme(override);
  });
}

// Another tab changed the choice, or the site's storage was cleared (a null key).
window.addEventListener("storage", (event) => {
  if (event.key === themeStorageKey || event.key === null) {
    applyTheme(storedTheme());
  }
});
