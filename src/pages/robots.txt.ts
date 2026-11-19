import type { APIRoute } from "astro";
import { defaultLocale, localizedUrl } from "../i18n/ui";
import { robotsTxt } from "../lib/seo";

// The pages.dev addresses stay out of search results through public/_headers (D60), not here:
// this file is the same on every deployment.
export const GET: APIRoute = () =>
  new Response(
    robotsTxt(new URL("/sitemap.xml", localizedUrl(defaultLocale)).href),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
