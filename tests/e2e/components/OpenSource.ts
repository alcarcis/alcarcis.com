import { expect, type Locator, type Page } from "@playwright/test";
import type { OpenSourceCopy, RepositoryCopy } from "../data/locales";
import {
  printedNumber,
  printedNumbers,
  quoted,
  SectionHead,
} from "./SectionHead";
import { UsageTerminal } from "./UsageTerminal";

/** One repository's row: what it is, where it lives, and its README's usage. */
export class RepositoryRow {
  readonly row: Locator;
  readonly terminal: UsageTerminal;

  constructor(
    page: Page,
    region: Locator,
    readonly copy: RepositoryCopy,
  ) {
    // The inner locator is matched inside each list item, so it starts from the page.
    this.row = region.getByRole("listitem").filter({
      has: page.getByRole("heading", {
        level: 3,
        name: copy.repository.name,
        exact: true,
      }),
    });
    this.terminal = new UsageTerminal(this.row);
  }
}

export class OpenSource {
  readonly region: Locator;
  readonly head: SectionHead;
  /** The two-digit numbers printed beside the repositories. */
  readonly rowNumbers: Locator;
  readonly repositories: readonly RepositoryRow[];

  constructor(
    page: Page,
    private readonly copy: OpenSourceCopy,
  ) {
    this.region = page.getByRole("region", {
      name: copy.head.title,
      exact: true,
    });
    this.head = new SectionHead(this.region, copy.head);
    this.rowNumbers = this.region.getByText(printedNumber);
    this.repositories = copy.repositories.map(
      (repository) => new RepositoryRow(page, this.region, repository),
    );
  }

  /** "01", "02", … one per repository, in list order. */
  get expectedRowNumbers(): string[] {
    return printedNumbers(this.copy.repositories.length);
  }

  /**
   * Asserts the section reads its head, then one list whose items each hold the repository's
   * name as a level-3 heading, its description, the link to its page and the usage summary, in
   * order, and nothing more: the printed numbers and the terminal stay out of what assistive
   * technology reads, since the list numbers its items and the summary says what the terminal
   * shows.
   */
  async expectReadingOrder(): Promise<void> {
    await expect(this.region).toMatchAriaSnapshot(
      this.head.sectionSnapshot([
        "- list:",
        ...this.copy.repositories.flatMap(
          ({ repository, description, usageSummary }) => [
            "  - listitem:",
            `    - heading ${quoted(repository.name)} [level=3]`,
            `    - paragraph: ${quoted(description)}`,
            `    - link ${quoted(repository.linkText)}:`,
            `      - /url: ${repository.url}`,
            `    - paragraph: ${quoted(usageSummary)}`,
          ],
        ),
      ]),
    );
  }
}
