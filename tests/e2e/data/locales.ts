import {
  playwrightCiReference,
  pw2xray,
  type RepositoryFacts,
} from "./openSource";
import { creditUrls, type CreditSegment } from "./tools";

export interface LanguageOption {
  readonly name: string;
  readonly code: string;
  readonly accessibleName: string;
  readonly lang: string;
  readonly path: string;
}

export interface ThemeToggleNames {
  readonly toDark: string;
  readonly toLight: string;
}

export interface HeaderCopy {
  readonly ownerLinkName: string;
  readonly linkedInName: string;
  readonly gitHubName: string;
  readonly themeToggle: ThemeToggleNames;
}

export interface HeroCopy {
  /** The discipline line, between the display lines and the primary action. */
  readonly disciplines: string;
  readonly sub: string;
  readonly primaryAction: string;
  readonly cvAction: string;
  readonly cvPath: string;
}

export interface StageStateNames {
  readonly passed: string;
  readonly running: string;
  readonly pending: string;
}

export interface InstrumentCopy {
  readonly name: string;
  readonly stagesName: string;
  readonly stageStates: StageStateNames;
  readonly sceneLabel: string;
  /** What the scene shows at each stage, in stage order. */
  readonly captions: readonly string[];
  /** The ci/cd caption once the fix merges. */
  readonly fixCaption: string;
  readonly skipName: string;
  readonly rerunName: string;
  readonly passedAnnouncement: string;
}

/** A section's head: its test case code, what the code stands for, and the section title. */
export interface SectionHeadCopy {
  readonly code: string;
  readonly codeTitle: string;
  readonly title: string;
}

export interface AboutCopy {
  readonly head: SectionHeadCopy;
  /** The opening sentence, set apart from the paragraphs that follow it. */
  readonly lead: string;
  readonly paragraphs: readonly string[];
  readonly photoAlt: string;
}

export interface WorkItemCopy {
  readonly title: string;
  readonly description: string;
}

export interface WorkCopy {
  readonly head: SectionHeadCopy;
  /** The items in the order the page lists them. */
  readonly items: readonly WorkItemCopy[];
}

/** A repository row: the facts every page shares, and what this page says about them. */
export interface RepositoryCopy {
  readonly repository: RepositoryFacts;
  /** What the repository is, in its README's own words. */
  readonly description: string;
  /** The caption the terminal's bar gives the README lines it shows. */
  readonly usageSource: string;
  /** The usage in words: what assistive technology reads instead of the terminal. */
  readonly usageSummary: string;
}

export interface OpenSourceCopy {
  readonly head: SectionHeadCopy;
  /** The repositories in the order the page lists them. */
  readonly repositories: readonly RepositoryCopy[];
}

export interface ToolsCopy {
  readonly head: SectionHeadCopy;
  /** The group titles, in the order the page shows the groups. */
  readonly groupNames: readonly string[];
  /** The line under the groups that credits the logos, link by link. */
  readonly credits: readonly CreditSegment[];
}

export interface LocaleCase {
  readonly language: LanguageOption;
  readonly canonicalUrl: string;
  readonly title: string;
  readonly skipLinkName: string;
  readonly heading: string;
  readonly displayLine: string;
  readonly languageSwitchName: string;
  readonly switchTarget: LanguageOption;
  readonly header: HeaderCopy;
  readonly hero: HeroCopy;
  readonly instrument: InstrumentCopy;
  readonly about: AboutCopy;
  readonly work: WorkCopy;
  readonly openSource: OpenSourceCopy;
  readonly tools: ToolsCopy;
}

export const contactEmailHref = "mailto:hola@alcarcis.com";

export interface AlternateLink {
  readonly hreflang: string;
  readonly href: string;
}

const english: LanguageOption = {
  name: "English",
  code: "EN",
  accessibleName: "EN English",
  lang: "en",
  path: "/",
};

const spanish: LanguageOption = {
  name: "Español",
  code: "ES",
  accessibleName: "ES Español",
  lang: "es",
  path: "/es/",
};

export const languageOptions: readonly LanguageOption[] = [english, spanish];

