import type { Locator, Page } from "@playwright/test";
import { Hero } from "../components/Hero";
import { LanguageSwitch } from "../components/LanguageSwitch";
import { ReadingProgress } from "../components/ReadingProgress";
import { SeoLinks } from "../components/SeoLinks";
import { SiteHeader } from "../components/SiteHeader";
import type { HeaderCopy, LocaleCase } from "../data/locales";

type NavigationOptions = NonNullable<Parameters<Page["goto"]>[1]>;

const isWebUrl = (url: URL): boolean =>
  url.protocol === "http:" || url.protocol === "https:";

export class HomePage {
  readonly document: Locator;
  readonly main: Locator;
  readonly mainHeading: Locator;
  readonly seo: SeoLinks;
  readonly readingProgress: ReadingProgress;

  constructor(private readonly page: Page) {
    this.document = page.locator("html");
    this.main = page.getByRole("main");
    this.mainHeading = this.main.getByRole("heading", { level: 1 });
    this.seo = new SeoLinks(page);
    this.readingProgress = new ReadingProgress(page);
  }

  async open(
    path: string,
    options: Pick<NavigationOptions, "waitUntil"> = {},
  ): Promise<void> {
    await this.page.goto(path, options);
  }

  async reload(): Promise<void> {
    await this.page.reload();
  }

  textInMain(content: string): Locator {
    return this.main.getByText(content, { exact: true });
  }

  header(copy: HeaderCopy): SiteHeader {
    return new SiteHeader(this.page, copy);
  }

  hero(locale: LocaleCase): Hero {
    return new Hero(this.page, locale);
  }

  languageSwitch(accessibleName: string): LanguageSwitch {
    return new LanguageSwitch(this.page, accessibleName);
  }

  /** Web links that leave this site, deduplicated and sorted. */
  async externalLinkUrls(): Promise<string[]> {
    const hrefs = await this.page
      .locator("a[href]")
      .evaluateAll((links) =>
        links.map((link) => (link as HTMLAnchorElement).href),
      );
    const ownOrigin = new URL(this.page.url()).origin;
    const external = hrefs
      .map((href) => new URL(href))
      .filter((url) => isWebUrl(url) && url.origin !== ownOrigin)
      .map((url) => url.href);
    return [...new Set(external)].sort();
  }
}
