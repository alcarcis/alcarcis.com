import { expect, type Locator, type Page } from "@playwright/test";
import type { ToolsCopy } from "../data/locales";
import { toolNamesByGroup } from "../data/tools";
import { quoted, SectionHead } from "./SectionHead";

export class Tools {
  readonly region: Locator;
  readonly head: SectionHead;

  constructor(
    private readonly page: Page,
    private readonly copy: ToolsCopy,
  ) {
    this.region = page.getByRole("region", {
      name: copy.head.title,
      exact: true,
    });
    this.head = new SectionHead(this.region, copy.head);
  }

  /** The list item that names the tool. */
  tool(name: string): Locator {
    return this.region.getByRole("listitem").filter({
      has: this.page.getByText(name, { exact: true }),
    });
  }

  /** The tool's logo: decorative, so hidden from assistive technology and found by its hook. */
  logo(name: string): Locator {
    return this.tool(name).locator("[data-tool-logo]");
  }

  /**
   * The address of the file the logo shows on the current ground: an image's source, or a
   * mask's file. Empty while the section holds its marks' files back.
   */
  async logoUrl(name: string): Promise<string> {
    return this.logo(name).evaluate((logo) => {
      const art = [...logo.children].find((child) => child.checkVisibility());
      if (art instanceof HTMLImageElement) return art.src;
      const mask = art ? getComputedStyle(art).maskImage : "";
      return /url\("?([^")]+)"?\)/.exec(mask)?.[1] ?? "";
    });
  }

  /** Brings the section into view; its logos load once it comes near. */
  async scrollIntoView(): Promise<void> {
    await this.head.heading.scrollIntoViewIfNeeded();
  }

  /** Waits until every tool's logo names its file, as it does once the section is near. */
  async waitForLogos(): Promise<void> {
    for (const name of this.toolNames) {
      await expect
        .poll(() => this.logoUrl(name), { message: name })
        .not.toBe("");
    }
  }

  /** The image files of this site the page has requested so far, by address. */
  async requestedImageFiles(): Promise<string[]> {
    return this.page.evaluate(() =>
      performance
        .getEntriesByType("resource")
        .map((entry) => entry.name)
        .filter((name) => /\/_astro\/[^/]+\.svg$/.test(name)),
    );
  }

  /** Every tool on the page, group by group. */
  get toolNames(): string[] {
    return toolNamesByGroup.flat();
  }

  /**
   * Asserts the section reads its head, then each group's title as a level-3 heading followed
   * by a list named by it, holding its tools' names and nothing more: the logos stay out, and
   * their credits are the footer's.
   */
  async expectReadingOrder(): Promise<void> {
    const groups = this.copy.groupNames.flatMap((groupName, index) => [
      `- heading ${quoted(groupName)} [level=3]`,
      `- list ${quoted(groupName)}:`,
      ...(toolNamesByGroup[index] ?? []).map(
        (toolName) => `  - listitem: ${quoted(toolName)}`,
      ),
    ]);
    await expect(this.region).toMatchAriaSnapshot(
      this.head.sectionSnapshot(groups),
    );
  }
}
