import {
  test as base,
  expect as baseExpect,
  type Clock,
} from "@playwright/test";
import { HomePage } from "./pages/HomePage";
import {
  AccessibilityScanner,
  type AccessibilityReport,
} from "./support/accessibility";
import {
  ConsoleErrorCollector,
  type ConsoleErrorReport,
} from "./support/console";
import {
  TransitionRecorder,
  type TransitionReport,
} from "./support/transitions";

interface Fixtures {
  homePage: HomePage;
  /** The home page in a second tab of the same browser context, so both share storage. */
  otherTab: HomePage;
  /** The page clock, installed and paused before the page loads: time moves only on runFor. */
  frozenClock: Clock;
  accessibilityScanner: AccessibilityScanner;
  consoleErrors: ConsoleErrorCollector;
  transitionRecorder: TransitionRecorder;
}

export const test = base.extend<Fixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  otherTab: async ({ context }, use) => {
    await use(new HomePage(await context.newPage()));
  },
  frozenClock: async ({ page }, use) => {
    const start = new Date("2026-11-18T12:00:00Z").getTime();
    await page.clock.install({ time: start });
    await page.clock.pauseAt(start + 1000);
    await use(page.clock);
  },
  accessibilityScanner: async ({ page }, use) => {
    await use(new AccessibilityScanner(page));
  },
  consoleErrors: async ({ page }, use) => {
    await use(new ConsoleErrorCollector(page));
  },
  transitionRecorder: async ({ page }, use) => {
    await use(new TransitionRecorder(page));
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
  toStartColourTransitions(report: TransitionReport) {
    const count = report.colourTransitions.length;
    return {
      name: "toStartColourTransitions",
      pass: count > 0,
      message: () =>
        count > 0
          ? `Expected no colour transitions, but ${count} started:\n\n${report.summary()}`
          : "Expected colour transitions, but none started.",
    };
  },
});
