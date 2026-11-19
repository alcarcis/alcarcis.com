import type { LocaleCase } from "./locales";

/** The anchors the header links to, in page order: one English set on every page (Q34). */
export const sectionAnchors = [
  "about",
  "work",
  "open-source",
  "tools",
  "contact",
] as const;

export type SectionAnchor = (typeof sectionAnchors)[number];

/** The profile links the menu takes in on phones, named by their visible text. */
export const menuProfileLinks: readonly { name: string; url: string }[] = [
  { name: "LinkedIn", url: "https://www.linkedin.com/in/alcarcis" },
  { name: "GitHub", url: "https://github.com/alcarcis" },
];

export interface SectionsNavCopy {
  /** The name of the header's navigation landmark for the sections. */
  readonly navName: string;
  readonly menuButtonName: string;
  /** The visible name of each link, by the anchor it points to. */
  readonly linkNames: Readonly<Record<SectionAnchor, string>>;
}

const copyByLanguage: Readonly<Record<string, SectionsNavCopy>> = {
  en: {
    navName: "Sections",
    menuButtonName: "Sections menu",
    linkNames: {
      about: "About",
      work: "Work",
      "open-source": "Open source",
      tools: "Tools",
      contact: "Contact",
    },
  },
  es: {
    navName: "Secciones",
    menuButtonName: "Menú de secciones",
    linkNames: {
      about: "Sobre mí",
      work: "Trabajo",
      "open-source": "Código abierto",
      tools: "Herramientas",
      contact: "Contacto",
    },
  },
};

export function sectionsNavCopy(locale: LocaleCase): SectionsNavCopy {
  const copy = copyByLanguage[locale.language.lang];
  if (!copy)
    throw new Error(`No sections nav copy for "${locale.language.lang}".`);
  return copy;
}

/**
 * The layouts the bar takes: the links inline from 1200 px, behind a menu button below it,
 * and the profile links inside that menu below 480 px.
 */
export const navLayouts = {
  inline: { width: 1440, height: 900 },
  narrowestInline: { width: 1200, height: 800 },
  widestMenu: { width: 1199, height: 800 },
  narrowestWithProfileIcons: { width: 480, height: 844 },
  phone: { width: 390, height: 844 },
} as const;

/**
 * Widths where the bar is fullest: the narrowest phones, either side of the profile links
 * moving into the menu, and either side of the links leaving the bar.
 */
export const crowdedBarWidths = [
  320, 360, 479, 480, 527, 528, 1199, 1200,
] as const;
