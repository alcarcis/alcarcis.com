import type { Locator } from "@playwright/test";

/**
 * A repository's terminal: a window bar and the README's usage lines. The lines are hidden
 * from assistive technology, which reads the usage summary beside them instead, so they have
 * no role to find them by.
 */
export class UsageTerminal {
  /** The window: its bar and its lines. */
  readonly window: Locator;
  /** The printed lines. */
  readonly lines: Locator;

  constructor(row: Locator) {
    this.window = row.locator("[data-usage-terminal]");
    this.lines = this.window.locator("pre");
  }

  /** The characters a reader can see, in order, with their line breaks. */
  async visibleText(): Promise<string> {
    return this.lines.evaluate((pre) => {
      const walker = document.createTreeWalker(pre, NodeFilter.SHOW_TEXT);
      let text = "";
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const visible = node.parentElement?.checkVisibility({
          visibilityProperty: true,
        });
        if (visible) text += node.textContent ?? "";
      }
      return text;
    });
  }

  /** Every character the lines hold, shown or not. */
  async allText(): Promise<string> {
    return this.lines.evaluate((pre) => pre.textContent ?? "");
  }
}
