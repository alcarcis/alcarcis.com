// Pure helpers for the page's search and sharing metadata. No Astro imports, so Node's test
// runner and the share-image script load this module directly.
import type { Locale } from "../i18n/ui";

export interface AlternateLink {
  readonly hreflang: string;
  readonly href: string;
}

/** Every language version of a page, then x-default pointing at the default language. */
export function languageAlternates<L extends string>(
  locales: readonly L[],
  defaultLocale: L,
  urlFor: (locale: L) => string,
): AlternateLink[] {
  return [
    ...locales.map((hreflang) => ({ hreflang, href: urlFor(hreflang) })),
    { hreflang: "x-default", href: urlFor(defaultLocale) },
  ];
}

export interface ShareImage {
  /** Where the PNG is published, from the site root. */
  readonly path: string;
  /** The line under the name, as the page's display line says it. */
  readonly tagline: string;
  readonly alt: string;
}

export const shareImageSize = { width: 1200, height: 630 } as const;

/** The pass line the share image prints; stage names stay English on both pages (Q26). */
export const shareImageStages = [
  "requirements",
  "design",
  "code",
  "ci/cd",
  "production",
] as const;

/** One share image per language, rendered by `pnpm og` into `public/og/`. */
export const shareImages: Readonly<Record<Locale, ShareImage>> = {
  en: {
    path: "/og/en.png",
    tagline: "Quality, end to end.",
    alt: "Carlos Alcalá. Quality, end to end. A test run where requirements, design, code, ci/cd and production pass.",
  },
  es: {
    path: "/og/es.png",
    tagline: "Calidad, de punta a punta.",
    alt: "Carlos Alcalá. Calidad, de punta a punta. Una ejecución de pruebas con requirements, design, code, ci/cd y production aprobadas.",
  },
};

/** Open Graph locales need a territory: Spanish here serves Peru. */
export const openGraphLocales: Readonly<Record<Locale, string>> = {
  en: "en_US",
  es: "es_PE",
};

/** The home-screen icon iOS asks for, rendered by `pnpm og` from the favicon's monogram. */
export const touchIcon = { path: "/apple-touch-icon.png", size: 180 } as const;

export interface SitemapEntry {
  readonly url: string;
  readonly alternates: readonly AlternateLink[];
}

const xmlEntities: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

const escapeXml = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => xmlEntities[character] ?? character);

/** A sitemap whose entries list their language versions as xhtml:link alternates. */
export function sitemapXml(entries: readonly SitemapEntry[]): string {
  const urls = entries.map((entry) =>
    [
      "  <url>",
      `    <loc>${escapeXml(entry.url)}</loc>`,
      ...entry.alternates.map(
        (alternate) =>
          `    <xhtml:link rel="alternate" hreflang="${escapeXml(alternate.hreflang)}" href="${escapeXml(alternate.href)}"/>`,
      ),
      "  </url>",
    ].join("\n"),
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

/** Every crawler may read everything; the sitemap lists the pages. */
export function robotsTxt(sitemapUrl: string): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`;
}
