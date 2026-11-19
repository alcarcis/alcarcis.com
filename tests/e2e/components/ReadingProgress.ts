import type { Locator, Page } from "@playwright/test";

/** The thin line along the bottom edge. Decorative and hidden from assistive technology. */
export class ReadingProgress {
  readonly fill: Locator;

  constructor(page: Page) {
    this.fill = page.locator("[data-progress-fill]");
  }
}

/** Computed transforms of the fill at the two ends of the page. */
export const emptyLine = "matrix(0, 0, 0, 1, 0, 0)";
export const fullLine = "matrix(1, 0, 0, 1, 0, 0)";
