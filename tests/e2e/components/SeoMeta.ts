import type { APIResponse, Locator, Page } from "@playwright/test";
import type { MetaTag, SitemapEntry } from "../data/seo";

const sitemapNamespace = "http://www.sitemaps.org/schemas/sitemap/0.9";
const xhtmlNamespace = "http://www.w3.org/1999/xhtml";

/** The page's description, share tags and structured data, as crawlers and link previews read them. */
export class SeoMeta {
  readonly description: Locator;
  readonly shareTags: Locator;
  readonly structuredData: Locator;

  constructor(private readonly page: Page) {
    this.description = page.locator('head meta[name="description"]');
    this.shareTags = page.locator(
      'head meta[property^="og:"], head meta[name^="twitter:"]',
    );
    this.structuredData = page.locator(
      'head script[type="application/ld+json"]',
    );
  }

  tag(tag: Pick<MetaTag, "attribute" | "key">): Locator {
    return this.page.locator(`head meta[${tag.attribute}="${tag.key}"]`);
  }

  /** Every structured data block, parsed; a block that is not valid JSON throws. */
  async structuredDataObjects(): Promise<unknown[]> {
    const blocks = await this.structuredData.allTextContents();
    return blocks.map((block) => JSON.parse(block) as unknown);
  }
}

/** The sitemap, read the way a crawler reads it: fetched, then parsed as namespaced XML. */
export class Sitemap {
  constructor(private readonly page: Page) {}

  /** Fetches the sitemap; the response carries its status and content type. */
  async fetch(): Promise<APIResponse> {
    return this.page.request.get("/sitemap.xml");
  }

  /** Every `<url>` entry with its hreflang alternates; malformed XML throws. */
  async entries(response: APIResponse): Promise<SitemapEntry[]> {
    return this.page.evaluate(
      ({ xml, sitemapNs, xhtmlNs }) => {
        const parsed = new DOMParser().parseFromString(xml, "application/xml");
        if (parsed.getElementsByTagName("parsererror").length > 0) {
          throw new Error("The sitemap is not well-formed XML.");
        }
        return [...parsed.getElementsByTagNameNS(sitemapNs, "url")].map(
          (url) => ({
            loc:
              url.getElementsByTagNameNS(sitemapNs, "loc")[0]?.textContent ??
              "",
            alternates: [...url.getElementsByTagNameNS(xhtmlNs, "link")]
              .filter((link) => link.getAttribute("rel") === "alternate")
              .map((link) => ({
                hreflang: link.getAttribute("hreflang") ?? "",
                href: link.getAttribute("href") ?? "",
              })),
          }),
        );
      },
      {
        xml: await response.text(),
        sitemapNs: sitemapNamespace,
        xhtmlNs: xhtmlNamespace,
      },
    );
  }
}