export const englishPage: LocaleCase = {
  language: english,
  canonicalUrl: "https://alcarcis.com/",
  title: "Carlos Alcalá · Quality Engineering",
  skipLinkName: "Skip to content",
  heading: "Carlos Alcalá",
  displayLine: "Quality, end to end.",
  languageSwitchName: "Language",
  switchTarget: spanish,
  header: {
    ownerLinkName: "Carlos Alcalá, back to top",
    linkedInName: "LinkedIn profile",
    gitHubName: "GitHub profile",
    themeToggle: {
      toDark: "Switch to dark theme",
      toLight: "Switch to light theme",
    },
  },
  hero: {
    disciplines: "Quality Engineering · Agentic QA · Web, API & mobile",
    sub: "From requirements to production.",
    primaryAction: "Let's talk",
    cvAction: "Download CV (PDF)",
    cvPath: "/cv/carlos-alcala-cv-en.pdf",
  },
  instrument: {
    name: "Suite quality.spec.ts, test run",
    stagesName: "Stages",
    stageStates: { passed: "passed", running: "running", pending: "pending" },
    sceneLabel: "Scene · QA at every stage",
    captions: [
      "acceptance criteria made testable",
      "risks mapped before code",
      "tests written with the code",
      "the gate blocks DEF-01",
      "monitored, clean run",
    ],
    fixCaption: "fix merged, gate opens",
    skipName: "Skip: show the finished run",
    rerunName: "Rerun: replay the test run",
    passedAnnouncement: "Test run passed",
  },
  about: {
    head: { code: "TC-01", codeTitle: "Test case 01", title: "About" },
    lead: "Quality isn't a filter: it lives in every stage of development.",
    paragraphs: [
      "I work in financial services (private banking and wealth management), where I conceived my team's first institutional automation framework and taught a manual-testing team to work with it. Within three months every QA had at least one automated flow.",
      "Today I automate web, API and mobile apps (Playwright, TypeScript, Maestro), build tests to work as a quality gate in CI, and work with agents that generate, run and repair tests autonomously; I validate findings before they are reported.",
    ],
    photoAlt: "Carlos Alcalá",
  },
  work: {
    head: { code: "TC-02", codeTitle: "Test case 02", title: "What I work on" },
    items: [
      {
        title: "Test automation frameworks",
        description:
          "Layered Playwright + TypeScript architecture with atomic test cases, reusable components, linting, hooks, documented architecture decisions and runbooks.",
      },
      {
        title: "Web, API & mobile",
        description:
          "End-to-end flows across modern and legacy platforms, API coverage with reusable sessions, and mobile tests with Maestro (previously Appium).",
      },
      {
        title: "Quality in CI/CD",
        description:
          "GitHub Actions workflows that act as a quality gate: a failing test blocks the merge.",
      },
      {
        title: "Agentic QA",
        description:
          "Agents that generate, run and repair BDD tests autonomously. I validate findings before they are reported, to keep false positives out of bug reports.",
      },
      {
        title: "Test management integration",
        description:
          "Reusable tooling between test frameworks and Xray / Jira.",
      },
    ],
  },
  openSource: {
    head: { code: "TC-03", codeTitle: "Test case 03", title: "Open source" },
    repositories: [
      {
        repository: playwrightCiReference,
        description:
          "A small, complete reference of how a test suite becomes a quality gate: layered Playwright tests and a CI pipeline on GitHub-hosted runners.",
        usageSource: "run it locally",
        usageSummary:
          "Usage from the README, run it locally: npm ci; npx playwright install chromium; npm run check, which runs lint, format, typecheck and all tests; npm run report, which opens the last HTML report.",
      },
      {
        repository: pw2xray,
        description:
          "A lightweight Xray Cloud API client for reporting Playwright results: it uploads JUnit executions, attaches evidence to each Test Run and syncs Cucumber scenarios with Jira.",
        usageSource: "usage",
        usageSummary:
          'Usage from the README, in TypeScript: import "dotenv/config"; import the uploadToXray function from "pw2xray/upload-to-xray"; then call uploadToXray(), and if it fails, log the error with console.error and set process.exitCode to 1.',
      },
    ],
  },
  tools: {
    head: { code: "TC-04", codeTitle: "Test case 04", title: "Tools" },
    groupNames: [
      "Automation",
      "Mobile",
      "API & performance",
      "CI/CD",
      "Test management",
    ],
    credits: [
      "Logos are trademarks of their owners and only name the tools. Jenkins logo by the ",
      { link: "Jenkins project", url: creditUrls.jenkinsProject },
      ", ",
      { link: "CC BY-SA 3.0", url: creditUrls.ccBySa30 },
      "; Git logo by Jason Long, ",
      { link: "CC BY 3.0", url: creditUrls.ccBy30 },
      "; Playwright logo by Microsoft, ",
      { link: "CC BY 4.0", url: creditUrls.ccBy40 },
      ".",
    ],
  },
};

