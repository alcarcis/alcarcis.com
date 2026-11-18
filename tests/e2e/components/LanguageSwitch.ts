import type { Locator, Page } from "@playwright/test";

export class LanguageSwitch {
  readonly region: Locator;

  constructor(page: Page, accessibleName: string) {
    this.region = page.getByRole("navigation", {
      name: accessibleName,
      exact: true,
    });
  }

  option(languageName: string): Locator {
    return this.region.getByRole("link", { name: languageName, exact: true });
  }

  async switchTo(languageName: string): Promise<void> {
    await this.option(languageName).click();
  }
}
