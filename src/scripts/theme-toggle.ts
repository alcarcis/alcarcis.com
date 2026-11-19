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

let latestChange = 0;

/**
 * Turns transitions off while a theme change applies, so every colour swaps at once instead of
 * blending through mid-way colours that fail contrast (issue #24). The base stylesheet turns
 * data-theme-changing into `transition: none`, so the next style update commits the new colours
 * without transitions; the attribute comes off two frames later, when no colour changes any
 * more, so nothing transitions then either. A newer change keeps it on for itself.
 */
function holdTransitions(): void {
  const change = ++latestChange;
  root.dataset["themeChanging"] = "";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (change === latestChange) delete root.dataset["themeChanging"];
    });
  });
}

function applyTheme(theme: Theme | null): void {
  holdTransitions();
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

// The system preference flipped. While the page follows it, the stylesheet swaps the tokens by
// itself, and holds the transitions while the media query disagrees with the system theme
// recorded here: Chromium sends this event only after that swap. A browser that sends it first
// has the hold instead. With a theme pinned nothing changes, and holding costs nothing.
const recordSystemTheme = (): void => {
  root.dataset["systemTheme"] = systemTheme();
};
recordSystemTheme();
systemDark.addEventListener("change", () => {
  holdTransitions();
  recordSystemTheme();
});
