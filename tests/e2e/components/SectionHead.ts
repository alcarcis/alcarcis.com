import { expect, type Locator } from "@playwright/test";
import type { SectionHeadCopy } from "../data/locales";

/** Quotes copy for an aria snapshot template, so punctuation in it is read literally. */
export const quoted = (text: string): string => JSON.stringify(text);

/** The two-digit numbers a section prints beside its rows: "01", "02", … one per row. */
export const printedNumbers = (count: number): string[] =>
  Array.from({ length: count }, (_, index) =>
    String(index + 1).padStart(2, "0"),
  );

/** Text that is a row's printed number and nothing else. */
export const printedNumber = /^\d{2}$/;

/** The head that opens a section: its test case code, then the section title. */
export class SectionHead {
  /** The code, an abbreviation whose title says what it stands for. */
  readonly code: Locator;
  readonly heading: Locator;

  constructor(
    region: Locator,
    private readonly copy: SectionHeadCopy,
  ) {
    this.code = region.getByTitle(copy.codeTitle, { exact: true });
    this.heading = region.getByRole("heading", {
      level: 2,
      name: copy.title,
      exact: true,
    });
  }

  /** Asserts the title shows as a level-2 heading, labelled by its visible test case code. */
  async expectShown(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.code).toBeVisible();
    await expect(this.code).toHaveText(this.copy.code);
  }

  /**
   * An aria snapshot template for the whole section, read exactly: the region named by the
   * title, the code, the title as a level-2 heading, then the body lines in order and nothing
   * else. Body lines nest their own children with two more spaces per level.
   */
  sectionSnapshot(bodyLines: readonly string[]): string {
    const { code, title } = this.copy;
    return [
      `- region ${quoted(title)}:`,
      "  - /children: deep-equal",
      `  - text: ${quoted(code)}`,
      `  - heading ${quoted(title)} [level=2]`,
      ...bodyLines.map((line) => `  ${line}`),
    ].join("\n");
  }
}
