import { expect, type Locator, type Page } from "@playwright/test";
import {
  emailAddress,
  type CopyOutcome,
  certificateDecor,
} from "../data/contact";
import {
  contactEmailHref,
  type CertificateCopy,
  type ContactCopy,
  type FactRowCopy,
  type LinkRowCopy,
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

const escapeRegExp = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

/** A commit hash as the certificate shows it: its first seven hex digits. */
const shortSha = "[0-9a-f]{7}";

/** A box in CSS pixels, as the page lays it out. */
interface Box {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

/** How one row of the certificate lays out its term and its value. */
export interface RowLayout {
  readonly term: Box;
  readonly value: Box;
}

/** The certificate nested in Contact: how this site is tested, and the build it certifies. */
export class Certificate {
  readonly region: Locator;
  readonly heading: Locator;
  /** The commit hash, a link to the commit on GitHub. */
  readonly commitLink: Locator;

  constructor(
    scope: Locator,
    private readonly copy: CertificateCopy,
  ) {
    this.region = scope.getByRole("region", { name: copy.title, exact: true });
    this.heading = this.region.getByRole("heading", { level: 3 });
    this.commitLink = this.region.getByRole("link", {
      name: new RegExp(`^${shortSha} ${escapeRegExp(copy.commitLinkSuffix)}$`),
    });
  }

  /** The value a row shows next to its term, such as Built. */
  value(term: string): Locator {
    return this.region
      .getByRole("term")
      .filter({ hasText: new RegExp(`^${escapeRegExp(term)}$`) })
      .locator("xpath=following-sibling::*[1]");
  }

  /** One of the decorative layers: the frame, the seal, the watermark or the corners. */
  decor(kind: (typeof certificateDecor)[number]): Locator {
    return this.region.locator(`[data-decor="${kind}"]`);
  }

  /** Every element in the certificate that is drawn as an image or run as a script. */
  imagesAndScripts(): Locator {
    return this.region.locator("img, picture, canvas, script, iframe, object");
  }

  /** Its aria snapshot lines: the region, its level-3 heading, then its rows in order. */
  snapshotLines(): string[] {
    const { title, commitTerm, commitLinkSuffix, builtTerm, facts, source } =
      this.copy;
    const anyCount = 12345;
    const e2eFact = escapeRegExp(this.copy.e2eFact(anyCount)).replace(
      String(anyCount),
      "\\d+",
    );
    const commitPage = escapeRegExp(`${source.url}/commit/`);
    return [
      `- region ${quoted(title)}:`,
      ...[
        `- heading ${quoted(title)} [level=3]`,
        `- term: ${quoted(commitTerm)}`,
        "- definition:",
        `  - link /^${shortSha} ${escapeRegExp(commitLinkSuffix)}$/:`,
        `    - /url: /^${commitPage}[0-9a-f]{7,40}$/`,
        `- term: ${quoted(builtTerm)}`,
        "- definition:",
        "  - time: /^\\d{4}-\\d{2}-\\d{2}$/",
        '- term: "E2E"',
        `- definition: /^${e2eFact}$/`,
        ...facts.flatMap(factRowLines),
        ...linkRowLines(source),
      ].map((line) => `  ${line}`),
    ];
  }

  /**
   * The pieces of visible text the seal's box covers: the heading's and the rows' text, read
   * by the line boxes the page lays out, never the decoration's own.
   */
  async textUnderSeal(): Promise<string[]> {
    return this.region.evaluate((certificate) => {
      const seal = certificate.querySelector('[data-decor="seal"]');
      if (!seal) throw new Error("The certificate has no seal.");
      const sealBox = seal.getBoundingClientRect();
      const covered: string[] = [];
      const walker = document.createTreeWalker(
        certificate,
        NodeFilter.SHOW_TEXT,
      );
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node.textContent?.trim() ?? "";
        const parent = node.parentElement;
        if (!text || !parent || parent.closest('[aria-hidden="true"]')) {
          continue;
        }
        if (parent.closest(".visually-hidden")) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        const overlaps = [...range.getClientRects()].some(
          (line) =>
            line.width > 0 &&
            line.left < sealBox.right &&
            line.right > sealBox.left &&
            line.top < sealBox.bottom &&
            line.bottom > sealBox.top,
        );
        if (overlaps) covered.push(text);
      }
      return covered;
    });
  }

  /** Each row's term and value boxes, in order. */
  async rowLayouts(): Promise<RowLayout[]> {
    return this.region.evaluate((certificate) => {
      const box = (element: Element) => {
        const { left, top, right, bottom } = element.getBoundingClientRect();
        return { left, top, right, bottom };
      };
      return [...certificate.querySelectorAll("dt")].map((term) => {
        const value = term.nextElementSibling;
        if (!value) throw new Error(`${term.textContent} has no value.`);
        return { term: box(term), value: box(value) };
      });
    });
  }

  /** The width the certificate takes, in CSS pixels. */
  async width(): Promise<number> {
    const box = await this.region.boundingBox();
    if (!box) throw new Error("The certificate is not rendered.");
    return box.width;
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
  readonly certificate: Certificate;

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
    this.certificate = new Certificate(this.region, copy.certificate);
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
   * region, the CV row, then the certificate and its rows, and nothing more.
   */
  async expectReadingOrder(): Promise<void> {
    await expect(this.region).toMatchAriaSnapshot(
      this.head.sectionSnapshot([
        `- link ${quoted(emailAddress)}:`,
        `  - /url: ${contactEmailHref}`,
        `- button ${quoted(this.copy.copyLabels.idle)}`,
        "- status",
        ...this.copy.rows.flatMap(linkRowLines),
        ...this.certificate.snapshotLines(),
      ]),
    );
  }

  /** The address's font size, in CSS pixels. */
  async addressFontSize(): Promise<number> {
    return this.emailLink.evaluate((link) =>
      parseFloat(getComputedStyle(link).fontSize),
    );
  }
}
