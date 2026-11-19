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

export interface LocaleCase {
  readonly language: LanguageOption;
  readonly canonicalUrl: string;
  readonly heading: string;
  readonly displayLine: string;
  readonly languageSwitchName: string;
  readonly switchTarget: LanguageOption;
  readonly header: HeaderCopy;
}

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
};

export const localeCases: readonly LocaleCase[] = [englishPage, spanishPage];

export const alternateLinks: readonly AlternateLink[] = [
  { hreflang: "en", href: "https://alcarcis.com/" },
  { hreflang: "es", href: "https://alcarcis.com/es/" },
  { hreflang: "x-default", href: "https://alcarcis.com/" },
];
