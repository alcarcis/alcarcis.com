import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

type AxeResults = Awaited<ReturnType<AxeBuilder["analyze"]>>;
type Violation = AxeResults["violations"][number];
type ViolationNode = Violation["nodes"][number];

export const wcagLevelAaTags: readonly string[] = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
];

const selectorOf = (node: ViolationNode): string =>
  node.target
    .map((part) => (Array.isArray(part) ? part.join(" >>> ") : part))
    .join(" ");

const describeViolation = (violation: Violation, position: number): string =>
  [
    `${position}. ${violation.id} (${violation.impact ?? "unknown impact"}): ${violation.help}`,
    `   Help: ${violation.helpUrl}`,
    "   Targets:",
    ...violation.nodes.map((node) => `   - ${selectorOf(node)}`),
  ].join("\n");

export class AccessibilityReport {
  constructor(readonly violations: readonly Violation[]) {}

  get ruleIds(): string[] {
    return this.violations.map((violation) => violation.id);
  }

  summary(): string {
    return this.violations
      .map((violation, index) => describeViolation(violation, index + 1))
      .join("\n\n");
  }
}

export class AccessibilityScanner {
  constructor(private readonly page: Page) {}

  async scan(): Promise<AccessibilityReport> {
    const results = await new AxeBuilder({ page: this.page })
      .withTags([...wcagLevelAaTags])
      .analyze();
    return new AccessibilityReport(results.violations);
  }
}
