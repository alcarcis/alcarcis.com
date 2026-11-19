import type { ConsoleErrorKind } from "../support/console";

export interface ConsoleCanary {
  readonly description: string;
  readonly document: string;
  readonly expected: {
    readonly kind: ConsoleErrorKind;
    readonly text: string;
  };
}

const documentRunning = (script: string): string =>
  `<!doctype html>
<html lang="en">
  <head><title>Console canary</title></head>
  <body><script>${script}</script></body>
</html>`;

export const consoleCanaries: readonly ConsoleCanary[] = [
  {
    description: "a console.error call",
    document: documentRunning(`console.error("Console canary");`),
    expected: { kind: "console error", text: "Console canary" },
  },
  {
    description: "a failed console.assert call",
    document: documentRunning(`console.assert(false, "Assertion canary");`),
    expected: { kind: "failed assertion", text: "Assertion canary" },
  },
  {
    description: "an uncaught exception",
    document: documentRunning(`throw new TypeError("Exception canary");`),
    expected: {
      kind: "uncaught exception",
      text: "TypeError: Exception canary",
    },
  },
];
