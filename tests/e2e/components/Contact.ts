import { expect, type Locator, type Page } from "@playwright/test";
import { emailAddress, type CopyOutcome } from "../data/contact";
import {
  contactEmailHref,
  type ContactCopy,
  type FactRowCopy,
  type LinkRowCopy,
  type ReportCopy,
} from "../data/locales";
import { quoted, SectionHead } from "./SectionHead";

/** Aria snapshot lines for a row that links somewhere: its term, then its link. */
const linkRowLines = ({ term, link, url }: LinkRowCopy): string[] => [
  `- term: ${quoted(term)}`,
  "- definition:",
  `  - link ${quoted(link)}:`,
  `    - /url: ${url}`,
];

/** Aria snapshot lines for a row that states a fact: its term, then the fact. */
const factRowLines = ({ term, fact }: FactRowCopy): string[] => [
  `- term: ${quoted(term)}`,
  `- definition: ${quoted(fact)}`,
];

/** The report nested in Contact: how this site is tested, row by row. */
export class Report {
  readonly region: Locator;

  constructor(
    scope: Locator,
    private readonly copy: ReportCopy,
  ) {
    this.region = scope.getByRole("region", { name: copy.title, exact: true });
  }

  /** Its aria snapshot lines: the region, its level-3 heading, then its rows in order. */
  snapshotLines(): string[] {
    const { title, facts, source } = this.copy;
    return [
      `- region ${quoted(title)}:`,
      ...[
        `- heading ${quoted(title)} [level=3]`,
        ...facts.flatMap(factRowLines),
        ...linkRowLines(source),
      ].map((line) => `  ${line}`),
    ];
  }
}

export class Contact {
  readonly region: Locator;
  readonly head: SectionHead;
  /** The address, shown as the link that opens an email. */
  readonly emailLink: Locator;
  /** The section's only button: its name is its label, which changes as it reports. */
  readonly copyButton: Locator;
  /** The polite live region that announces what the copy button did. */
  readonly announcement: Locator;
  readonly report: Report;

  constructor(
    private readonly page: Page,
    private readonly copy: ContactCopy,
  ) {
    this.region = page.getByRole("region", {
      name: copy.head.title,
      exact: true,
    });
    this.head = new SectionHead(this.region, copy.head);
    this.emailLink = this.region.getByRole("link", {
      name: emailAddress,
      exact: true,
    });
    this.copyButton = this.region.getByRole("button");
    this.announcement = this.region.getByRole("status");
    this.report = new Report(this.region, copy.report);
  }

  async copyAddress(): Promise<void> {
    await this.copyButton.click();
  }

  /** The text the visitor has selected on the page. */
  async selectedText(): Promise<string> {
    return this.page.evaluate(() => getSelection()?.toString() ?? "");
  }

  /** Asserts the button shows the outcome as its label and the live region announces it. */
  async expectReported(outcome: CopyOutcome): Promise<void> {
    await expect(this.copyButton).toHaveAccessibleName(
      this.copy.copyLabels[outcome],
    );
    await expect(this.announcement).toHaveText(
      this.copy.announcements[outcome],
    );
  }

  /** Asserts the button shows its own label again and the live region has gone quiet. */
  async expectAtRest(): Promise<void> {
    await expect(this.copyButton).toHaveAccessibleName(
      this.copy.copyLabels.idle,
    );
    await expect(this.announcement).toHaveText("");
  }

  /**
   * Asserts the section reads its head, the address as a link, the copy button and its live
   * region, the profile and CV rows, then the report and its rows, and nothing more.
   */
  async expectReadingOrder(): Promise<void> {
    await expect(this.region).toMatchAriaSnapshot(
      this.head.sectionSnapshot([
        `- link ${quoted(emailAddress)}:`,
        `  - /url: ${contactEmailHref}`,
        `- button ${quoted(this.copy.copyLabels.idle)}`,
        "- status",
        ...this.copy.rows.flatMap(linkRowLines),
        ...this.report.snapshotLines(),
      ]),
    );
  }
}
