import type { Locator, Page } from "@playwright/test";
import { About } from "../components/About";
import { Contact } from "../components/Contact";
import { Footer } from "../components/Footer";
import { GlyphField } from "../components/GlyphField";
import { Hero } from "../components/Hero";
import { LanguageSwitch } from "../components/LanguageSwitch";
import { OpenSource } from "../components/OpenSource";
import { ReadingProgress } from "../components/ReadingProgress";
import { SectionsNav } from "../components/SectionsNav";
import { SeoLinks } from "../components/SeoLinks";
import { SiteHeader } from "../components/SiteHeader";
import { Tools } from "../components/Tools";
import { Work } from "../components/Work";
import type { ColorScheme } from "../data/colorSchemes";
import type { HeaderCopy, LocaleCase } from "../data/locales";
import { sectionsNavCopy } from "../data/sectionsNav";

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

  /** Scrolls straight to the top of the page, with no smooth scrolling. */
  async scrollToTop(): Promise<void> {
    await this.page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  }

  /** Scrolls straight to the end of the page, with no smooth scrolling. */
  async scrollToEnd(): Promise<void> {
    await this.page.evaluate(() =>
      scrollTo({
        top: document.scrollingElement?.scrollHeight ?? 0,
        behavior: "instant",
      }),
    );
  }

  /**
   * How far the page reaches past the viewport sideways once its fonts load, in CSS pixels;
   * 0 when it fits.
   */
  async sidewaysOverflow(): Promise<number> {
    return this.page.evaluate(async () => {
      await document.fonts.ready;
      const root = document.documentElement;
      return root.scrollWidth - root.clientWidth;
    });
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

  sectionsNav(locale: LocaleCase): SectionsNav {
    return new SectionsNav(this.page, sectionsNavCopy(locale));
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

  tools(locale: LocaleCase): Tools {
    return new Tools(this.page, locale.tools);
  }

  contact(locale: LocaleCase): Contact {
    return new Contact(this.page, locale.contact);
  }

  footer(locale: LocaleCase): Footer {
    return new Footer(this.page, locale.footer);
  }

  /** The regions of the sections that follow the hero, in page order. */
  sectionsBelowHero(locale: LocaleCase): Locator[] {
    return [
      this.about(locale).region,
      this.work(locale).region,
      this.openSource(locale).region,
      this.tools(locale).region,
      this.contact(locale).region,
    ];
  }

  /** The landmarks that follow the hero, in page order: each section, then the footer. */
  landmarksBelowHero(locale: LocaleCase): Locator[] {
    return [...this.sectionsBelowHero(locale), this.footer(locale).landmark];
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
