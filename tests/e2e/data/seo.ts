import {
  alternateLinks,
  englishPage,
  spanishPage,
  type AlternateLink,
  type LocaleCase,
} from "./locales";

/** The production origin every absolute URL in the page's metadata points at. */
export const siteOrigin = "https://alcarcis.com";

/** One `<meta>` tag: Open Graph tags use `property`, Twitter tags use `name`. */
export interface MetaTag {
  readonly attribute: "property" | "name";
  readonly key: string;
  readonly content: string;
}

export interface SeoCase {
  readonly page: LocaleCase;
  readonly description: string;
  /** The page's share image, as an absolute URL on the production origin. */
  readonly shareImageUrl: string;
  /** Every Open Graph and Twitter tag the page declares, each exactly once. */
  readonly shareTags: readonly MetaTag[];
}

export const shareImageSize = { width: 1200, height: 630 } as const;

/** A share preview downloads the whole image before it shows, so it stays small. */
export const shareImageMaxBytes = 100_000;

/** iOS asks for a 180×180 touch icon when a visitor adds the page to the home screen. */
export const touchIconSize = 180;

const property = (key: string, content: string): MetaTag => ({
  attribute: "property",
  key,
  content,
});

const shareTagsFor = (
  page: LocaleCase,
  description: string,
  image: { url: string; alt: string },
  locales: { own: string; alternate: string },
): readonly MetaTag[] => [
  property("og:type", "website"),
  property("og:title", page.title),
  property("og:description", description),
  property("og:url", page.canonicalUrl),
  property("og:locale", locales.own),
  property("og:locale:alternate", locales.alternate),
  property("og:image", image.url),
  property("og:image:type", "image/png"),
  property("og:image:width", String(shareImageSize.width)),
  property("og:image:height", String(shareImageSize.height)),
  property("og:image:alt", image.alt),
  { attribute: "name", key: "twitter:card", content: "summary_large_image" },
];

const englishDescription =
  "Quality engineering from requirements to production: test automation for web, API and mobile, quality gates in CI, and agentic QA.";
const englishImage = {
  url: `${siteOrigin}/og/en.png`,
  alt: `Carlos Alcalá. ${englishPage.displayLine} A test run where requirements, design, code, ci/cd and production pass.`,
};

const spanishDescription =
  "Ingeniería de calidad de los requisitos a producción: automatización de pruebas web, API y móvil, quality gates en CI y QA agéntico.";
const spanishImage = {
  url: `${siteOrigin}/og/es.png`,
  alt: `Carlos Alcalá. ${spanishPage.displayLine} Una ejecución de pruebas con requirements, design, code, ci/cd y production aprobadas.`,
};

/** Spanish here serves Peru (open question on the language flags), so its locale is es_PE. */
const openGraphLocales = { en: "en_US", es: "es_PE" } as const;

export const seoCases: readonly SeoCase[] = [
  {
    page: englishPage,
    description: englishDescription,
    shareImageUrl: englishImage.url,
    shareTags: shareTagsFor(englishPage, englishDescription, englishImage, {
      own: openGraphLocales.en,
      alternate: openGraphLocales.es,
    }),
  },
  {
    page: spanishPage,
    description: spanishDescription,
    shareImageUrl: spanishImage.url,
    shareTags: shareTagsFor(spanishPage, spanishDescription, spanishImage, {
      own: openGraphLocales.es,
      alternate: openGraphLocales.en,
    }),
  },
];

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
