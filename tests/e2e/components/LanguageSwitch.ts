import type { Locator, Page } from "@playwright/test";

export class LanguageSwitch {
  readonly region: Locator;

  constructor(page: Page, accessibleName: string) {
    this.region = page.getByRole("navigation", {
      name: accessibleName,
      exact: true,
    });
  }

  option(optionName: string): Locator {
    return this.region.getByRole("link", { name: optionName, exact: true });
  }

  visibleLabel(optionName: string): Locator {
    return this.option(optionName).locator(":scope > :not(.visually-hidden)");
  }

  async switchTo(optionName: string): Promise<void> {
    await this.option(optionName).click();
  }
}
