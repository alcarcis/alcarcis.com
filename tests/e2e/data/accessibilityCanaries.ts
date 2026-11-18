export interface AccessibilityCanary {
  readonly description: string;
  readonly ruleId: string;
  readonly document: string;
}

const documentWithMain = (markup: string): string =>
  `<!doctype html>
<html lang="en">
  <head><title>Accessibility canary</title></head>
  <body><main>${markup}</main></body>
</html>`;

const transparentPixel =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export const accessibilityCanaries: readonly AccessibilityCanary[] = [
  {
    description: "an image without alternative text (level A)",
    ruleId: "image-alt",
    document: documentWithMain(
      `<img src="${transparentPixel}" width="1" height="1">`,
    ),
  },
  {
    description: "text below the AA contrast ratio (level AA)",
    ruleId: "color-contrast",
    document: documentWithMain(
      `<p style="color: #aaaaaa; background: #ffffff">Low contrast text</p>`,
    ),
  },
];
