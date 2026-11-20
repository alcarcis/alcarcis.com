import { finalFrame } from "../../../src/scripts/glyphs/final-frame";
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

/** The scene's last frame, line by line, as its text frame shows it before (and without) the
    glyph renderer: every job of the workflow run checked, and production deployed. */
export const finalFrameLines = finalFrame.map((line) =>
  line.map(([, text]) => text).join(""),
);

/** The scene time of the run's last frame, the one shown under reduced motion. */
export const finalSceneTime = sceneEnd;

/** The lazily loaded chunk that draws the scene and the page's grain. */
export const glyphRendererUrl = /glyph-renderer/;

export const specSource =
  "test('quality, end to end', async () => { for (const stage of development) await expect(stage).toHaveQuality(); });";
