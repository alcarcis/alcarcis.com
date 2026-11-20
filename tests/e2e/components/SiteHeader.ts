import type { Locator, Page } from "@playwright/test";
import type { HeaderCopy } from "../data/locales";
import { ThemeToggle } from "./ThemeToggle";

/** The cursor's own animations: how many times it blinks and when the last one ends. */
export interface CursorBlink {
  readonly animations: number;
  readonly cycles: number;
  /** Milliseconds from the page's start of the animation to its end; 0 with none. */
  readonly endTime: number;
}

export class SiteHeader {
  readonly banner: Locator;
  readonly ownerLink: Locator;
  /** The name as the bar shows it; the link's accessible name comes from its aria-label. */
  readonly ownerName: Locator;
  /** The `//_` mark, drawn as decoration inside the owner link. */
  readonly mark: Locator;
  readonly markSlashes: Locator;
  readonly markCursor: Locator;
  readonly linkedInLink: Locator;
  readonly gitHubLink: Locator;
  readonly themeToggle: ThemeToggle;

  constructor(page: Page, copy: HeaderCopy) {
    this.banner = page.getByRole("banner");
    this.ownerLink = this.link(copy.ownerLinkName);
    this.ownerName = this.ownerLink.getByText(copy.ownerName, { exact: true });
    // The mark is aria-hidden, so it has no role or name to find it by: these use its markup.
    this.mark = this.ownerLink.locator("svg");
    this.markSlashes = this.mark.locator("[data-logo-part='slash']");
    this.markCursor = this.mark.locator("[data-logo-part='cursor']");
    this.linkedInLink = this.link(copy.linkedInName);
    this.gitHubLink = this.link(copy.gitHubName);
    this.themeToggle = new ThemeToggle(this.banner, copy.themeToggle);
  }

  /** Reads the cursor's animations as the page runs them. */
  async cursorBlink(): Promise<CursorBlink> {
    return this.markCursor.evaluate((cursor) => {
      const timings = cursor
        .getAnimations()
        .map((animation) => animation.effect?.getComputedTiming());
      return {
        animations: timings.length,
        cycles: Math.max(
          0,
          ...timings.map((timing) => timing?.iterations ?? 0),
        ),
        endTime: Math.max(
          0,
          ...timings.map((timing) => Number(timing?.endTime ?? 0)),
        ),
      };
    });
  }

  /** Jumps every cursor animation to its end, as if the blinking had run its course. */
  async finishCursorBlink(): Promise<void> {
    await this.markCursor.evaluate((cursor) => {
      for (const animation of cursor.getAnimations()) animation.finish();
    });
  }

  private link(name: string): Locator {
    return this.banner.getByRole("link", { name, exact: true });
  }
}
