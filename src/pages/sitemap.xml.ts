import type { APIRoute } from "astro";
import { defaultLocale, locales, localizedUrl } from "../i18n/ui";
import { languageAlternates, sitemapXml } from "../lib/seo";

/** Both home pages, each naming every language version, as their hreflang links do. */
export const GET: APIRoute = () => {
  const alternates = languageAlternates(locales, defaultLocale, (locale) =>
    localizedUrl(locale),
  );
  const body = sitemapXml(
    locales.map((locale) => ({ url: localizedUrl(locale), alternates })),
  );
  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
