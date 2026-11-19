import type { Page } from "@playwright/test";

/**
 * The page's clipboard as a test sets it up: granted, refusing every write, or missing. A refusal
 * or a removal must be set before the page opens, so the page's scripts only ever see it.
 */
export class ClipboardControl {
  constructor(private readonly page: Page) {}

  /** Lets the page write to the clipboard, and the test read back what it wrote. */
  async grant(): Promise<void> {
    await this.page
      .context()
      .grantPermissions(["clipboard-read", "clipboard-write"]);
  }

  /** Makes every write fail, as a browser does when the visitor or a policy refuses it. */
  async refuseWrites(): Promise<void> {
    await this.page.addInitScript(() => {
      Clipboard.prototype.writeText = () =>
        Promise.reject(
          new DOMException("Write permission denied.", "NotAllowedError"),
        );
    });
  }

  /** Takes the clipboard away, as a page served without HTTPS has none. */
  async remove(): Promise<void> {
    await this.page.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, "clipboard", {
        get: () => undefined,
      });
    });
  }

  async read(): Promise<string> {
    return this.page.evaluate(() => navigator.clipboard.readText());
  }
}

/** A way the clipboard can fail the copy button. */
export interface ClipboardRefusal {
  readonly description: string;
  readonly apply: (clipboard: ClipboardControl) => Promise<void>;
}

export const clipboardRefusals: readonly ClipboardRefusal[] = [
  {
    description: "refuses the write",
    apply: (clipboard) => clipboard.refuseWrites(),
  },
  { description: "is missing", apply: (clipboard) => clipboard.remove() },
];
