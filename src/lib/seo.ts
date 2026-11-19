// Pure helpers for the page's search metadata. No Astro imports, so Node's test
// runner loads this module directly.

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
