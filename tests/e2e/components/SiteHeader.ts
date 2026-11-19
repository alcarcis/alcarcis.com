import type { Locator, Page } from "@playwright/test";
import type { HeaderCopy } from "../data/locales";
import { ThemeToggle } from "./ThemeToggle";

export class SiteHeader {
  readonly banner: Locator;
  readonly ownerLink: Locator;
  readonly linkedInLink: Locator;
  readonly gitHubLink: Locator;
  readonly themeToggle: ThemeToggle;

  constructor(page: Page, copy: HeaderCopy) {
    this.banner = page.getByRole("banner");
    this.ownerLink = this.link(copy.ownerLinkName);
    this.linkedInLink = this.link(copy.linkedInName);
    this.gitHubLink = this.link(copy.gitHubName);
    this.themeToggle = new ThemeToggle(this.banner, copy.themeToggle);
  }

  private link(name: string): Locator {
    return this.banner.getByRole("link", { name, exact: true });
  }
}
