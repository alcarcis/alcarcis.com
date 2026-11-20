import type { Page } from "@playwright/test";

/** One code element and the first family its font names. */
export interface CodeFace {
  readonly element: string;
  readonly family: string;
}

/** The page's mono face: the first family of the `--font-mono` token. */
export async function monoFamily(page: Page): Promise<string> {
  return page.evaluate(() => {
    const stack = getComputedStyle(document.documentElement).getPropertyValue(
      "--font-mono",
    );
    return (/^\s*("[^"]*"|[^,]+)/.exec(stack)?.[1] ?? "")
      .trim()
      .replaceAll('"', "");
  });
}

/**
 * The first family of every code, preformatted, keyboard and sample element on the page. The
 * browser's own stylesheet sets these in its generic monospace, so they lose the page's mono
 * face unless the page's styles set it on them.
 */
export async function codeFaces(page: Page): Promise<CodeFace[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll("code, pre, kbd, samp")].map((element) => {
      const { fontFamily } = getComputedStyle(element);
      const family = (/^\s*("[^"]*"|[^,]+)/.exec(fontFamily)?.[1] ?? "")
        .trim()
        .replaceAll('"', "");
      const marker =
        [...element.attributes]
          .filter(({ name }) => name === "class" || name.startsWith("data-"))
          .map(({ name, value }) => (value ? `${name}="${value}"` : name))
          .join(" ") || "no attributes";
      return {
        element: `${element.localName} (${marker})`,
        family,
      };
    }),
  );
}
