import { expect, type Locator, type Page } from "@playwright/test";
import {
  menuProfileLinks,
  sectionAnchors,
  type SectionAnchor,
  type SectionsNavCopy,
} from "../data/sectionsNav";
import { quoted } from "./SectionHead";

/**
 * The header's links to the page sections: inline on wide screens, behind a menu button on
 * narrower ones, where the menu also takes in the profile links on phones.
 */
export class SectionsNav {
  readonly landmark: Locator;
  readonly list: Locator;
  readonly menuButton: Locator;

  constructor(
    page: Page,
    private readonly copy: SectionsNavCopy,
  ) {
    const banner = page.getByRole("banner");
    this.landmark = banner.getByRole("navigation", {
      name: copy.navName,
      exact: true,
    });
    this.list = this.landmark.getByRole("list");
    this.menuButton = banner.getByRole("button", {
      name: copy.menuButtonName,
      exact: true,
    });
  }

  /** The link to a section, while it is shown. */
  link(anchor: SectionAnchor): Locator {
    return this.landmark.getByRole("link", {
      name: this.copy.linkNames[anchor],
      exact: true,
    });
  }

  /** A profile link inside the menu, while it is shown. */
  profileLink(name: string): Locator {
    return this.landmark.getByRole("link", { name, exact: true });
  }

  /** Opens the menu with the button and waits for its links. */
  async openMenu(): Promise<void> {
    await this.menuButton.click();
    await expect(this.list).toBeVisible();
  }

  /** Asserts whether the menu button says its menu is open. */
  async expectMenuExpanded(expanded: boolean): Promise<void> {
    await expect(this.menuButton).toHaveAttribute(
      "aria-expanded",
      String(expanded),
    );
  }

  /**
   * Asserts that only the given section's link is marked current, or none of them. The links
   * are found by their target whether or not they are shown, so the mark is read behind a
   * closed menu too (a hidden link's computed name would take in its hidden brackets).
   */
  async expectCurrent(anchor: SectionAnchor | null): Promise<void> {
    for (const candidate of sectionAnchors) {
      const link = this.landmark.locator(`a[href="#${candidate}"]`);
      if (candidate === anchor) {
        await expect(link).toHaveAttribute("aria-current", "true");
      } else {
        await expect(link).not.toHaveAttribute("aria-current");
      }
    }
  }

  /**
   * Asserts the nav reads one list of links to the sections, in page order, each to its
   * English anchor, followed by the profile links when the menu holds them.
   */
  async expectReadingOrder(
    options: { withProfileLinks: boolean } = { withProfileLinks: false },
  ): Promise<void> {
    const sectionItems = sectionAnchors.flatMap((anchor) => [
      "    - listitem:",
      `      - link ${quoted(this.copy.linkNames[anchor])}:`,
      `        - /url: "#${anchor}"`,
    ]);
    const profileItems = options.withProfileLinks
      ? menuProfileLinks.flatMap(({ name, url }) => [
          "    - listitem:",
          `      - link ${quoted(name)}:`,
          `        - /url: ${url}`,
        ])
      : [];
    await expect(this.landmark).toMatchAriaSnapshot(
      [
        `- navigation ${quoted(this.copy.navName)}:`,
        "  - /children: deep-equal",
        "  - list:",
        ...sectionItems,
        ...profileItems,
      ].join("\n"),
    );
  }
}
