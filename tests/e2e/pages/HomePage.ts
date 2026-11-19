import type { Locator, Page } from "@playwright/test";
import { About } from "../components/About";
import { GlyphField } from "../components/GlyphField";
import { Hero } from "../components/Hero";
import { LanguageSwitch } from "../components/LanguageSwitch";
import { OpenSource } from "../components/OpenSource";
import { ReadingProgress } from "../components/ReadingProgress";
import { SeoLinks } from "../components/SeoLinks";
import { SiteHeader } from "../components/SiteHeader";
import { Work } from "../components/Work";
import type { ColorScheme } from "../data/colorSchemes";
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
  readonly glyphField: GlyphField;

  constructor(private readonly page: Page) {
    this.document = page.locator("html");
    this.main = page.getByRole("main");
    this.mainHeading = this.main.getByRole("heading", { level: 1 });
    this.seo = new SeoLinks(page);
    this.readingProgress = new ReadingProgress(page);
    this.glyphField = new GlyphField(page);
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

  /** Flips the system's light or dark preference while the page is open, as the OS does. */
  async switchSystemScheme(scheme: ColorScheme): Promise<void> {
    await this.page.emulateMedia({ colorScheme: scheme });
  }

  textInMain(content: string): Locator {
    return this.main.getByText(content, { exact: true });
  }

  skipLink(accessibleName: string): Locator {
    return this.page.getByRole("link", { name: accessibleName, exact: true });
  }

  header(copy: HeaderCopy): SiteHeader {
    return new SiteHeader(this.page, copy);
  }

  hero(locale: LocaleCase): Hero {
    return new Hero(this.page, locale);
  }

  about(locale: LocaleCase): About {
    return new About(this.page, locale.about);
  }

  work(locale: LocaleCase): Work {
    return new Work(this.page, locale.work);
  }

  openSource(locale: LocaleCase): OpenSource {
    return new OpenSource(this.page, locale.openSource);
  }

  /** The regions of the sections that follow the hero, in page order. */
  sectionsBelowHero(locale: LocaleCase): Locator[] {
    return [
      this.about(locale).region,
      this.work(locale).region,
      this.openSource(locale).region,
    ];
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
