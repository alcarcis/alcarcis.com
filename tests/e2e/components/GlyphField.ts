import type { Locator, Page } from "@playwright/test";

/** A canvas's backing store in device pixels. */
export interface CanvasBuffer {
  readonly width: number;
  readonly height: number;
}

/** The page's grain: a fixed canvas behind the content. Decorative and hidden from assistive technology. */
export class GlyphField {
  readonly canvas: Locator;

  constructor(page: Page) {
    this.canvas = page.locator("canvas[data-glyph-field]");
  }

  /** 0 × 0 until the glyph renderer sizes it. */
  async buffer(): Promise<CanvasBuffer> {
    return this.canvas.evaluate((canvas: HTMLCanvasElement) => ({
      width: canvas.width,
      height: canvas.height,
    }));
  }
}

export const unsizedCanvas: CanvasBuffer = { width: 0, height: 0 };
