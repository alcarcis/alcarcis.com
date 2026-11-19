import type { Locator, Page } from "@playwright/test";

const alternateLinkSelector = (hreflang?: string): string =>
  hreflang === undefined
    ? 'head link[rel="alternate"][hreflang]'
    : `head link[rel="alternate"][hreflang="${hreflang}"]`;

export class SeoLinks {
  readonly canonical: Locator;
  readonly alternates: Locator;
  readonly icon: Locator;
  readonly fontPreloads: Locator;

  constructor(private readonly page: Page) {
    this.canonical = page.locator('head link[rel="canonical"]');
    this.alternates = page.locator(alternateLinkSelector());
    this.icon = page.locator('head link[rel="icon"]');
    this.fontPreloads = page.locator('head link[rel="preload"][as="font"]');
  }

  alternate(hreflang: string): Locator {
    return this.page.locator(alternateLinkSelector(hreflang));
  }

  async iconUrl(): Promise<string> {
    return this.icon.evaluate((link: HTMLLinkElement) => link.href);
  }
}
