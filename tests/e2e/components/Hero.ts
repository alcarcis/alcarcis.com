import type { Locator, Page } from "@playwright/test";
import type { HeroCopy, InstrumentCopy, LocaleCase } from "../data/locales";
import { Instrument } from "./Instrument";

export class Hero {
  readonly region: Locator;
  readonly heading: Locator;
  readonly eyebrow: Locator;
  readonly displayLine: Locator;
  readonly sub: Locator;
  readonly primaryAction: Locator;
  readonly cvLinks: Locator;
  readonly instrument: Instrument;

  constructor(page: Page, locale: LocaleCase) {
    const hero: HeroCopy = locale.hero;
    const instrument: InstrumentCopy = locale.instrument;
    this.region = page.getByRole("region", {
      name: locale.heading,
      exact: true,
    });
    this.heading = this.region.getByRole("heading", { level: 1 });
    this.eyebrow = this.region.getByText(hero.eyebrow, { exact: true });
    this.displayLine = this.region.getByText(locale.displayLine, {
      exact: true,
    });
    this.sub = this.region.getByText(hero.sub, { exact: true });
    this.primaryAction = this.region.getByRole("link", {
      name: hero.primaryAction,
      exact: true,
    });
    this.cvLinks = page.getByRole("link", { name: hero.cvAction });
    this.instrument = new Instrument(this.region, instrument);
  }
}
