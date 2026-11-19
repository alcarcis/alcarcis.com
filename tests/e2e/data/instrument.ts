import { minimumCategoryScore } from "../../../scripts/quality-budget";
import { sceneEnd } from "../../../src/scripts/instrument/timeline";

/** Terminal vocabulary: the same in every language, as a real test log would be. */
export const stageNames = [
  "requirements",
  "design",
  "code",
  "ci/cd",
  "production",
] as const;

export const runStatus = { passed: "Passed", running: "Running" } as const;

/** The verdict the scene's text frame shows, before (and without) the glyph renderer. */
export const sceneVerdict = "PASSED";

/** The scene time of the run's last frame, the one shown under reduced motion. */
export const finalSceneTime = sceneEnd;

/** The lazily loaded chunk that draws the scene and the page's grain. */
export const glyphRendererUrl = /glyph-renderer/;

export const specSource =
  "test('quality, end to end', async () => { for (const stage of development) await expect(stage).toHaveQuality(); });";

export const dataTerms = {
  commit: "COMMIT",
  built: "BUILT",
  tests: "TESTS",
  budget: "BUDGET",
} as const;

/**
 * The thresholds the pipeline enforces: Lighthouse's minimum read from the module
 * lighthouserc.cjs asserts, and axe's zero, which toHaveNoViolations allows by construction.
 */
export const budget = `lighthouse ≥ ${Math.round(minimumCategoryScore * 100)} · axe 0 violations`;

export const testCountText = (count: number): string =>
  `${count} playwright ${count === 1 ? "test" : "tests"}`;
