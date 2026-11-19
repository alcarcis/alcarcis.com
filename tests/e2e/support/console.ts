import type { ConsoleMessage, Page } from "@playwright/test";

export type ConsoleErrorKind =
  "console error" | "failed assertion" | "uncaught exception";

export interface ConsoleError {
  readonly kind: ConsoleErrorKind;
  readonly text: string;
  readonly source: string;
}

const reportedConsoleTypes: ReadonlyMap<string, ConsoleErrorKind> = new Map([
  ["error", "console error"],
  ["assert", "failed assertion"],
]);

const sourceOf = (message: ConsoleMessage): string => {
  const { url, lineNumber, columnNumber } = message.location();
  return url === ""
    ? "unknown source"
    : `${url}:${lineNumber + 1}:${columnNumber + 1}`;
};

const describeError = (error: ConsoleError, position: number): string =>
  `${position}. ${error.kind} at ${error.source}: ${error.text}`;

export class ConsoleErrorReport {
  constructor(readonly errors: readonly ConsoleError[]) {}

  summary(): string {
    return this.errors
      .map((error, index) => describeError(error, index + 1))
      .join("\n");
  }
}

export class ConsoleErrorCollector {
  private readonly errors: ConsoleError[] = [];

  constructor(page: Page) {
    page.on("console", (message) => {
      const kind = reportedConsoleTypes.get(message.type());
      if (kind !== undefined) {
        this.errors.push({
          kind,
          text: message.text(),
          source: sourceOf(message),
        });
      }
    });
    page.on("pageerror", (error) => {
      this.errors.push({
        kind: "uncaught exception",
        text: `${error.name}: ${error.message}`,
        source: page.url(),
      });
    });
  }

  report(): ConsoleErrorReport {
    return new ConsoleErrorReport([...this.errors]);
  }
}
