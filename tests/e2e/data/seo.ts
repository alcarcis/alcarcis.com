import {
  alternateLinks,
  englishPage,
  spanishPage,
  type AlternateLink,
} from "./locales";

/** The production origin every absolute URL in the sitemap and robots.txt points at. */
export const siteOrigin = "https://alcarcis.com";

export interface SitemapEntry {
  readonly loc: string;
  readonly alternates: readonly AlternateLink[];
}

/** Both pages, each listing every language version, as the pages' own hreflang links do. */
export const expectedSitemap: readonly SitemapEntry[] = [
  { loc: englishPage.canonicalUrl, alternates: alternateLinks },
  { loc: spanishPage.canonicalUrl, alternates: alternateLinks },
];

/** robots.txt as directive and value pairs, in order. */
export const expectedRobots: readonly (readonly [string, string])[] = [
  ["user-agent", "*"],
  ["allow", "/"],
  ["sitemap", `${siteOrigin}/sitemap.xml`],
];
