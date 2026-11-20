import { expect, type Clock, type Locator } from "@playwright/test";

/**
 * What the typing script reports on the terminal: waiting off-screen with its lines hidden,
 * typing, done, or still (left as the page loaded it, because it was already on screen). The
 * attribute is absent where nothing types: without JavaScript or under reduced motion.
 */
export type TypingState = "waiting" | "typing" | "done" | "still";

/** How far the clock moves on per look while waiting for the first characters. */
const keystrokeWaitMs = 50;

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

  /**
   * How many CSS pixels the widest line runs past the window's inner edge, measured once the
   * face the lines render in has loaded: 0 when every line fits. On wide screens the lines
   * neither wrap nor scroll, so anything wider would be cut off without a sign.
   *
   * Only the first family of the lines' font is awaited: the families after it are fallbacks,
   * and the metric-matched one names a font installed on the system (`local()`), which a
   * machine may lack. Waiting for every face the full font matches then fails on such a machine
   * (a NetworkError on the Linux runner, which has no Courier New) though the lines render fine.
   */
  async clippedWidth(): Promise<number> {
    await this.waitForLinesFace();
    return this.lines.evaluate((pre) =>
      Math.max(0, pre.scrollWidth - pre.clientWidth),
    );
  }

  /**
   * The string literals and comments that would fit on one line but wrap onto more than one,
   * once the face the lines render in has loaded. Where the lines wrap, on phones, each of these
   * should move down whole rather than split mid-way; one wider than the window may wrap inside
   * itself, so it is not counted.
   */
  async tokensSplitAcrossLines(): Promise<string[]> {
    await this.waitForLinesFace();
    return this.lines.evaluate((pre) => {
      const style = getComputedStyle(pre);
      const lineWidth =
        pre.clientWidth -
        parseFloat(style.paddingInlineStart) -
        parseFloat(style.paddingInlineEnd);
      // Rects on one rendered line can differ by sub-pixels, so a new line starts only past
      // half a line height.
      const newLineGap = parseFloat(style.lineHeight) / 2;

      return [...pre.querySelectorAll(".string, .comment")]
        .filter((token) => {
          const range = document.createRange();
          range.selectNodeContents(token);
          const rects = [...range.getClientRects()].filter(
            (rect) => rect.width > 0,
          );
          const naturalWidth = rects.reduce((sum, rect) => sum + rect.width, 0);
          if (naturalWidth > lineWidth) return false;

          const tops = rects.map((rect) => rect.top).sort((a, b) => a - b);
          return tops.some(
            (top, index) => index > 0 && top - tops[index - 1]! > newLineGap,
          );
        })
        .map((token) => token.textContent ?? "");
    });
  }

  /** Waits until the first family of the lines' font has loaded (see `clippedWidth`). */
  private async waitForLinesFace(): Promise<void> {
    await this.lines.evaluate(async (pre) => {
      const { fontFamily, fontSize } = getComputedStyle(pre);
      const family = /^\s*("[^"]*"|[^,]+)/.exec(fontFamily)?.[1]?.trim();
      if (!family) {
        throw new Error(`No font family on the lines: ${fontFamily}`);
      }
      const font = `${fontSize} ${family}`;
      const faces = await document.fonts.load(font);
      if (faces.length === 0 || !document.fonts.check(font)) {
        throw new Error(`The lines' face ${family} did not load.`);
      }
    });
  }

  async expectTypingState(state: TypingState): Promise<void> {
    await expect(this.window).toHaveAttribute("data-typing", state);
  }

  async expectNoTyping(): Promise<void> {
    await expect(this.window).not.toHaveAttribute("data-typing");
  }

  /**
   * Scrolls the page at once to the terminal: into the middle of the viewport, or with its
   * bottom edge on the viewport's bottom edge.
   */
  async scrollIntoView(block: "center" | "end" = "center"): Promise<void> {
    await this.window.evaluate(
      (terminal, position) =>
        terminal.scrollIntoView({ block: position, behavior: "instant" }),
      block,
    );
  }

  /**
   * Scrolls the page at once so the terminal's top edge sits `pixels` above the viewport's
   * bottom edge, as if it had just scrolled into view from below.
   */
  async scrollToPeekIn(pixels: number): Promise<void> {
    await this.window.evaluate((terminal, shown) => {
      const { top } = terminal.getBoundingClientRect();
      window.scrollBy({ top: top - innerHeight + shown, behavior: "instant" });
    }, pixels);
  }

  /**
   * Typing starts on the browser's own view check, in real time; its keystrokes run on the
   * test's clock, so this moves the clock on in short steps until the first characters show.
   */
  async waitForFirstKeystrokes(clock: Clock): Promise<void> {
    await expect
      .poll(async () => {
        await clock.runFor(keystrokeWaitMs);
        return (await this.visibleText()).length;
      })
      .toBeGreaterThan(0);
  }
}
