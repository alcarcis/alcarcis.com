/** Terminal vocabulary: the same in every language, as a real test log would be. */
export const stageNames = [
  "requirements",
  "design",
  "code",
  "ci/cd",
  "production",
] as const;

export const runStatus = { passed: "Passed", running: "Running" } as const;

export const specSource =
  "test('quality, end to end', async () => { for (const stage of development) await expect(stage).toHaveQuality(); });";

export const dataTerms = {
  commit: "COMMIT",
  built: "BUILT",
  tests: "TESTS",
  budget: "BUDGET",
} as const;

export const budget = "lighthouse ≥ 95 · axe 0 violations";

export const testCountText = (count: number): string =>
  `${count} playwright ${count === 1 ? "test" : "tests"}`;
