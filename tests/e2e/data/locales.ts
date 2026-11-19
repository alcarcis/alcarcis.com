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
  readonly eyebrow: string;
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
}

export interface LocaleCase {
  readonly language: LanguageOption;
  readonly canonicalUrl: string;
  readonly heading: string;
  readonly displayLine: string;
  readonly languageSwitchName: string;
  readonly switchTarget: LanguageOption;
  readonly header: HeaderCopy;
  readonly hero: HeroCopy;
  readonly instrument: InstrumentCopy;
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
    eyebrow: "Quality Engineering · Agentic QA · Web, API & mobile",
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
  },
};

export const spanishPage: LocaleCase = {
  language: spanish,
  canonicalUrl: "https://alcarcis.com/es/",
  heading: "Carlos Alcalá",
  displayLine: "Calidad, de punta a punta.",
  languageSwitchName: "Idioma",
  switchTarget: english,
  header: {
    ownerLinkName: "Carlos Alcalá, volver al inicio",
    linkedInName: "Perfil de LinkedIn",
    gitHubName: "Perfil de GitHub",
    themeToggle: {
      toDark: "Cambiar al tema oscuro",
      toLight: "Cambiar al tema claro",
    },
  },
  hero: {
    eyebrow: "Ingeniería de calidad · QA agéntico · Web, API y móvil",
    sub: "De los requisitos a producción.",
    primaryAction: "Conversemos",
    cvAction: "Descargar CV (PDF)",
    cvPath: "/cv/carlos-alcala-cv-es.pdf",
  },
  instrument: {
    name: "Suite quality.spec.ts, ejecución de pruebas",
    stagesName: "Etapas",
    stageStates: {
      passed: "superada",
      running: "en curso",
      pending: "pendiente",
    },
    sceneLabel: "Escena · QA en cada etapa",
    captions: [
      "criterios de aceptación verificables",
      "riesgos mapeados antes del código",
      "pruebas escritas con el código",
      "la puerta de calidad bloquea DEF-01",
      "monitoreado, ejecución limpia",
    ],
  },
};

export const localeCases: readonly LocaleCase[] = [englishPage, spanishPage];

export const alternateLinks: readonly AlternateLink[] = [
  { hreflang: "en", href: "https://alcarcis.com/" },
  { hreflang: "es", href: "https://alcarcis.com/es/" },
  { hreflang: "x-default", href: "https://alcarcis.com/" },
];
