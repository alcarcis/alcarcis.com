import type { Locator, Page } from "@playwright/test";

const alternateLinkSelector = (hreflang?: string): string =>
  hreflang === undefined
    ? 'head link[rel="alternate"][hreflang]'
    : `head link[rel="alternate"][hreflang="${hreflang}"]`;

export class SeoLinks {
  readonly canonical: Locator;
  readonly alternates: Locator;

  constructor(private readonly page: Page) {
    this.canonical = page.locator('head link[rel="canonical"]');
    this.alternates = page.locator(alternateLinkSelector());
  }

  alternate(hreflang: string): Locator {
    return this.page.locator(alternateLinkSelector(hreflang));
  }
}
