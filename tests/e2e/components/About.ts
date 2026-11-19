import { expect, type Locator, type Page } from "@playwright/test";
import type { AboutCopy } from "../data/locales";
import { quoted, SectionHead } from "./SectionHead";

export class About {
  readonly region: Locator;
  readonly head: SectionHead;
  readonly photo: Locator;

  constructor(
    page: Page,
    private readonly copy: AboutCopy,
  ) {
    this.region = page.getByRole("region", {
      name: copy.head.title,
      exact: true,
    });
    this.head = new SectionHead(this.region, copy.head);
    this.photo = this.region.getByRole("img", {
      name: copy.photoAlt,
      exact: true,
    });
  }

  /** Asserts the section reads its head, the lead, each paragraph, then the photo. */
  async expectReadingOrder(): Promise<void> {
    const { lead, paragraphs, photoAlt } = this.copy;
    await expect(this.region).toMatchAriaSnapshot(
      this.head.sectionSnapshot([
        `- paragraph: ${quoted(lead)}`,
        ...paragraphs.map((paragraph) => `- paragraph: ${quoted(paragraph)}`),
        `- img ${quoted(photoAlt)}`,
      ]),
    );
  }

  /**
   * Brings the photo into view, waits until the browser has decoded it, and returns the URL of
   * the file the browser chose to load.
   */
  async loadedPhotoUrl(): Promise<string> {
    await this.photo.scrollIntoViewIfNeeded();
    await expect(this.photo).toHaveJSProperty("complete", true);
    await expect(this.photo).not.toHaveJSProperty("naturalWidth", 0);
    return this.photo.evaluate(
      (image) => (image as HTMLImageElement).currentSrc,
    );
  }
}
