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
};

export const localeCases: readonly LocaleCase[] = [englishPage, spanishPage];

export const alternateLinks: readonly AlternateLink[] = [
  { hreflang: "en", href: "https://alcarcis.com/" },
  { hreflang: "es", href: "https://alcarcis.com/es/" },
  { hreflang: "x-default", href: "https://alcarcis.com/" },
];
