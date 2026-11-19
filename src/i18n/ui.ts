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
  "sectionsNav.label": "Sections",
  "sectionsNav.menu": "Sections menu",
  "sectionsNav.about": "About",
  "sectionsNav.work": "Work",
  "sectionsNav.openSource": "Open source",
  "sectionsNav.tools": "Tools",
  "sectionsNav.contact": "Contact",
  "languageSwitch.label": "Language",
  "themeToggle.toDark": "Switch to dark theme",
  "themeToggle.toLight": "Switch to light theme",
  "home.displayLine": "Quality, end to end.",
  "hero.sub": "From requirements to production.",
  "hero.disciplines": "Quality Engineering · Agentic QA · Web, API & mobile",
  "hero.primaryAction": "Let's talk",
  "hero.cvAction": "Download CV (PDF)",
  "hero.reportNote": "This site is tested on every pull request",
  "hero.reportAction": "see the report",
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
  "sectionHead.testCase": "Test case",
  "about.title": "About",
  "about.lead":
    "Quality isn't a filter: it lives in every stage of development.",
  "about.experience":
    "I work in financial services (private banking and wealth management), where I conceived my team's first institutional automation framework and taught a manual-testing team to work with it. Within three months every QA had at least one automated flow.",
  "about.practice":
    "Today I automate web, API and mobile apps (Playwright, TypeScript, Maestro), build tests to work as a quality gate in CI, and work with agents that generate, run and repair tests autonomously; I validate findings before they are reported.",
  "work.title": "What I work on",
  "work.frameworks.title": "Test automation frameworks",
  "work.frameworks.description":
    "Layered Playwright + TypeScript architecture with atomic test cases, reusable components, linting, hooks, documented architecture decisions and runbooks.",
  "work.platforms.title": "Web, API & mobile",
  "work.platforms.description":
    "End-to-end flows across modern and legacy platforms, API coverage with reusable sessions, and mobile tests with Maestro (previously Appium).",
  "work.cicd.title": "Quality in CI/CD",
  "work.cicd.description":
    "GitHub Actions workflows that act as a quality gate: a failing test blocks the merge.",
  "work.agentic.title": "Agentic QA",
  "work.agentic.description":
    "Agents that generate, run and repair BDD tests autonomously. I validate findings before they are reported, to keep false positives out of bug reports.",
  "work.testManagement.title": "Test management integration",
  "work.testManagement.description":
    "Reusable tooling between test frameworks and Xray / Jira.",
  "openSource.title": "Open source",
  "openSource.playwrightCiReference.description":
    "A small, complete reference of how a test suite becomes a quality gate: layered Playwright tests and a CI pipeline on GitHub-hosted runners.",
  "openSource.playwrightCiReference.usageSource": "run it locally",
  "openSource.playwrightCiReference.usageSummary":
    "Usage from the README, run it locally: npm ci; npx playwright install chromium; npm run check, which runs lint, format, typecheck and all tests; npm run report, which opens the last HTML report.",
  "openSource.pw2xray.description":
    "A lightweight Xray Cloud API client for reporting Playwright results: it uploads JUnit executions, attaches evidence to each Test Run and syncs Cucumber scenarios with Jira.",
  "openSource.pw2xray.usageSource": "usage",
  "openSource.pw2xray.usageSummary":
    'Usage from the README, in TypeScript: import "dotenv/config"; import the uploadToXray function from "pw2xray/upload-to-xray"; then call uploadToXray(), and if it fails, log the error with console.error and set process.exitCode to 1.',
  "tools.title": "Tools",
  "tools.group.automation": "Automation",
  "tools.group.mobile": "Mobile",
  "tools.group.apiPerformance": "API & performance",
  "tools.group.cicd": "CI/CD",
  "tools.group.testManagement": "Test management",
  "contact.title": "Contact",
  "contact.copy": "copy",
  "contact.copied": "copied",
  "contact.selected": "selected, press Ctrl+C",
  "contact.announce.copied": "Email address copied.",
  "contact.announce.selected":
    "Could not copy. The address is selected: press Ctrl+C, or Cmd+C on a Mac.",
  "report.code": "Report",
  "report.title": "How this site is tested",
  "report.e2e": "Playwright · on every pull request",
  "report.accessibility.term": "Accessibility",
  "report.accessibility": "axe · 0 violations required",
  "report.performance.term": "Performance",
  /* Follows "Lighthouse · ≥ 95", the score read from the quality budget. */
  "report.performance.scope": "in all four categories",
  "report.deploy.term": "Deploy",
  "report.deploy": "Cloudflare Pages · preview per pull request",
  "report.source.term": "Source",
  "footer.privacy": "No cookies, no tracking",
  /* Links are written [text](address); the Jenkins licence asks for the link to jenkins.io. */
  "footer.credits":
    "Logos are trademarks of their owners and only name the tools. Jenkins logo by the [Jenkins project](https://jenkins.io/), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/); Git logo by Jason Long, [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/); Playwright logo by Microsoft, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).",
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
  "sectionsNav.label": "Secciones",
  "sectionsNav.menu": "Menú de secciones",
  "sectionsNav.about": "Sobre mí",
  "sectionsNav.work": "Trabajo",
  "sectionsNav.openSource": "Código abierto",
  "sectionsNav.tools": "Herramientas",
  "sectionsNav.contact": "Contacto",
  "languageSwitch.label": "Selector de idioma",
  "themeToggle.toDark": "Cambiar al tema oscuro",
  "themeToggle.toLight": "Cambiar al tema claro",
  "home.displayLine": "Calidad, de punta a punta.",
  "hero.sub": "De los requisitos a producción.",
  "hero.disciplines": "Ingeniería de calidad · QA agéntico · Web, API y móvil",
  "hero.primaryAction": "Conversemos",
  "hero.cvAction": "Descargar CV (PDF)",
  "hero.reportNote": "Este sitio se prueba en cada pull request",
  "hero.reportAction": "ver el reporte",
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
  "sectionHead.testCase": "Caso de prueba",
  "about.title": "Sobre mí",
  "about.lead":
    "La calidad no es un filtro: existe en cada etapa del desarrollo.",
  "about.experience":
    "Trabajo en servicios financieros (banca privada y gestión patrimonial), donde ideé el primer framework de automatización institucional de mi equipo de calidad y enseñé a trabajar con él a un equipo que venía de pruebas manuales: en tres meses, cada QA tenía al menos un flujo automatizado.",
  "about.practice":
    "Hoy automatizo web, API y aplicaciones móviles (Playwright, TypeScript, Maestro), preparo las pruebas para funcionar como quality gate en CI y trabajo con agentes que generan, ejecutan y reparan pruebas de forma autónoma; yo valido los hallazgos antes de reportarlos.",
  "work.title": "En qué trabajo",
  "work.frameworks.title": "Frameworks de automatización de pruebas",
  "work.frameworks.description":
    "Arquitectura en capas de Playwright + TypeScript con casos de prueba atómicos, componentes reutilizables, linting, hooks, decisiones de arquitectura documentadas y runbooks.",
  "work.platforms.title": "Web, API y móvil",
  "work.platforms.description":
    "Flujos de punta a punta en plataformas modernas y heredadas, cobertura de API con sesiones reutilizables y pruebas móviles con Maestro (antes Appium).",
  "work.cicd.title": "Calidad en CI/CD",
  "work.cicd.description":
    "Flujos de trabajo de GitHub Actions que actúan como quality gate: una prueba que falla bloquea la integración.",
  "work.agentic.title": "QA agéntico",
  "work.agentic.description":
    "Agentes que generan, ejecutan y reparan pruebas BDD de forma autónoma. Yo valido los hallazgos antes de reportarlos, para mantener los falsos positivos fuera de los reportes de defectos.",
  "work.testManagement.title": "Integración con gestión de pruebas",
  "work.testManagement.description":
    "Herramientas reutilizables entre frameworks de pruebas y Xray / Jira.",
  "openSource.title": "Código abierto",
  "openSource.playwrightCiReference.description":
    "Una referencia pequeña y completa de cómo una suite de pruebas se convierte en un quality gate: pruebas de Playwright en capas y un pipeline de CI en runners alojados en GitHub.",
  "openSource.playwrightCiReference.usageSource": "ejecutar en local",
  "openSource.playwrightCiReference.usageSummary":
    "Uso según el README, para ejecutarlo en local: npm ci; npx playwright install chromium; npm run check, que ejecuta lint, format, typecheck y todas las pruebas; npm run report, que abre el último reporte HTML.",
  "openSource.pw2xray.description":
    "Cliente ligero de la API de Xray Cloud para reportar resultados de Playwright: sube ejecuciones JUnit, adjunta evidencia a cada Test Run y sincroniza escenarios Cucumber con Jira.",
  "openSource.pw2xray.usageSource": "uso",
  "openSource.pw2xray.usageSummary":
    'Uso según el README, en TypeScript: import "dotenv/config"; importar la función uploadToXray desde "pw2xray/upload-to-xray"; luego llamar a uploadToXray() y, si falla, registrar el error con console.error y fijar process.exitCode en 1.',
  "tools.title": "Herramientas",
  "tools.group.automation": "Automatización",
  "tools.group.mobile": "Móvil",
  "tools.group.apiPerformance": "API y rendimiento",
  "tools.group.cicd": "CI/CD",
  "tools.group.testManagement": "Gestión de pruebas",
  "contact.title": "Contacto",
  "contact.copy": "copiar",
  "contact.copied": "copiado",
  "contact.selected": "seleccionado, presiona Ctrl+C",
  "contact.announce.copied": "Dirección de correo copiada.",
  "contact.announce.selected":
    "No se pudo copiar. La dirección está seleccionada: presiona Ctrl+C, o Cmd+C en Mac.",
  "report.code": "Reporte",
  "report.title": "Cómo se prueba este sitio",
  "report.e2e": "Playwright · en cada pull request",
  "report.accessibility.term": "Accesibilidad",
  "report.accessibility": "axe · se exigen 0 violaciones",
  "report.performance.term": "Rendimiento",
  "report.performance.scope": "en las cuatro categorías",
  "report.deploy.term": "Despliegue",
  "report.deploy": "Cloudflare Pages · vista previa por pull request",
  "report.source.term": "Código",
  "footer.privacy": "Sin cookies, sin rastreo",
  "footer.credits":
    "Los logotipos son marcas de sus propietarios y solo identifican las herramientas. Logotipo de Jenkins: [proyecto Jenkins](https://jenkins.io/), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/); logotipo de Git: Jason Long, [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/); logotipo de Playwright: Microsoft, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).",
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
