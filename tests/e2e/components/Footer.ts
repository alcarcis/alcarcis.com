import { expect, type Locator, type Page } from "@playwright/test";
import { copyrightLine } from "../data/footer";
import type { FooterCopy } from "../data/locales";
import type { CreditSegment } from "../data/tools";
import { quoted } from "./SectionHead";

/** An aria snapshot line for one stretch of the credits line, indented under its paragraph. */
const creditLine = (segment: CreditSegment): string[] =>
  typeof segment === "string"
    ? [`  - text: ${quoted(segment.trim())}`]
    : [`  - link ${quoted(segment.link)}:`, `    - /url: ${segment.url}`];

/** The site footer: the page's content info, after its main content. */
export class Footer {
  readonly landmark: Locator;
  readonly copyright: Locator;
  readonly privacyNote: Locator;
  /** The small print that credits the logos. */
  readonly credits: Locator;

  constructor(
    page: Page,
    private readonly copy: FooterCopy,
  ) {
    this.landmark = page.getByRole("contentinfo");
    this.copyright = this.landmark.getByText(copyrightLine);
    this.privacyNote = this.landmark.getByText(copy.privacyNote, {
      exact: true,
    });
    this.credits = this.landmark
      .getByRole("paragraph")
      .filter({ has: page.getByRole("link") });
  }

  /** The links the credits line holds, as name and address, in order. */
  get expectedCreditLinks(): { name: string; url: string }[] {
    return this.copy.credits.flatMap((segment) =>
      typeof segment === "string"
        ? []
        : [{ name: segment.link, url: segment.url }],
    );
  }

  /** The year the copyright line states. */
  async copyrightYear(): Promise<string> {
    const line = (await this.copyright.textContent()) ?? "";
    const year = copyrightLine.exec(line.trim())?.[1];
    if (!year) throw new Error(`No year in the copyright line "${line}".`);
    return year;
  }

  /**
   * Asserts the footer reads the copyright line, the privacy note, then the logo credits and
   * their links, and nothing more.
   */
  async expectReadingOrder(): Promise<void> {
    await expect(this.landmark).toMatchAriaSnapshot(
      [
        "- contentinfo:",
        "  - /children: deep-equal",
        `  - paragraph: ${copyrightLine.toString()}`,
        `  - paragraph: ${quoted(this.copy.privacyNote)}`,
        "  - paragraph:",
        ...this.copy.credits.flatMap(creditLine).map((line) => `  ${line}`),
      ].join("\n"),
    );
  }
}
