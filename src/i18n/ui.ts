import { getAbsoluteLocaleUrl, getRelativeLocaleUrl } from "astro:i18n";

export const locales = ["en", "es"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

interface LanguageLabel {
  readonly code: string;
  readonly name: string;
}

export const languages: Readonly<Record<Locale, LanguageLabel>> = {
  en: { code: "EN", name: "English" },
  es: { code: "ES", name: "Español" },
};

const en = {
  "meta.title": "Carlos Alcalá · Quality Engineering",
  "meta.description":
    "Quality engineering end to end: test automation for web, API and mobile, quality in CI/CD and agentic QA. From requirements to production.",
  "a11y.skipToContent": "Skip to content",
  "header.backToTop": "back to top",
  "header.linkedIn": "LinkedIn profile",
  "header.gitHub": "GitHub profile",
  "languageSwitch.label": "Language",
  "themeToggle.toDark": "Switch to dark theme",
  "themeToggle.toLight": "Switch to light theme",
  "home.displayLine": "Quality, end to end.",
} as const;

export type UiKey = keyof typeof en;

const es: Readonly<Record<UiKey, string>> = {
  "meta.title": "Carlos Alcalá · Ingeniería de calidad",
  "meta.description":
    "Ingeniería de calidad de punta a punta: automatización de pruebas web, API y móvil, calidad en CI/CD y QA agéntico. De los requisitos a producción.",
  "a11y.skipToContent": "Saltar al contenido",
  "header.backToTop": "volver al inicio",
  "header.linkedIn": "Perfil de LinkedIn",
  "header.gitHub": "Perfil de GitHub",
  "languageSwitch.label": "Idioma",
  "themeToggle.toDark": "Cambiar al tema oscuro",
  "themeToggle.toLight": "Cambiar al tema claro",
  "home.displayLine": "Calidad, de punta a punta.",
};

const ui: Readonly<Record<Locale, Readonly<Record<UiKey, string>>>> = {
  en,
  es,
};

export function useTranslations(locale: Locale): (key: UiKey) => string {
  return (key) => ui[locale][key];
}

export function localizedPath(locale: Locale, path = ""): string {
  return getRelativeLocaleUrl(locale, path);
}

export function localizedUrl(locale: Locale, path = ""): string {
  return getAbsoluteLocaleUrl(locale, path);
}
