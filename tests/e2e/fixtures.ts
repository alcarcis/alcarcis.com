import { test as base, expect as baseExpect } from "@playwright/test";
import { HomePage } from "./pages/HomePage";
import {
  AccessibilityScanner,
  type AccessibilityReport,
} from "./support/accessibility";

interface Fixtures {
  homePage: HomePage;
  accessibilityScanner: AccessibilityScanner;
}

export const test = base.extend<Fixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  accessibilityScanner: async ({ page }, use) => {
    await use(new AccessibilityScanner(page));
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
});
