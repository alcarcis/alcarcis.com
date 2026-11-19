import { expect, type Locator, type Page } from "@playwright/test";
import type { WorkCopy } from "../data/locales";
import { quoted, SectionHead } from "./SectionHead";

export class Work {
  readonly region: Locator;
  readonly head: SectionHead;
  /** The two-digit numbers printed beside the items. */
  readonly itemNumbers: Locator;

  constructor(
    page: Page,
    private readonly copy: WorkCopy,
  ) {
    this.region = page.getByRole("region", {
      name: copy.head.title,
      exact: true,
    });
    this.head = new SectionHead(this.region, copy.head);
    this.itemNumbers = this.region.getByText(/^\d{2}$/);
  }

  /** "01", "02", … one per item, in list order. */
  get expectedItemNumbers(): string[] {
    return this.copy.items.map((_, index) =>
      String(index + 1).padStart(2, "0"),
    );
  }

  /**
   * Asserts the section reads its head, then one list whose items each hold a level-3 title and
   * its description, in order, and nothing more: the printed numbers stay out of what assistive
   * technology reads, since the list already numbers its items.
   */
  async expectReadingOrder(): Promise<void> {
    await expect(this.region).toMatchAriaSnapshot(
      this.head.sectionSnapshot([
        "- list:",
        ...this.copy.items.flatMap(({ title, description }) => [
          "  - listitem:",
          `    - heading ${quoted(title)} [level=3]`,
          `    - paragraph: ${quoted(description)}`,
        ]),
      ]),
    );
  }
}
