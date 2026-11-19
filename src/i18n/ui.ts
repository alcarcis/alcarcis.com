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
  "hero.sub": "From requirements to production.",
  "hero.disciplines": "Quality Engineering · Agentic QA · Web, API & mobile",
  "hero.primaryAction": "Let's talk",
  "hero.cvAction": "Download CV (PDF)",
  "instrument.label": "Suite quality.spec.ts, test run",
  "instrument.sceneLabel": "Scene · QA at every stage",
  "instrument.stages": "Stages",
  "instrument.state.passed": "passed",
  "instrument.state.running": "running",
  "instrument.state.pending": "pending",
  "instrument.caption.requirements": "acceptance criteria made testable",
  "instrument.caption.design": "risks mapped before code",
  "instrument.caption.code": "tests written with the code",
  "instrument.caption.cicd": "the gate blocks DEF-01",
  "instrument.caption.fix": "fix merged, gate opens",
  "instrument.caption.production": "monitored, clean run",
  "instrument.skip": "Skip: show the finished run",
  "instrument.rerun": "Rerun: replay the test run",
  "instrument.announce.passed": "Test run passed",
} as const;

export type UiKey = keyof typeof en;

const es: Readonly<Record<UiKey, string>> = {
  "meta.title": "Carlos Alcalá · Quality Engineering",
  "meta.description":
    "Ingeniería de calidad de punta a punta: automatización de pruebas web, API y móvil, calidad en CI/CD y QA agéntico. De los requisitos a producción.",
  "a11y.skipToContent": "Ir al contenido",
  "header.backToTop": "ir al inicio",
  "header.linkedIn": "Perfil de LinkedIn",
  "header.gitHub": "Perfil de GitHub",
  "languageSwitch.label": "Selector de idioma",
  "themeToggle.toDark": "Cambiar al tema oscuro",
  "themeToggle.toLight": "Cambiar al tema claro",
  "home.displayLine": "Calidad, de punta a punta.",
  "hero.sub": "De los requisitos a producción.",
  "hero.disciplines": "Ingeniería de calidad · QA agéntico · Web, API y móvil",
  "hero.primaryAction": "Conversemos",
  "hero.cvAction": "Descargar CV (PDF)",
  "instrument.label": "Suite quality.spec.ts, ejecución de pruebas",
  "instrument.sceneLabel": "Escena · Calidad en cada etapa",
  "instrument.stages": "Etapas del desarrollo",
  "instrument.state.passed": "aprobada",
  "instrument.state.running": "en curso",
  "instrument.state.pending": "pendiente",
  "instrument.caption.requirements": "criterios de aceptación verificables",
  "instrument.caption.design": "riesgos identificados antes de programar",
  "instrument.caption.code": "pruebas escritas junto al código",
  "instrument.caption.cicd": "el quality gate bloquea DEF-01",
  "instrument.caption.fix": "corrección integrada, el gate se abre",
  "instrument.caption.production": "monitoreado, ejecución limpia",
  "instrument.skip": "Skip: ver el resultado final",
  "instrument.rerun": "Rerun: repetir la ejecución",
  "instrument.announce.passed": "Pruebas aprobadas",
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
