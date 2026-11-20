import { expect, type Locator, type Page } from "@playwright/test";
import type { HeroCopy, InstrumentCopy, LocaleCase } from "../data/locales";
import { Instrument } from "./Instrument";

export class Hero {
  readonly region: Locator;
  readonly heading: Locator;
  readonly disciplines: Locator;
  readonly displayLine: Locator;
  /** The paragraph right under the name, whatever it says: the page's own display line. */
  readonly displayLineParagraph: Locator;
  readonly sub: Locator;
  readonly primaryAction: Locator;
  readonly cvLinks: Locator;
  /** The note under the actions that leads to the report on how this site is tested. */
  readonly reportLink: Locator;
  readonly instrument: Instrument;

  constructor(
    page: Page,
    private readonly locale: LocaleCase,
  ) {
    const hero: HeroCopy = locale.hero;
    const instrument: InstrumentCopy = locale.instrument;
    this.region = page.getByRole("region", {
      name: locale.heading,
      exact: true,
    });
    this.heading = this.region.getByRole("heading", { level: 1 });
    this.disciplines = this.region.getByText(hero.disciplines, {
      exact: true,
    });
    this.displayLine = this.region.getByText(locale.displayLine, {
      exact: true,
    });
    this.displayLineParagraph = this.region.locator("h1 + p");
    this.sub = this.region.getByText(hero.sub, { exact: true });
    this.primaryAction = this.region.getByRole("link", {
      name: hero.primaryAction,
      exact: true,
    });
    this.cvLinks = this.region.getByRole("link", { name: hero.cvAction });
    this.reportLink = this.region.getByRole("link", {
      name: hero.reportLink,
      exact: true,
    });
    this.instrument = new Instrument(this.region, instrument);
  }

  /**
   * Asserts the copy reads in this order: the name, both display lines, the discipline line,
   * then the primary action. Other content may sit around them, not between them.
   */
  async expectReadingOrder(): Promise<void> {
    const { heading, displayLine, hero } = this.locale;
    const quoted = (text: string): string => JSON.stringify(text);
    await expect(this.region).toMatchAriaSnapshot(
      [
        `- heading ${quoted(heading)} [level=1]`,
        `- paragraph: ${quoted(displayLine)}`,
        `- paragraph: ${quoted(hero.sub)}`,
        `- paragraph: ${quoted(hero.disciplines)}`,
        `- link ${quoted(hero.primaryAction)}`,
      ].join("\n"),
    );
  }

  /**
   * Scrolls straight down until the name's last line has passed the top of the viewport, so the
   * whole heading sits behind the sticky header or above it.
   */
  async scrollHeadingOutOfView(): Promise<void> {
    await this.heading.evaluate((heading) =>
      scrollTo({
        top: heading.getBoundingClientRect().bottom + scrollY,
        behavior: "instant",
      }),
    );
  }
}