export const spanishPage: LocaleCase = {
  language: spanish,
  canonicalUrl: "https://alcarcis.com/es/",
  title: "Carlos Alcalá · Quality Engineering",
  skipLinkName: "Ir al contenido",
  heading: "Carlos Alcalá",
  displayLine: "Calidad, de punta a punta.",
  languageSwitchName: "Selector de idioma",
  switchTarget: english,
  header: {
    ownerLinkName: "Carlos Alcalá, ir al inicio",
    linkedInName: "Perfil de LinkedIn",
    gitHubName: "Perfil de GitHub",
    themeToggle: {
      toDark: "Cambiar al tema oscuro",
      toLight: "Cambiar al tema claro",
    },
  },
  hero: {
    disciplines: "Ingeniería de calidad · QA agéntico · Web, API y móvil",
    sub: "De los requisitos a producción.",
    primaryAction: "Conversemos",
    cvAction: "Descargar CV (PDF)",
    cvPath: "/cv/carlos-alcala-cv-es.pdf",
  },
  instrument: {
    name: "Suite quality.spec.ts, ejecución de pruebas",
    stagesName: "Etapas del desarrollo",
    stageStates: {
      passed: "aprobada",
      running: "en curso",
      pending: "pendiente",
    },
    sceneLabel: "Escena · Calidad en cada etapa",
    captions: [
      "criterios de aceptación verificables",
      "riesgos identificados antes de programar",
      "pruebas escritas junto al código",
      "el quality gate bloquea DEF-01",
      "monitoreado, ejecución limpia",
    ],
    fixCaption: "corrección integrada, el gate se abre",
    skipName: "Skip: ver el resultado final",
    rerunName: "Rerun: repetir la ejecución",
    passedAnnouncement: "Pruebas aprobadas",
  },
  about: {
    head: { code: "TC-01", codeTitle: "Caso de prueba 01", title: "Sobre mí" },
    lead: "La calidad no es un filtro: existe en cada etapa del desarrollo.",
    paragraphs: [
      "Trabajo en servicios financieros (banca privada y gestión patrimonial), donde ideé el primer framework de automatización institucional de mi equipo de calidad y enseñé a trabajar con él a un equipo que venía de pruebas manuales: en tres meses, cada QA tenía al menos un flujo automatizado.",
      "Hoy automatizo web, API y aplicaciones móviles (Playwright, TypeScript, Maestro), preparo las pruebas para funcionar como quality gate en CI y trabajo con agentes que generan, ejecutan y reparan pruebas de forma autónoma; yo valido los hallazgos antes de reportarlos.",
    ],
    photoAlt: "Carlos Alcalá",
  },
  work: {
    head: {
      code: "TC-02",
      codeTitle: "Caso de prueba 02",
      title: "En qué trabajo",
    },
    items: [
      {
        title: "Frameworks de automatización de pruebas",
        description:
          "Arquitectura en capas de Playwright + TypeScript con casos de prueba atómicos, componentes reutilizables, linting, hooks, decisiones de arquitectura documentadas y runbooks.",
      },
      {
        title: "Web, API y móvil",
        description:
          "Flujos de punta a punta en plataformas modernas y heredadas, cobertura de API con sesiones reutilizables y pruebas móviles con Maestro (antes Appium).",
      },
      {
        title: "Calidad en CI/CD",
        description:
          "Flujos de trabajo de GitHub Actions que actúan como quality gate: una prueba que falla bloquea la integración.",
      },
      {
        title: "QA agéntico",
        description:
          "Agentes que generan, ejecutan y reparan pruebas BDD de forma autónoma. Yo valido los hallazgos antes de reportarlos, para mantener los falsos positivos fuera de los reportes de defectos.",
      },
      {
        title: "Integración con gestión de pruebas",
        description:
          "Herramientas reutilizables entre frameworks de pruebas y Xray / Jira.",
      },
    ],
  },
  openSource: {
    head: {
      code: "TC-03",
      codeTitle: "Caso de prueba 03",
      title: "Código abierto",
    },
    repositories: [
      {
        repository: playwrightCiReference,
        description:
          "Una referencia pequeña y completa de cómo una suite de pruebas se convierte en un quality gate: pruebas de Playwright en capas y un pipeline de CI en runners alojados en GitHub.",
        usageSource: "ejecutar en local",
        usageSummary:
          "Uso según el README, para ejecutarlo en local: npm ci; npx playwright install chromium; npm run check, que ejecuta lint, format, typecheck y todas las pruebas; npm run report, que abre el último reporte HTML.",
      },
      {
        repository: pw2xray,
        description:
          "Cliente ligero de la API de Xray Cloud para reportar resultados de Playwright: sube ejecuciones JUnit, adjunta evidencia a cada Test Run y sincroniza escenarios Cucumber con Jira.",
        usageSource: "uso",
        usageSummary:
          'Uso según el README, en TypeScript: import "dotenv/config"; importar la función uploadToXray desde "pw2xray/upload-to-xray"; luego llamar a uploadToXray() y, si falla, registrar el error con console.error y fijar process.exitCode en 1.',
      },
    ],
  },
  tools: {
    head: {
      code: "TC-04",
      codeTitle: "Caso de prueba 04",
      title: "Herramientas",
    },
    groupNames: [
      "Automatización",
      "Móvil",
      "API y rendimiento",
      "CI/CD",
      "Gestión de pruebas",
    ],
    credits: [
      "Los logotipos son marcas de sus propietarios y solo identifican las herramientas. Logotipo de Jenkins: ",
      { link: "proyecto Jenkins", url: creditUrls.jenkinsProject },
      ", ",
      { link: "CC BY-SA 3.0", url: creditUrls.ccBySa30 },
      "; logotipo de Git: Jason Long, ",
      { link: "CC BY 3.0", url: creditUrls.ccBy30 },
      "; logotipo de Playwright: Microsoft, ",
      { link: "CC BY 4.0", url: creditUrls.ccBy40 },
      ".",
    ],
  },
};

export const localeCases: readonly LocaleCase[] = [englishPage, spanishPage];

export const alternateLinks: readonly AlternateLink[] = [
  { hreflang: "en", href: "https://alcarcis.com/" },
  { hreflang: "es", href: "https://alcarcis.com/es/" },
  { hreflang: "x-default", href: "https://alcarcis.com/" },
];
