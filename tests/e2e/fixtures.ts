import { test as base, expect as baseExpect } from "@playwright/test";
import { HomePage } from "./pages/HomePage";
import {
  AccessibilityScanner,
  type AccessibilityReport,
} from "./support/accessibility";
import {
  ConsoleErrorCollector,
  type ConsoleErrorReport,
} from "./support/console";

interface Fixtures {
  homePage: HomePage;
  accessibilityScanner: AccessibilityScanner;
  consoleErrors: ConsoleErrorCollector;
}

export const test = base.extend<Fixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  accessibilityScanner: async ({ page }, use) => {
    await use(new AccessibilityScanner(page));
  },
  consoleErrors: async ({ page }, use) => {
    await use(new ConsoleErrorCollector(page));
  },
});

export const expect = baseExpect.extend({
  toHaveNoViolations(report: AccessibilityReport) {
    const count = report.violations.length;
    return {
      name: "toHaveNoViolations",
      pass: count === 0,
      message: () =>
        count === 0
          ? "Expected accessibility violations, but the scan found none."
          : `Expected no accessibility violations, but the scan found ${count}:\n\n${report.summary()}`,
    };
  },
  toHaveNoConsoleErrors(report: ConsoleErrorReport) {
    const count = report.errors.length;
    return {
      name: "toHaveNoConsoleErrors",
      pass: count === 0,
      message: () =>
        count === 0
          ? "Expected console errors, failed assertions or uncaught exceptions, but the page logged none."
          : `Expected no console errors, failed assertions or uncaught exceptions, but the page logged ${count}:\n\n${report.summary()}`,
    };
  },
});
