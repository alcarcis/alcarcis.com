import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";

type AxeResults = Awaited<ReturnType<AxeBuilder["analyze"]>>;
/** One rule's outcome for the nodes it passed, failed or left for review. */
type RuleResult = AxeResults["passes"][number];
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

const targetsOf = (results: readonly RuleResult[], ruleId: string): string[] =>
  results
    .filter((result) => result.id === ruleId)
    .flatMap((result) => result.nodes.map(selectorOf));

const describeViolation = (violation: Violation, position: number): string =>
  [
    `${position}. ${violation.id} (${violation.impact ?? "unknown impact"}): ${violation.help}`,
    `   Help: ${violation.helpUrl}`,
    "   Targets:",
    ...violation.nodes.map((node) => `   - ${selectorOf(node)}`),
  ].join("\n");

export class AccessibilityReport {
  constructor(
    readonly violations: readonly Violation[],
    private readonly passes: readonly RuleResult[] = [],
    /** Outcomes axe could not decide and left for manual review; they never fail a scan. */
    private readonly undecided: readonly RuleResult[] = [],
  ) {}

  get ruleIds(): string[] {
    return this.violations.map((violation) => violation.id);
  }

  /** Selectors of the elements a rule decided on: the ones it passed and the ones it failed. */
  targetsDecidedBy(ruleId: string): string[] {
    return targetsOf([...this.passes, ...this.violations], ruleId);
  }

  /**
   * Selectors of the elements a rule reached but could not decide on, such as text over a
   * background gradient. They pass the scan silently, so nothing about them is verified.
   */
  targetsUndecidedBy(ruleId: string): string[] {
    return targetsOf(this.undecided, ruleId);
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
    return new AccessibilityReport(
      results.violations,
      results.passes,
      results.incomplete,
    );
  }
}

/** How many of the given selectors name an element inside the region. */
export async function countTargetsWithin(
  region: Locator,
  targets: readonly string[],
): Promise<number> {
  return region.evaluate(
    (root, selectors) =>
      selectors.filter((selector) => {
        const element = document.querySelector(selector);
        return element !== null && root.contains(element);
      }).length,
    targets,
  );
}
